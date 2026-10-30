import { expect, goToPlace, mockWeather, nextPaint, roomReady, roomRegion, scrollSettled, skipMoodCheckIn, test } from "./fixtures.js";

// a phone-sized window, where the room is wider than the screen (the laptop view has its own
// journey, house-desktop.spec.js)
test.use({ viewport: { width: 480, height: 720 } });

// My Shelf: every book on the reader's shelf, opened from the bookshelf in My Room. Saves are
// answered here, so the shared demo shelf stays as it was for the other tests.
const SHELVES = [
  ["want_to_read", "To be read"],
  ["reading", "Currently reading"],
  ["read", "Finished reading"],
];

test.beforeEach(async ({ page }) => {
  await skipMoodCheckIn(page);
  await mockWeather(page);
  await page.route("**/api/user-books/*", (route) => route.fulfill({ json: { userBook: {} } }));
});

// What's on the demo shelf, from the API itself: the expected rows and counts follow the data
// rather than numbers copied into the tests.
async function shelfBooks(page) {
  const { books } = await (await page.request.get("/api/user-books")).json();
  return books;
}

const row = (page, label) => page.getByRole("region", { name: new RegExp(`^${label}, \\d+ books?$`) });

test.describe("the shelf in the room and My Shelf", () => {
  test("the bookshelf in the room has its rows labelled, top to bottom", async ({ page }) => {
    await page.goto("/house");
    await roomReady(page);
    await goToPlace(page, "Bookshelf");

    let above = -Infinity;
    for (const [, label] of SHELVES) {
      const plate = page.getByText(new RegExp(`^${label} shelf, \\d+ books?$`));
      await expect(plate).toBeVisible();
      const { y } = await plate.boundingBox();
      expect(y).toBeGreaterThan(above);
      above = y;
    }
  });

  test("My Shelf has a row for each shelf, with its books", async ({ page }) => {
    const books = await shelfBooks(page);
    await page.goto("/house/shelf");

    for (const [status, label] of SHELVES) {
      const on = books.filter((book) => book.status === status);
      await expect(row(page, label)).toHaveAccessibleName(`${label}, ${on.length} ${on.length === 1 ? "book" : "books"}`);
      for (const book of on) {
        await expect(row(page, label).getByRole("button", { name: new RegExp(`^${book.title}`) })).toHaveCount(1);
      }
    }
  });

  test("the genre chips come from the reader's books, and one chip filters every row", async ({ page }) => {
    const books = await shelfBooks(page);
    const counts = new Map();
    for (const book of books) for (const genre of new Set(book.genres ?? [])) counts.set(genre, (counts.get(genre) ?? 0) + 1);
    const genres = [...counts].sort(([a, x], [b, y]) => y - x || a.localeCompare(b)).map(([genre]) => genre);
    await page.goto("/house/shelf");

    const chips = page.getByRole("group", { name: "Filter by genre" }).getByRole("button");
    await expect(chips).toHaveText(["All", ...genres]);
    await expect(chips.first()).toHaveAttribute("aria-pressed", "true");

    const genre = genres[0];
    await chips.filter({ hasText: genre }).click();
    await expect(chips.filter({ hasText: genre })).toHaveAttribute("aria-pressed", "true");
    for (const [status, label] of SHELVES) {
      const on = books.filter((book) => book.status === status && (book.genres ?? []).includes(genre));
      await expect(row(page, label)).toHaveAccessibleName(`${label}, ${on.length} ${on.length === 1 ? "book" : "books"}`);
    }
  });

  test("the search narrows the rows to books by title or author", async ({ page }) => {
    await page.goto("/house/shelf");
    await page.getByRole("searchbox", { name: "Search your books" }).fill("tolkien");

    await expect(row(page, "To be read").getByRole("button", { name: /^The Hobbit/ })).toBeVisible();
    await expect(row(page, "To be read")).toHaveAccessibleName("To be read, 1 book");
    await expect(row(page, "Currently reading").getByText("Nothing matches.")).toBeVisible();
    await expect(row(page, "Finished reading").getByText("Nothing matches.")).toBeVisible();
  });

  test("a book moved to Reading from its card moves to Currently reading", async ({ page }) => {
    await page.goto("/house/shelf");
    await row(page, "To be read").getByRole("button", { name: /^The Hobbit/ }).click();

    const details = page.getByRole("dialog", { name: "Book details" });
    await expect(details.getByText("To be read", { exact: true })).toBeVisible();
    await details.getByRole("button", { name: "Reading", exact: true }).click();
    await expect(details.getByText("Currently reading", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Close book" }).click();

    await expect(row(page, "Currently reading").getByRole("button", { name: /^The Hobbit/ })).toBeVisible();
    await expect(row(page, "To be read").getByRole("button", { name: /^The Hobbit/ })).toHaveCount(0);
  });

  test("Back to room goes back to the room, where it was", async ({ page }) => {
    await page.goto("/house");
    await roomReady(page);
    await goToPlace(page, "Bookshelf");
    const room = roomRegion(page);
    const left = await room.evaluate((el) => el.scrollLeft);
    expect(left).toBeGreaterThan(0);

    await page.getByRole("button", { name: /^Bookshelf, \d+ books$/ }).click({ position: { x: 8, y: 8 } });
    await expect(page).toHaveURL(/\/house\/shelf$/);
    await page.getByRole("link", { name: "Back to room" }).click();

    await expect(page).toHaveURL(/\/house$/);
    await expect(page.getByRole("button", { name: /^Bookshelf, \d+ books$/ })).toBeVisible();
    await expect.poll(() => room.evaluate((el) => el.scrollLeft)).toBeCloseTo(left, -1);
  });

  test("a shelf that cannot load says so, and Retry tries again", async ({ page }) => {
    let fail = true;
    await page.route("**/api/user-books", (route) =>
      fail ? route.fulfill({ status: 500, json: { error: "The shelf is having a nap." } }) : route.fallback()
    );
    await page.goto("/house/shelf");

    const retry = page.getByRole("button", { name: "Retry" });
    await expect(retry).toBeVisible();
    fail = false;
    await retry.click();
    await expect(row(page, "To be read")).toBeVisible();
  });
});

// --- Headed shelves, the same part as a genre's shelves --------------------------------------

// how a shelf's header card and the plank under it look, to set My Shelf beside a genre page
function tierLook(tier) {
  return tier.evaluate((el) => {
    const pick = (node, keys) => {
      const style = getComputedStyle(node);
      return Object.fromEntries(keys.map((key) => [key, style[key]]));
    };
    const head = el.querySelector(".shelf-tier__head");
    return {
      head: pick(head, ["backgroundColor", "borderTopWidth", "borderTopStyle", "borderTopColor", "borderRadius", "boxShadow"]),
      heading: pick(head.querySelector("h2, h3"), ["fontFamily", "fontWeight", "fontSize", "color"]),
      plank: pick(el.querySelector(".shelf-tier__plank"), ["height", "backgroundImage", "borderTopColor"]),
    };
  });
}

test.describe("each shelf under its own heading", () => {
  test("every row on My Shelf has a header card, and a plank parts it from the next", async ({ page }) => {
    await page.goto("/house/shelf");

    let below = -Infinity;
    for (const [, label] of SHELVES) {
      const tier = row(page, label).locator(".shelf-tier");
      await expect(tier).toHaveCount(1);
      const head = tier.locator(".shelf-tier__head");
      await expect(head.getByRole("heading", { name: new RegExp(`${label} · \\d+`) })).toBeVisible();

      // a card, not text floating on the page
      const { backgroundColor, borderTopWidth } = (await tierLook(tier)).head;
      expect(backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      expect(parseFloat(borderTopWidth)).toBeGreaterThan(0);

      // the plank sits under the row's covers, and the next header starts below it
      const top = (await head.boundingBox()).y;
      expect(top).toBeGreaterThan(below);
      const plank = await tier.locator(".shelf-tier__plank").boundingBox();
      expect(plank.height).toBeGreaterThan(0);
      below = plank.y + plank.height;
    }
  });

  test("My Shelf's shelves look like a genre page's shelves", async ({ page }) => {
    const books = Array.from({ length: 8 }, (_, i) => ({ id: `tier-${i}`, title: `Tier book ${i + 1}`, authors: ["A. Writer"], coverUrl: "" }));
    await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books } }));
    await page.goto("/discover/fantasy");
    const genreTier = page.locator(".shelf-tier").first();
    await expect(genreTier.getByRole("heading", { name: "Shelf 1" })).toBeVisible();
    const genreLook = await tierLook(genreTier);

    await page.goto("/house/shelf");
    const shelfTier = row(page, "To be read").locator(".shelf-tier");
    await expect(shelfTier.getByRole("heading", { name: /To be read/ })).toBeVisible();
    expect(await tierLook(shelfTier)).toEqual(genreLook);
  });
});

// --- A book's card: the genre page's card -----------------------------------------------------

test.describe("a book's card on My Shelf", () => {
  const card = (page) => page.getByRole("dialog", { name: "Book details" });
  const hobbit = (page) => row(page, "To be read").getByRole("button", { name: /^The Hobbit/ });

  test.beforeEach(async ({ page }) => {
    await page.goto("/house/shelf");
    await hobbit(page).click();
    await expect(card(page)).toBeVisible();
  });

  test("is the genre page's card, and closing it goes back to the cover", async ({ page }) => {
    const { id } = (await shelfBooks(page)).find((book) => book.title === "The Hobbit");
    await expect(card(page).getByRole("heading", { name: "The Hobbit" })).toBeVisible();
    await expect(card(page).getByText("Reading status")).toBeVisible();
    await expect(card(page).getByRole("button", { name: "Want to Read" })).toHaveAttribute("aria-pressed", "true");
    await expect(card(page).getByRole("link", { name: "Open full book page" })).toHaveAttribute("href", `/books/${id}`);

    await card(page).getByRole("button", { name: "Close book" }).click();
    await expect(card(page)).toBeHidden();
    await expect(hobbit(page)).toBeFocused();
  });

  test("Reading shows a progress slider, and moving it saves", async ({ page }) => {
    await expect(card(page).getByRole("slider")).toHaveCount(0);
    await card(page).getByRole("button", { name: "Reading", exact: true }).click();
    await expect(card(page).getByRole("button", { name: "Reading", exact: true })).toHaveAttribute("aria-pressed", "true");

    const saved = page.waitForRequest((request) => request.method() === "PATCH" && request.postDataJSON()?.progress === 40);
    await card(page).getByRole("slider").fill("40");
    await saved;
    await expect(card(page).getByText("40% read")).toBeVisible();
  });

  test("Remove from shelf takes it off, and Undo puts it back", async ({ page }) => {
    await page.route("**/api/user-books", (route) =>
      route.request().method() === "POST" ? route.fulfill({ json: { userBook: {} } }) : route.fallback()
    );
    await card(page).getByRole("button", { name: "Remove from shelf" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Yes, remove" }).click();

    await expect(card(page)).toBeHidden();
    await expect(hobbit(page)).toHaveCount(0);
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(hobbit(page)).toHaveCount(1);
  });

  test("Open full book page goes to the book's page", async ({ page }) => {
    await card(page).getByRole("link", { name: "Open full book page" }).click();
    await expect(page).toHaveURL(/\/books\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1, name: "The Hobbit" })).toBeVisible();
  });
});

// --- Rows that scroll sideways, on a laptop ---------------------------------------------------

test.describe("a long row on a laptop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  // twenty more books to read, so the To be read row is far wider than the window
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/user-books", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      const response = await route.fetch();
      const { books, ...rest } = await response.json();
      const extra = Array.from({ length: 20 }, (_, k) => ({
        ...books[0],
        id: `long-row-${k + 1}`,
        title: `Long Row Book ${k + 1}`,
        authors: ["Row Writer"],
        status: "want_to_read",
      }));
      await route.fulfill({ json: { ...rest, books: [...books, ...extra] } });
    });
    await page.goto("/house/shelf");
    await expect(row(page, "To be read").getByRole("button", { name: /^Long Row Book 1\b/ })).toBeVisible();
    // the app's opening screen has gone from over the page
    await expect(page.getByText("Opening your shelf")).toBeHidden();
  });

  const toRead = (page) => row(page, "To be read");
  const covers = (page) => toRead(page).getByRole("list").first();
  const across = (page) => covers(page).evaluate((el) => ({ left: el.scrollLeft, most: el.scrollWidth - el.clientWidth }));

  test("Next and Previous page through the row, each off at its end", async ({ page }) => {
    const previous = toRead(page).getByRole("button", { name: "Previous books in To be read" });
    const next = toRead(page).getByRole("button", { name: "Next books in To be read" });
    await expect(previous).toBeDisabled();
    await expect(next).toBeEnabled();

    await next.click();
    await expect.poll(async () => (await across(page)).left).toBeGreaterThan(200);
    await expect(previous).toBeEnabled();

    // to the end: the last book in view, Next off
    for (let n = 0; n < 10 && (await next.isEnabled()); n++) {
      await next.click();
      await scrollSettled(covers(page));
    }
    await expect(next).toBeDisabled();
    await expect(toRead(page).getByRole("button", { name: /^Long Row Book 20\b/ })).toBeInViewport();
  });

  test("a sideways swipe scrolls the row; a plain wheel scrolls the page, not the row", async ({ page }) => {
    const box = await covers(page).boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + 60);
    await page.mouse.wheel(400, 0);
    await expect.poll(async () => (await across(page)).left).toBeGreaterThan(100);

    // once it has settled on a cover, a plain wheel moves the page up (the row with it) and leaves
    // the row where it was
    await scrollSettled(covers(page));
    const left = (await across(page)).left;
    const rowTop = async () => (await toRead(page).boundingBox()).y;
    const before = await rowTop();
    await page.mouse.wheel(0, 300);
    await expect.poll(rowTop).toBeLessThan(before);
    expect((await across(page)).left).toBe(left);
  });

  test("dragging the row with the mouse scrolls it without opening a book; a click opens one", async ({ page }) => {
    const box = await covers(page).boundingBox();
    const y = box.y + 60;
    await page.mouse.move(box.x + 600, y);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, y, { steps: 8 });
    await page.mouse.up();
    await expect.poll(async () => (await across(page)).left).toBeGreaterThan(200);
    // the drag's click would have opened a book by the next paint
    await nextPaint(page);
    await expect(page.getByRole("dialog", { name: "Book details" })).toHaveCount(0);

    await toRead(page).getByRole("button", { name: /^Long Row Book 9\b/ }).click();
    await expect(page.getByRole("dialog", { name: "Book details" })).toBeVisible();
  });

  test("the arrow keys move along the row, keeping the cover in view, and Tab leaves the row", async ({ page }) => {
    const cover = (n) => toRead(page).getByRole("listitem").nth(n).getByRole("button");
    await cover(0).focus();
    for (let n = 0; n < 14; n++) await page.keyboard.press("ArrowRight");
    await expect(cover(14)).toBeFocused();
    await expect(cover(14)).toBeInViewport({ ratio: 1 });
    expect((await across(page)).left).toBeGreaterThan(0);

    await page.keyboard.press("ArrowLeft");
    await expect(cover(13)).toBeFocused();

    // one Tab and focus is out of this row's covers (on the next row's buttons or covers)
    await page.keyboard.press("Tab");
    expect(await toRead(page).getByRole("list").first().evaluate((el) => el.contains(document.activeElement))).toBe(false);
  });

  test("a row whose covers all fit has no Previous or Next", async ({ page }) => {
    const reading = row(page, "Currently reading");
    await expect(reading.getByRole("listitem").first()).toBeVisible();
    await expect(reading.getByRole("button", { name: /^(Previous|Next) books in/ })).toHaveCount(0);
  });
});
