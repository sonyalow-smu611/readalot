import { expect, test } from "./fixtures.js";

// My Shelf: every book on the reader's shelf, opened from the bookshelf in My Room. Saves are
// answered here, so the shared demo shelf stays as it was for the other tests.
const SHELVES = [
  ["want_to_read", "To be read"],
  ["reading", "Currently reading"],
  ["read", "Finished reading"],
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // today's mood check-in already answered, so it does not open over the room
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    localStorage.setItem("readalot.moodCheckIn", `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  });
  await page.route("**/api/user-books/*", (route) => route.fulfill({ json: { userBook: {} } }));
});

async function shelfBooks(page) {
  const { books } = await (await page.request.get("/api/user-books")).json();
  return books;
}

const row = (page, label) => page.getByRole("region", { name: new RegExp(`^${label}, \\d+ books?$`) });

test("the bookshelf in the room has its rows labelled, top to bottom", async ({ page }) => {
  await page.goto("/house");
  await page.getByRole("navigation", { name: "Places in the room" }).getByRole("button", { name: "Bookshelf" }).click();
  await page.waitForTimeout(900);

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
  await expect(page.getByText("Opening your shelf")).toBeHidden();
  await page.getByRole("navigation", { name: "Places in the room" }).getByRole("button", { name: "Bookshelf" }).click();
  await page.waitForTimeout(900);
  const room = page.getByRole("region", { name: /^Your room/ });
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
