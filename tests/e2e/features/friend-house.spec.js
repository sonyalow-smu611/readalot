// Scaffolded with AI assistance — see AI_USAGE.md
import { test as base, expect, fitsScreen } from "./fixtures.js";
import { REAL_API, goToPlace, mockQuote, mockTime, mockWeather, roomReady, townReady, useRealApi } from "../fixtures.js";
import { createReader, makeFriends, readProfile, seedReaderBook, setDiscoverable } from "../supabaseUser.js";

const auth = (account) => ({ Authorization: `Bearer ${account.session.access_token}` });
const row = (page, name) => page.getByRole("region", { name: new RegExp(`^${name},`) });
const card = (page) => page.getByRole("dialog", { name: /^Quick preview:/ });

const test = base.extend({
  friend: async ({ page, request, reader }, use) => {
    const owner = await createReader({ profile: { name: "Mina Friend", favouriteGenres: ["Fantasy"] } });
    const books = [];
    try {
      await setDiscoverable(owner.id, true);
      await makeFriends(reader.id, owner.id);
      for (const [title, genre, status, progress] of [
        ["Mina's Unread Novel", "Fantasy", "want_to_read", 0],
        ["Mina's Current Novel", "Mystery", "reading", 40],
        ["Mina's Finished Novel", "Fantasy", "read", 100],
      ]) {
        const metadata = { title, authors: ["Test Author"], genres: [genre], description: `The full synopsis of ${title}.` };
        const seeded = await seedReaderBook(owner.id, metadata);
        books.push({ ...seeded, ...metadata, status, progress });
        const saved = await request.patch(`${REAL_API}/api/user-books/${seeded.id}`, {
          headers: auth(owner), data: { status, progress },
        });
        expect(saved.ok()).toBe(true);
      }
      const pieces = [
        { uid: "friend-poster", id: "poster-moon", zone: "wall", x: 0.38, at: { x: 470, y: 188 } },
        { uid: "friend-chair", id: "chair-wingback", zone: "chair", x: 0.28 },
      ];
      const furnished = await request.put(`${REAL_API}/api/rooms/${owner.id}/furniture`, { headers: auth(owner), data: { pieces } });
      expect(furnished.ok()).toBe(true);
      const { username } = await readProfile(owner.id);

      // Friendships, shelves, notes and furniture all use the real API/database. Only the
      // external catalogue lookup is fixed: these unique test books do not exist on Google.
      await useRealApi(page);
      await mockWeather(page);
      await mockTime(page);
      await mockQuote(page);
      for (const book of books) {
        await page.route(`**/api/books/${book.id}`, (route) => route.fulfill({ json: { book: { ...book, coverUrl: "" } } }));
      }
      const snapshot = async () => {
        const shelf = await request.get(`${REAL_API}/api/user-books`, { headers: auth(owner) });
        const furniture = await request.get(`${REAL_API}/api/rooms/${owner.id}/furniture`, { headers: auth(owner) });
        expect(shelf.ok()).toBe(true);
        expect(furniture.ok()).toBe(true);
        return {
          books: (await shelf.json()).books.map(({ id, status, progress }) => ({ id, status, progress })).sort((a, b) => a.id.localeCompare(b.id)),
          pieces: (await furniture.json()).pieces,
        };
      };
      await use({ owner, username, books, pieces, snapshot });
    } finally {
      try {
        for (const book of books) {
          await request.delete(`${REAL_API}/api/books/${book.id}/reviews`, { headers: auth(reader) });
          await request.delete(`${REAL_API}/api/user-books/${book.id}`, { headers: auth(reader) });
          await book.remove();
        }
      } finally {
        await owner.remove();
      }
    }
  },
});

async function enterFriendHouse(page, friend, via = "Friends") {
  await page.goto("/");
  await townReady(page);
  if (via === "Friends") {
    await page.getByRole("button", { name: /^Friends/ }).click();
    await page.getByRole("navigation", { name: "Friends in town" }).getByRole("button", { name: /^Mina Friend,/ }).click();
  } else {
    await page.getByRole("button", { name: "Places", exact: true }).click();
    await page.getByRole("navigation", { name: "Places in town" }).getByRole("button", { name: /^Mina's house/ }).click();
  }
  await page.getByRole("dialog", { name: "Mina's house" }).getByRole("button", { name: "Visit Mina", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === `/people/${friend.username}/room` && url.searchParams.get("from") === "town", { timeout: 20_000 });
  await roomReady(page);
  await expect(page.getByRole("button", { name: "Bookshelf, 3 books" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^(Room menu|Shop|Inventory)$/ })).toHaveCount(0);
}

async function openShelf(page) {
  await goToPlace(page, "Bookshelf");
  await page.getByRole("button", { name: "Bookshelf, 3 books" }).click({ position: { x: 8, y: 8 } });
  for (const name of ["To be read", "Currently reading", "Finished reading"]) {
    await expect(row(page, name)).toHaveAttribute("aria-label", `${name}, 1 book`);
  }
}

function watchEdits(page) {
  const writes = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method()) &&
        (path.startsWith("/api/user-books") || (path.startsWith("/api/rooms/") && path.endsWith("/furniture")))) writes.push(`${request.method()} ${path}`);
  });
  return writes;
}

// Use a real moving finger for iPhone emulation; Playwright's touchscreen API only taps.
async function dragAttempt(page, context, from, to, phone, hold = false, target = null) {
  const destination = async () => {
    if (!target) return to;
    // On a phone the next shelf can be below the fold. Reveal it while the pointer is held,
    // then release over that shelf, rather than accidentally dropping back on the source.
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    return { x: box.x + 30, y: Math.max(15, Math.min(box.y + 35, page.viewportSize().height - 20)) };
  };
  if (phone) {
    const cdp = await context.newCDPSession(page);
    try {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...from, id: 0 }] });
      if (hold) await page.waitForTimeout(600); // The owner's long-press pickup gesture.
      to = await destination();
      for (let step = 1; step <= 12; step++) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: from.x + (to.x - from.x) * step / 12, y: from.y + (to.y - from.y) * step / 12, id: 0 }] });
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    } finally {
      await cdp.detach();
    }
  } else {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    if (hold) await page.waitForTimeout(600);
    to = await destination();
    await page.mouse.move(to.x, to.y, { steps: 12 });
    await page.mouse.up();
  }
}

test("FRIEND-01 town friend house: bookshelf, book actions and full page leave the owner's books unchanged", async ({ page, friend, request, reader }) => {
  test.setTimeout(120_000);
  const before = await friend.snapshot();
  const book = friend.books[0];
  await test.step("Enter the accepted friend's house from the town Friends list", async () => {
    await enterFriendHouse(page, friend);
    await goToPlace(page, "Bookshelf");
    await page.getByRole("button", { name: `${book.title} by Test Author`, exact: true }).click();
    await expect(card(page)).toContainText(book.description);
    await expect(card(page).getByRole("slider")).toHaveCount(0);
    await card(page).getByRole("button", { name: "Close", exact: true }).click();
    await openShelf(page);
  });
  await test.step("Inspect all three shelves, both display modes and the book preview actions", async () => {
    const modes = page.getByRole("group", { name: "Show the books by" });
    for (const mode of ["Spines", "Covers"]) {
      await modes.getByRole("button", { name: mode, exact: true }).click();
      await expect(modes.getByRole("button", { name: mode, exact: true })).toHaveAttribute("aria-pressed", "true");
    }
    await row(page, "To be read").getByRole("button", { name: `${book.title} by Test Author`, exact: true }).click();
    await expect(card(page)).toContainText(book.description);
    await expect(card(page).getByRole("button", { name: /^(Start reading|Mark as finished|Remove from shelf)$/ })).toHaveCount(0);
    await card(page).getByRole("button", { name: "Add to To be read", exact: true }).click();
    await expect(card(page).getByRole("status")).toContainText("On your To be read shelf");
    const mine = await request.get(`${REAL_API}/api/user-books`, { headers: auth(reader) });
    expect((await mine.json()).books.some((entry) => entry.id === book.id && entry.status === "want_to_read")).toBe(true);
    await card(page).getByRole("button", { name: "Undo", exact: true }).click();
    await expect(card(page).getByRole("button", { name: "Add to To be read", exact: true })).toBeVisible();
    await card(page).getByRole("button", { name: "Where to get", exact: true }).click();
    await expect(card(page).getByRole("region", { name: "Where to get this book" })).toBeVisible();
    await card(page).getByRole("button", { name: /^Leave\/Read Reviews/ }).click();
    await expect(card(page).getByRole("region", { name: "Reviews" })).toBeVisible();
    await card(page).getByRole("button", { name: "Hide reviews", exact: true }).click();
    await card(page).getByRole("link", { name: "Open full book page", exact: true }).click();
  });
  await test.step("Use the full book page and return to the friend's shelf", async () => {
    await expect(page).toHaveURL(new RegExp(`/books/${book.id}$`));
    await expect(page.getByRole("heading", { level: 1, name: book.title, exact: true })).toBeVisible();
    await expect(page.getByRole("group", { name: "Reading status" })).toHaveCount(0);
    await expect(page.getByRole("slider")).toHaveCount(0);
    await page.getByRole("button", { name: "Where to get", exact: true }).click();
    await expect(page.getByRole("region", { name: "Where to get this book" })).toBeVisible();
    const reviews = page.getByRole("region", { name: "Reviews" });
    await reviews.getByRole("radio", { name: "4 stars", exact: true }).check();
    await reviews.getByRole("textbox", { name: "Your review (optional)" }).fill("Found this on my friend's shelf.");
    await reviews.getByRole("button", { name: "Post Review", exact: true }).click();
    await expect(reviews).toContainText("Found this on my friend's shelf.");
    await reviews.getByRole("button", { name: "Delete your review", exact: true }).click();
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname === `/people/${friend.username}/room/shelf`);
    await page.reload();
    await expect(row(page, "To be read").getByRole("button", { name: `${book.title} by Test Author`, exact: true })).toBeVisible();
    expect(await friend.snapshot()).toEqual(before);
    await fitsScreen(page);
  });
});

test("FRIEND-02 accepted friend: dragging books or furniture cannot edit the owner's saved room", async ({ page, context, friend, request, reader }, testInfo) => {
  test.setTimeout(120_000);
  const before = await friend.snapshot();
  await enterFriendHouse(page, friend);
  const writes = watchEdits(page);
  await test.step("Tap and long-press a placed piece: no furniture editor or saved move", async () => {
    await goToPlace(page, "Chair");
    const poster = page.getByRole("button", { name: "Moon poster", exact: true });
    await poster.click();
    await expect(page.getByRole("button", { name: /^(Move(?: .*)?|Remove(?: .*)?|Done)$/ })).toHaveCount(0);
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    const box = await poster.boundingBox();
    const from = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await dragAttempt(page, context, from, { x: from.x + 35, y: from.y }, testInfo.project.name === "iphone", true);
    await expect(page.getByRole("button", { name: /^(Move left|Move right|Place in the middle)$/ })).toHaveCount(0);
  });
  await test.step("Try dragging a book across shelves in Covers and Spines", async () => {
    await openShelf(page);
    const book = friend.books[0];
    for (const mode of ["Covers", "Spines"]) {
      await page.getByRole("group", { name: "Show the books by" }).getByRole("button", { name: mode, exact: true }).click();
      const source = row(page, "To be read").getByRole("button", { name: `${book.title} by Test Author`, exact: true });
      await source.scrollIntoViewIfNeeded();
      const start = await source.boundingBox();
      const target = await row(page, "Currently reading").boundingBox();
      const from = { x: start.x + start.width / 2, y: start.y + start.height / 2 };
      const to = { x: Math.min(target.x + 30, page.viewportSize().width - 15), y: Math.min(target.y + 35, page.viewportSize().height - 20) };
      await dragAttempt(page, context, from, to, testInfo.project.name === "iphone", true, row(page, "Currently reading"));
      await expect(source).toHaveCount(1);
      await expect(row(page, "To be read")).toHaveAttribute("aria-label", "To be read, 1 book");
      await expect(row(page, "Currently reading")).toHaveAttribute("aria-label", "Currently reading, 1 book");
      if (await card(page).isVisible()) await card(page).getByRole("button", { name: "Close", exact: true }).click();
    }
    expect(writes).toEqual([]);
    expect(await friend.snapshot()).toEqual(before);
  });
  await test.step("The API also refuses a visitor furniture write; reload retains the owner's layout", async () => {
    const refused = await request.put(`${REAL_API}/api/rooms/${friend.username}/furniture`, { headers: auth(reader), data: { pieces: [] } });
    expect(refused.status()).toBe(403);
    await page.reload();
    await expect(row(page, "To be read")).toHaveAttribute("aria-label", "To be read, 1 book");
    await page.getByRole("link", { name: "Back to Mina's room", exact: true }).click();
    await roomReady(page);
    await goToPlace(page, "Chair");
    await expect(page.getByRole("button", { name: "Moon poster", exact: true })).toBeVisible();
    expect(await friend.snapshot()).toEqual(before);
  });
});

test("FRIEND-03 town Places → friend's noticeboard: a visitor can leave a note that the owner sees", async ({ page, friend, request, reader }) => {
  test.setTimeout(120_000);
  const before = await friend.snapshot();
  await enterFriendHouse(page, friend, "Places");
  await goToPlace(page, "Corkboard");
  await page.getByRole("button", { name: "Notice board", exact: true }).click();
  const board = page.getByRole("dialog", { name: "Notice board", exact: true });
  await board.getByRole("button", { name: "Leave a note", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Leave a note for Mina", exact: true });
  await expect(form.getByRole("button", { name: "Post note", exact: true })).toBeDisabled();
  const content = "Thanks for showing me your reading room!";
  await form.getByRole("textbox", { name: "Your note", exact: true }).fill(content);
  await form.getByRole("button", { name: "Post note", exact: true }).click();
  await expect(form).toBeHidden();
  const response = await request.get(`${REAL_API}/api/rooms/${friend.owner.id}/notes`, { headers: auth(friend.owner) });
  expect(response.ok()).toBe(true);
  expect((await response.json()).notes).toEqual(expect.arrayContaining([expect.objectContaining({ text: content, authorId: reader.id })]));
  await page.reload();
  await roomReady(page);
  await goToPlace(page, "Corkboard");
  await page.getByRole("button", { name: "Notice board", exact: true }).click();
  const note = board.getByRole("listitem").filter({ hasText: content });
  await expect(note).toBeVisible();
  await expect(note).toContainText("From Reader");
  await note.getByRole("button", { name: "Take down", exact: true }).click();
  await expect(note).toHaveCount(0);
  expect(await friend.snapshot()).toEqual(before);
  await board.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("link", { name: "Back to town", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await townReady(page);
});
