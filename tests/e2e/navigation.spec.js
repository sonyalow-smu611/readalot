// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, mockQuote, mockWeather, roomReady, skipMoodCheckIn, test } from "./fixtures.js";

// Going from page A to page B and pressing Back lands on page A again: the same tab, the same
// pop-up, never a default page.
const BOOKS = [{ id: "search-0", title: "Dune", authors: ["Frank Herbert"], coverUrl: "" }];

test.beforeEach(async ({ page }) => {
  await mockWeather(page);
  await skipMoodCheckIn(page);
});

test("the shop, opened from the salon's Profile tab, goes Back to the Profile tab", async ({ page }) => {
  await page.goto("/salon");
  await page.getByRole("tab", { name: "Profile" }).click();
  await page.getByRole("button", { name: "Visit the shop" }).click();
  await expect(page).toHaveURL(/\/house$/);

  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/salon\?tab=profile/);
  await expect(page.getByRole("tab", { name: "Profile" })).toHaveAttribute("aria-selected", "true");
});

test("a building opened from the town still says Back to town", async ({ page }) => {
  await page.goto("/");
  await page.goto("/library");
  await expect(page.getByRole("link", { name: "Back to town" })).toBeVisible();
});

test("a saved quote's book page goes Back to the salon's Profile tab", async ({ page }) => {
  await page.route("**/api/saved-quotes", (route) =>
    route.fulfill({
      json: { quotes: [{ id: "q1", quoteText: "A line.", author: "Someone", work: "Dune", bookId: "dune-1", sourceUrl: null, mood: null, createdAt: new Date().toISOString() }] },
    })
  );
  await page.goto("/salon");
  await page.getByRole("tab", { name: "Profile" }).click();
  await page.getByRole("link", { name: "Open book page" }).click();
  await expect(page).toHaveURL(/\/books\/dune-1$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/salon\?tab=profile/);
  await expect(page.getByRole("tab", { name: "Profile" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("“A line.”")).toBeVisible();
});

test("search remembers what was searched, and Clear history forgets it", async ({ page }) => {
  await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books: BOOKS } }));
  await page.goto("/search");
  const box = page.getByRole("searchbox", { name: "Search books or authors" });
  await box.fill("dune");
  await box.press("Enter");
  await expect(page.getByText("1 book for “dune”")).toBeVisible();
  await box.fill("pachinko");
  await box.press("Enter");
  await expect(page.getByText("1 book for “pachinko”")).toBeVisible();

  await page.goto("/search");
  const recent = page.getByRole("region", { name: "Recent searches" });
  await expect(recent.getByRole("button")).toHaveText(["pachinko", "dune", "Clear history"]);
  await recent.getByRole("button", { name: "dune" }).click();
  await expect(page).toHaveURL(/q=dune/);

  await page.goto("/search");
  await page.getByRole("button", { name: "Clear history" }).click();
  await expect(page.getByRole("region", { name: "Recent searches" })).toHaveCount(0);
});

test("a book added from the preview can be undone", async ({ page }) => {
  await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books: BOOKS } }));
  let removed = false;
  let onShelf = false;
  await page.route("**/api/user-books**", (route) => {
    const method = route.request().method();
    if (method === "POST") {
      onShelf = true;
      return route.fulfill({ status: 201, json: { userBook: {} } });
    }
    if (method === "DELETE") {
      removed = true;
      onShelf = false;
      return route.fulfill({ status: 204, body: "" });
    }
    if (method === "GET") {
      const books = onShelf ? [{ id: "search-0", title: "Dune", authors: ["Frank Herbert"], status: "want_to_read", progress: 0 }] : [];
      return route.fulfill({ json: { books } });
    }
    return route.fallback();
  });
  await page.goto("/search?q=dune");
  await page.getByRole("button", { name: /Dune/ }).first().click();
  const preview = page.getByRole("dialog");
  await preview.getByRole("button", { name: "Add to To be read" }).click();
  await expect(preview.getByRole("link", { name: "See it in my room" })).toBeVisible();
  await preview.getByRole("button", { name: "Undo" }).click();
  await expect(preview.getByRole("button", { name: "Add to To be read" })).toBeVisible();
  expect(removed).toBe(true);
});

test("no link is underlined", async ({ page }) => {
  await page.goto("/salon");
  await page.getByRole("tab", { name: "Profile" }).click();
  const underlined = await page.evaluate(() =>
    [...document.querySelectorAll("a, .btn")].filter((el) => getComputedStyle(el).textDecorationLine.includes("underline")).length
  );
  expect(underlined).toBe(0);
});

test("the Quote of the Day can be saved from the notice board, outside the mood check-in, and unsaved", async ({ page }) => {
  await mockQuote(page);
  let saved = [];
  await page.route("**/api/saved-quotes**", (route) => {
    const method = route.request().method();
    if (method === "POST") {
      saved = [{ id: "q9", ...route.request().postDataJSON() }];
      return route.fulfill({ status: 201, json: saved[0] });
    }
    if (method === "DELETE") {
      saved = [];
      return route.fulfill({ status: 204, body: "" });
    }
    return route.fulfill({ json: { quotes: saved } });
  });
  await page.goto("/house");
  await roomReady(page);
  await page.getByRole("button", { name: "Notice board" }).click();
  const board = page.getByRole("dialog", { name: "Notice board" });
  await board.getByRole("button", { name: "Save quote" }).click();
  await expect(board.getByRole("button", { name: "Unsave" })).toBeVisible();
  expect(saved[0].quoteText).toBe("So many books, so little time.");
  await board.getByRole("button", { name: "Unsave" }).click();
  await expect(board.getByRole("button", { name: "Save quote" })).toBeVisible();
  expect(saved).toEqual([]);
});
