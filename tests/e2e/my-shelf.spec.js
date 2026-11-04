import { artColour, expect, goToPlace, mockWeather, nextPaint, roomReady, roomRegion, scrollSettled, skipMoodCheckIn, test } from "./fixtures.js";

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

  test("Start reading moves a book to Currently reading, and Mark as finished moves it on", async ({ page }) => {
    await page.goto("/house/shelf");
    await row(page, "To be read").getByRole("button", { name: /^The Hobbit/ }).click();

    const details = page.getByRole("dialog", { name: "Book details" });
    await expect(details.getByRole("heading", { name: "The Hobbit" })).toBeVisible();
    // one next step, as the library's card has one Add to To be read, not the three shelves
    await expect(details.getByText("Reading status")).toHaveCount(0);
    await expect(details.getByRole("button", { name: "Currently reading", exact: true })).toHaveCount(0);

    await details.getByRole("button", { name: "Start reading" }).click();
    await expect(details.getByRole("button", { name: "Mark as finished" })).toBeVisible();
    await expect(details.getByRole("slider")).toBeVisible();
    await expect(row(page, "Currently reading").getByRole("button", { name: /^The Hobbit/ })).toHaveCount(1);

    await details.getByRole("button", { name: "Mark as finished" }).click();
    await expect(row(page, "Finished reading").getByRole("button", { name: /^The Hobbit/ })).toHaveCount(1);
    // a finished book has nowhere further to go
    await expect(details.getByRole("button", { name: "Mark as finished" })).toHaveCount(0);
    await expect(details.getByRole("button", { name: "Start reading" })).toHaveCount(0);
  });

  test("a move that doesn't save says so, and leaves the book where it was", async ({ page }) => {
    await page.route("**/api/user-books/*", (route) =>
      route.fulfill({ status: 500, json: { error: "The shelf is having a nap." } })
    );
    await page.goto("/house/shelf");
    await row(page, "To be read").getByRole("button", { name: /^The Hobbit/ }).click();

    const details = page.getByRole("dialog", { name: "Book details" });
    await details.getByRole("button", { name: "Start reading" }).click();
    await expect(details.getByRole("alert")).toContainText("Couldn't move");
    await expect(details.getByRole("button", { name: "Start reading" })).toBeEnabled();
    await expect(row(page, "To be read").getByRole("button", { name: /^The Hobbit/ })).toHaveCount(1);
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

// --- One bookcase, three shelves ----------------------------------------------------------------

test.describe("My Shelf is a bookcase", () => {
  test("three shelves top to bottom, each with a plate on its plank naming it and its count", async ({ page }) => {
    const books = await shelfBooks(page);
    await page.goto("/house/shelf");

    let above = -Infinity;
    for (const [status, label] of SHELVES) {
      const count = books.filter((book) => book.status === status).length;
      const plate = row(page, label).getByText(`${label} · ${count}`, { exact: true });
      await expect(plate).toBeVisible();

      // the plate sits on the plank, under the shelf's books, and each shelf is below the last
      const first = await row(page, label).getByRole("listitem").first().boundingBox();
      const { y } = await plate.boundingBox();
      expect(y).toBeGreaterThanOrEqual(first.y + first.height - 4);
      expect(y).toBeGreaterThan(above);
      above = y;
    }
  });

  test("the books stand as spines, upright, each with its title on it", async ({ page }) => {
    const books = await shelfBooks(page);
    await page.goto("/house/shelf");

    // the first book on a shelf, which never leans
    const first = books.find((book) => book.status === "want_to_read");
    const spine = row(page, "To be read").getByRole("button", { name: new RegExp(`^${first.title}`) });
    await expect(spine).toBeVisible();
    await expect(spine).toContainText(first.title);
    await expect(spine.locator("img")).toHaveCount(0);
    // a spine as narrow as the Library's (60px at most, with its outline), far taller than wide
    const { width, height } = await spine.boundingBox();
    expect(width).toBeLessThanOrEqual(64);
    expect(height).toBeGreaterThan(width * 2);
  });
});

// --- The header: an opened Library bookcase's ---------------------------------------------------

test.describe("My Shelf's header, like an opened Library bookcase", () => {
  const back = (page) => page.getByRole("link", { name: "Back to room" });
  const sign = (page) => page.getByRole("heading", { level: 2, name: "My Shelf" });
  const modes = (page) => page.getByRole("group", { name: "Show the books by" });

  test("on a laptop: Back to room on the left, the My Shelf sign in the middle, Spines / Covers on the right", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/house/shelf");
    await expect(sign(page)).toBeVisible();

    const [b, s, m] = await Promise.all([back(page), sign(page), modes(page)].map((part) => part.boundingBox()));
    expect(b.x + b.width).toBeLessThan(s.x);
    expect(s.x + s.width).toBeLessThan(m.x);
    // all on one line
    expect(Math.abs(b.y + b.height / 2 - (s.y + s.height / 2))).toBeLessThan(12);
    // the sign in the middle of the window
    expect(Math.abs(s.x + s.width / 2 - 640)).toBeLessThan(40);
  });

  test("on a phone the sign drops to its own line, under Back and the switch", async ({ page }) => {
    await page.goto("/house/shelf");
    await expect(sign(page)).toBeVisible();
    const [b, s, m] = await Promise.all([back(page), sign(page), modes(page)].map((part) => part.boundingBox()));
    expect(s.y).toBeGreaterThanOrEqual(Math.max(b.y + b.height, m.y + m.height) - 2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(480);
  });

  test("the sign is a gold board with a pixel book, unlike the buttons around it", async ({ page }) => {
    await page.goto("/house/shelf");
    await expect(sign(page).locator("svg")).toBeVisible();
    await expect(sign(page)).toHaveCSS("background-color", "rgb(242, 201, 76)");
    await expect(sign(page)).toHaveCSS("color", "rgb(122, 26, 32)");
    await expect(sign(page)).toHaveCSS("font-family", /Silkscreen/);

    const fill = (part) => part.evaluate((el) => getComputedStyle(el).backgroundColor);
    const buttons = [back(page), modes(page).getByRole("button", { name: "Spines" }), modes(page).getByRole("button", { name: "Covers" })];
    for (const button of buttons) expect(await fill(button)).not.toBe("rgb(242, 201, 76)");
  });

  test("on a phone the sign lines up with the Daily button, and the search has room below them", async ({ page }) => {
    const daily = page.getByRole("button", { name: /^Daily tasks/ });
    await page.goto("/house/shelf");
    await expect(daily).toBeVisible({ timeout: 20_000 });
    // an iPhone; turning to this size also puts the Daily button in its place
    await page.setViewportSize({ width: 390, height: 844 });
    const b = await back(page).boundingBox();
    await expect.poll(async () => (await daily.boundingBox()).y).toBeGreaterThanOrEqual(b.y + b.height);

    const [d, s, search] = await Promise.all([daily, sign(page), page.getByRole("search")].map((part) => part.boundingBox()));
    expect(Math.abs(d.y + d.height / 2 - (s.y + s.height / 2))).toBeLessThanOrEqual(2);
    expect(s.x).toBeGreaterThanOrEqual(d.x + d.width);
    // past the Daily button's 7 px shadow, with space to spare
    expect(search.y - (d.y + d.height)).toBeGreaterThanOrEqual(20);
  });

  test("on a small iPhone a friend's Back button says Back, clear of the switch, and still reads out whose room", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/people/sofia.shelves/room/shelf");
    const link = page.getByRole("link", { name: "Back to Sofia's room" });
    await expect(link).toHaveText("Back", { useInnerText: true });
    const [b, m] = await Promise.all([link, modes(page)].map((part) => part.boundingBox()));
    expect(b.x + b.width).toBeLessThan(m.x);

    // a wider window has room for all of it
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(link).toHaveText("Back to Sofia's room", { useInnerText: true });
  });

  for (const name of ["Sofia Lim", "Bartholomew Lim", "Maximiliano-Alexander Lim"]) {
    test(`on a phone ${name}'s sign stays clear of the Daily button`, async ({ page }) => {
      const first = name.split(" ")[0];
      await page.route("**/api/people**", async (route) => {
        const response = await route.fetch();
        const body = (await response.text()).replaceAll("Sofia Lim", name);
        await route.fulfill({ response, body });
      });
      const daily = page.getByRole("button", { name: /^Daily tasks/ });
      await page.goto("/people/sofia.shelves/room/shelf");
      const heading = page.getByRole("heading", { level: 2, name: `${first}'s Shelf` });
      await expect(heading).toBeVisible();
      await expect(daily).toBeVisible({ timeout: 20_000 });
      await page.setViewportSize({ width: 375, height: 667 });
      await expect.poll(async () => (await daily.boundingBox()).y).toBeGreaterThan(50);

      const [d, s] = await Promise.all([daily, heading].map((part) => part.boundingBox()));
      expect(s.x).toBeGreaterThanOrEqual(d.x + d.width);
      expect(s.x + s.width).toBeLessThanOrEqual(375);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    });
  }

  test("opens on Spines; Covers turns the books face out, and Spines turns them back", async ({ page }) => {
    const books = await shelfBooks(page);
    const first = books.find((book) => book.status === "want_to_read");
    await page.goto("/house/shelf");
    const spines = modes(page).getByRole("button", { name: "Spines" });
    const covers = modes(page).getByRole("button", { name: "Covers" });
    const book = row(page, "To be read").getByRole("button", { name: new RegExp(`^${first.title}`) });
    await expect(spines).toHaveAttribute("aria-pressed", "true");
    await expect(covers).toHaveAttribute("aria-pressed", "false");

    await covers.click();
    await expect(covers).toHaveAttribute("aria-pressed", "true");
    await expect(spines).toHaveAttribute("aria-pressed", "false");
    // face out: a cover the Library's size (100px wide), taller than wide like a book
    await expect.poll(async () => (await book.boundingBox()).width).toBeGreaterThanOrEqual(96);
    const face = await book.boundingBox();
    expect(face.height / face.width).toBeGreaterThan(1.3);
    // every book still on its shelf
    for (const [status, label] of SHELVES) {
      const on = books.filter((one) => one.status === status).length;
      await expect(row(page, label).getByRole("button", { name: / by / })).toHaveCount(on);
    }

    await spines.click();
    await expect.poll(async () => (await book.boundingBox()).width).toBeLessThanOrEqual(64);
  });

  test("a book opened in Covers slides out and opens its card", async ({ page }) => {
    await page.goto("/house/shelf");
    await modes(page).getByRole("button", { name: "Covers" }).click();
    await row(page, "To be read").getByRole("button", { name: /^The Hobbit/ }).click();
    await expect(page.getByRole("dialog", { name: "Book details" })).toBeVisible();
  });
});

// --- Dragging a book to another shelf ------------------------------------------------------------

// Picks `book` up with the mouse, pulling it down (or up) out of its shelf, carries it to the
// middle of what's in view of `target` (a locator, or a point { x, y }), and lets go.
async function dragTo(page, book, target) {
  const from = await book.boundingBox();
  const x = from.x + from.width / 2;
  const y = from.y + from.height / 2;
  let to = target;
  if (!("x" in target)) {
    const box = await target.boundingBox();
    const { height } = page.viewportSize();
    const top = Math.max(box.y, 0);
    const bottom = Math.min(box.y + box.height, height);
    to = { x: box.x + box.width / 2, y: (top + bottom) / 2 };
  }
  await page.mouse.move(x, y);
  await page.mouse.down();
  // straight out of the shelf first, towards the target, then across to it
  await page.mouse.move(x, y + Math.sign(to.y - y || 1) * 30, { steps: 4 });
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.mouse.up();
}

// every save of a book's status, as { id, body }
function statusSaves(page) {
  const saves = [];
  page.on("request", (request) => {
    if (request.method() === "PATCH" && request.url().includes("/api/user-books/")) saves.push(request.postDataJSON());
  });
  return saves;
}

test.describe("dragging a book to another shelf on a laptop", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  const hobbit = (page, label) => row(page, label).getByRole("button", { name: /^The Hobbit/ });

  test("a book dragged from To be read onto Currently reading moves there, and is saved", async ({ page }) => {
    const books = await shelfBooks(page);
    const toRead = books.filter((book) => book.status === "want_to_read").length;
    const reading = books.filter((book) => book.status === "reading").length;
    await page.goto("/house/shelf");
    await expect(hobbit(page, "To be read")).toBeVisible();

    const saved = page.waitForRequest((request) => request.method() === "PATCH" && request.postDataJSON()?.status === "reading");
    await dragTo(page, hobbit(page, "To be read"), row(page, "Currently reading"));
    await saved;

    await expect(hobbit(page, "Currently reading")).toBeVisible();
    await expect(hobbit(page, "To be read")).toHaveCount(0);
    await expect(row(page, "To be read").getByText(`To be read · ${toRead - 1}`, { exact: true })).toBeVisible();
    await expect(row(page, "Currently reading").getByText(`Currently reading · ${reading + 1}`, { exact: true })).toBeVisible();
    // moving it didn't open it
    await expect(page.getByRole("dialog", { name: "Book details" })).toHaveCount(0);
  });

  test("a book dropped on Finished reading is saved as read, all the way through", async ({ page }) => {
    const books = await shelfBooks(page);
    const reading = books.find((book) => book.status === "reading");
    await page.goto("/house/shelf");
    const spine = row(page, "Currently reading").getByRole("button", { name: new RegExp(`^${reading.title}`) });

    const saved = page.waitForRequest((request) => request.method() === "PATCH" && request.postDataJSON()?.status === "read");
    await dragTo(page, spine, row(page, "Finished reading"));
    expect((await saved).postDataJSON()).toMatchObject({ status: "read", progress: 100 });
    await expect(row(page, "Finished reading").getByRole("button", { name: new RegExp(`^${reading.title}`) })).toHaveCount(1);
  });

  test("a book can go back up, past the middle shelf, from Finished reading to To be read", async ({ page }) => {
    const books = await shelfBooks(page);
    const done = books.find((book) => book.status === "read");
    await page.goto("/house/shelf");
    const spine = row(page, "Finished reading").getByRole("button", { name: new RegExp(`^${done.title}`) });
    await spine.scrollIntoViewIfNeeded();

    const saved = page.waitForRequest((request) => request.method() === "PATCH" && request.postDataJSON()?.status === "want_to_read");
    await dragTo(page, spine, row(page, "To be read"));
    await saved;
    await expect(row(page, "To be read").getByRole("button", { name: new RegExp(`^${done.title}`) })).toHaveCount(1);
  });

  test("let go outside the shelves, or back on its own shelf, a book stays where it was", async ({ page }) => {
    const saves = statusSaves(page);
    await page.goto("/house/shelf");
    await expect(hobbit(page, "To be read")).toBeVisible();

    // out to the wall beside the bookcase
    await dragTo(page, hobbit(page, "To be read"), { x: 100, y: 500 });
    await expect(hobbit(page, "To be read")).toBeVisible();
    // and back onto To be read
    await dragTo(page, hobbit(page, "To be read"), row(page, "To be read"));
    await expect(hobbit(page, "To be read")).toBeVisible();

    await nextPaint(page);
    expect(saves).toEqual([]);
    await expect(page.getByRole("dialog", { name: "Book details" })).toHaveCount(0);
  });

  test("Escape puts back the book being carried", async ({ page }) => {
    const saves = statusSaves(page);
    await page.goto("/house/shelf");
    const from = await hobbit(page, "To be read").boundingBox();
    const to = await row(page, "Currently reading").boundingBox();
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2 + 30, { steps: 4 });
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
    await page.keyboard.press("Escape");
    await page.mouse.up();

    await nextPaint(page);
    await expect(hobbit(page, "To be read")).toBeVisible();
    expect(saves).toEqual([]);
  });

  test("a move that can't be saved goes back, and says so", async ({ page }) => {
    await page.route("**/api/user-books/*", (route) => route.fulfill({ status: 500, json: { error: "The shelf is having a nap." } }));
    await page.goto("/house/shelf");
    await dragTo(page, hobbit(page, "To be read"), row(page, "Currently reading"));

    await expect(page.getByRole("alert").filter({ hasText: 'Couldn\'t move "The Hobbit". Try again.' })).toBeVisible();
    await expect(hobbit(page, "To be read")).toBeVisible();
    await expect(hobbit(page, "Currently reading")).toHaveCount(0);
  });

  test("a move is read out", async ({ page }) => {
    await page.goto("/house/shelf");
    await dragTo(page, hobbit(page, "To be read"), row(page, "Currently reading"));
    await expect(page.getByRole("status").filter({ hasText: "The Hobbit moved to Currently reading" })).toHaveCount(1);
  });

  test("a book lying flat in a stack can be moved too", async ({ page }) => {
    await page.goto("/house/shelf");
    const finished = row(page, "Finished reading");
    await finished.scrollIntoViewIfNeeded();
    // the books lying flat are wider than they are tall
    const books = await finished.getByRole("button", { name: / by / }).all();
    let flat = null;
    for (const book of books) {
      const box = await book.boundingBox();
      if (box.width > box.height) flat = book;
    }
    expect(flat).not.toBeNull();
    const name = await flat.getAttribute("aria-label");

    await dragTo(page, flat, row(page, "Currently reading"));
    await expect(row(page, "Currently reading").getByRole("button", { name, exact: true })).toHaveCount(1);
    await expect(finished.getByRole("button", { name, exact: true })).toHaveCount(0);
  });

  test("a cover can be moved in Covers", async ({ page }) => {
    await page.goto("/house/shelf");
    await page.getByRole("group", { name: "Show the books by" }).getByRole("button", { name: "Covers" }).click();
    await dragTo(page, hobbit(page, "To be read"), row(page, "Currently reading"));
    await expect(hobbit(page, "Currently reading")).toBeVisible();
  });

  test("while searching, a book can be moved onto a shelf the search has emptied", async ({ page }) => {
    await page.goto("/house/shelf");
    await page.getByRole("searchbox", { name: "Search your books" }).fill("tolkien");
    await expect(row(page, "Currently reading").getByText("Nothing matches.")).toBeVisible();

    await dragTo(page, hobbit(page, "To be read"), row(page, "Currently reading"));
    await expect(hobbit(page, "Currently reading")).toBeVisible();
    await expect(row(page, "To be read").getByText("Nothing matches.")).toBeVisible();
  });

  test("a friend's books can't be moved", async ({ page }) => {
    const saves = statusSaves(page);
    await page.goto("/people/sofia.shelves/room/shelf");
    const book = row(page, "Currently reading").getByRole("button", { name: /Pride and Prejudice/ });
    await expect(book).toBeVisible();

    await dragTo(page, book, row(page, "To be read"));
    await nextPaint(page);
    await expect(row(page, "Currently reading").getByRole("button", { name: /Pride and Prejudice/ })).toHaveCount(1);
    expect(saves).toEqual([]);
  });
});

// --- Dragging a book on a phone --------------------------------------------------------------------

// A finger on the screen, through Chromium's own touch input (so the browser scrolls under it as
// it would under a real finger).
async function finger(page) {
  const cdp = await page.context().newCDPSession(page);
  const send = (type, points) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points });
  let at = null;
  return {
    async down(x, y) {
      at = { x, y };
      await send("touchStart", [at]);
    },
    async move(x, y, steps = 10) {
      const from = at;
      for (let k = 1; k <= steps; k++) {
        at = { x: from.x + ((x - from.x) * k) / steps, y: from.y + ((y - from.y) * k) / steps };
        await send("touchMove", [at]);
      }
    },
    async up() {
      await send("touchEnd", []);
    },
  };
}

const middle = (box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

test.describe("dragging a book on a phone", () => {
  test.use({ hasTouch: true });

  const hobbit = (page, label) => row(page, label).getByRole("button", { name: /^The Hobbit/ });

  test("press and hold picks a book up, and it moves where it's put down", async ({ page }) => {
    await page.goto("/house/shelf");
    const touch = await finger(page);
    const from = middle(await hobbit(page, "To be read").boundingBox());

    const saved = page.waitForRequest((request) => request.method() === "PATCH" && request.postDataJSON()?.status === "reading");
    await touch.down(from.x, from.y);
    await page.waitForTimeout(550);
    const to = await row(page, "Currently reading").boundingBox();
    await touch.move(to.x + to.width / 2, Math.min(to.y + to.height / 2, 690));
    await touch.up();
    await saved;
    await expect(hobbit(page, "Currently reading")).toHaveCount(1);
    await expect(page.getByRole("dialog", { name: "Book details" })).toHaveCount(0);
  });

  test("a quick swipe up over a book scrolls the page, and moves nothing", async ({ page }) => {
    const saves = statusSaves(page);
    await page.goto("/house/shelf");
    const touch = await finger(page);
    const from = middle(await hobbit(page, "To be read").boundingBox());
    const top = async () => (await row(page, "To be read").boundingBox()).y;
    const before = await top();

    await touch.down(from.x, from.y);
    await touch.move(from.x, from.y - 200, 8);
    await touch.up();
    await expect.poll(top).toBeLessThan(before - 50);
    await nextPaint(page);
    await expect(hobbit(page, "To be read")).toHaveCount(1);
    expect(saves).toEqual([]);
  });

  test("a book held at the bottom edge scrolls the page down to a shelf out of view", async ({ page }) => {
    await page.goto("/house/shelf");
    const finished = row(page, "Finished reading");
    // Finished reading starts below the screen
    expect((await finished.boundingBox()).y).toBeGreaterThan(720);
    const touch = await finger(page);
    const from = middle(await hobbit(page, "To be read").boundingBox());

    await touch.down(from.x, from.y);
    await page.waitForTimeout(550);
    await touch.move(from.x, 710);
    await expect.poll(async () => (await finished.boundingBox()).y).toBeLessThan(560);
    const to = await finished.boundingBox();
    await touch.move(to.x + to.width / 2, Math.min(to.y + 80, 600), 4);
    await touch.up();
    await expect(hobbit(page, "Finished reading")).toHaveCount(1);
  });
});

// --- In the room's colours ----------------------------------------------------------------------

// the colour on screen at (x, y), as "r,g,b"
async function screenColour(page, x, y) {
  const shot = await page.screenshot({ clip: { x, y, width: 1, height: 1 } });
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3).join(",");
  }, shot.toString("base64"));
}

const near = (a, b) => a.split(",").every((value, k) => Math.abs(value - b.split(",")[k]) <= 20);

test.describe("My Shelf in the room's colours", () => {
  // bare wall in the room's picture, above its bookshelf (as room-themes.spec.js reads it)
  const WALL = [600, 80];
  const HOUSES = [
    ["my", "/house", "/house/shelf", "To be read"],
    ["Sofia's", "/people/sofia.shelves/room", "/people/sofia.shelves/room/shelf", "Finished reading"],
  ];

  // the room's wall, then what's beside the bookcase and on its plank, on a laptop
  async function colours(page, [, room, shelf, label]) {
    await page.goto(room);
    await roomReady(page);
    const wall = await artColour(page, ...WALL);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(shelf);
    const plate = row(page, label).getByText(new RegExp(`^${label} · \\d+$`));
    await expect(plate).toBeVisible();
    await plate.scrollIntoViewIfNeeded();
    const box = await plate.boundingBox();
    return {
      wall,
      beside: await screenColour(page, 40, Math.round(box.y)),
      // the plank, just left of the plate
      plank: await screenColour(page, Math.round(box.x - 5), Math.round(box.y + box.height / 2)),
    };
  }

  for (const house of HOUSES) {
    test(`${house[0]} shelf stands against ${house[0] === "my" ? "my" : "her"} room's wall`, async ({ page }) => {
      const { wall, beside } = await colours(page, house);
      expect(near(beside, wall), `${beside} is the wall ${wall}`).toBe(true);
    });
  }

  test("each house's bookcase is in its own wood", async ({ page }) => {
    const mine = await colours(page, HOUSES[0]);
    await page.setViewportSize({ width: 480, height: 720 });
    const sofias = await colours(page, HOUSES[1]);
    expect(mine.wall).not.toBe(sofias.wall);
    expect(mine.plank).not.toBe(sofias.plank);
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
    await expect(card(page).getByRole("button", { name: "Start reading" })).toBeVisible();
    await expect(card(page).getByRole("link", { name: "Open full book page" })).toHaveAttribute("href", `/books/${id}`);

    await card(page).getByRole("button", { name: "Close book" }).click();
    await expect(card(page)).toBeHidden();
    await expect(hobbit(page)).toBeFocused();
  });

  test("is laid out like the library's card: no shelf line, and the reviews behind Read reviews", async ({ page }) => {
    // no line above the title naming the shelf
    await expect(card(page).getByText("To be read", { exact: true })).toHaveCount(0);

    const reviews = card(page).getByRole("region", { name: "Reviews" });
    await expect(reviews).toBeHidden();
    await card(page).getByRole("button", { name: /^Read reviews/ }).click();
    await expect(reviews).toBeVisible();
    await expect(reviews.getByText("Rate this book")).toBeVisible();

    await card(page).getByRole("button", { name: "Hide reviews" }).click();
    await expect(reviews).toBeHidden();
  });

  test("a To be read book offers Where to get, as the library does; a started book doesn't", async ({ page }) => {
    await card(page).getByRole("button", { name: "Where to get" }).click();
    await expect(card(page).getByRole("region", { name: "Where to get this book" })).toBeVisible();

    await card(page).getByRole("button", { name: "Start reading" }).click();
    await expect(card(page).getByRole("button", { name: "Mark as finished" })).toBeEnabled();
    await expect(card(page).getByRole("button", { name: "Where to get" })).toHaveCount(0);

    await card(page).getByRole("button", { name: "Mark as finished" }).click();
    await expect(card(page).getByRole("button", { name: "Mark as finished" })).toHaveCount(0);
    await expect(card(page).getByRole("button", { name: "Where to get" })).toHaveCount(0);
  });

  test("Reading shows a progress slider, and moving it saves", async ({ page }) => {
    await expect(card(page).getByRole("slider")).toHaveCount(0);
    await card(page).getByRole("button", { name: "Start reading" }).click();
    await expect(card(page).getByRole("button", { name: "Mark as finished" })).toBeVisible();

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
    // the shelf's books in the order they stand (two lying flat share a place on the shelf)
    const cover = (n) => covers(page).getByRole("button").nth(n);
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
