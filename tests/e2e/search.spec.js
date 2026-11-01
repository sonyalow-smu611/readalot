// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test } from "./fixtures.js";

// Search is the library's catalogue: full screen in the library's look, the books found standing
// in a bookcase, with the same preview as a bookcase's books.
const BOOKS = Array.from({ length: 24 }, (_, i) => ({
  id: `search-${i}`,
  title: i === 0 ? "Dune" : `Desert Book ${i + 1}`,
  authors: ["Frank Herbert"],
  coverUrl: "",
}));

test.beforeEach(async ({ page }) => {
  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "sunny", temperature: 29, weatherCode: 0, isDay: true } })
  );
});

test("on a laptop, the search fills the window and stands the books in a bookcase", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const asked = page.waitForRequest((request) => request.url().includes("/api/books/search"));
  await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books: BOOKS } }));
  await page.goto("/search?q=dune");
  expect(new URL((await asked).url()).searchParams.get("limit")).toBe("24");

  // no phone column: the page is as wide as the window
  const box = await page.locator(".search").boundingBox();
  expect(box.width).toBeGreaterThan(1400);
  await expect(page.getByRole("searchbox", { name: "Search books or authors" })).toHaveValue("dune");
  await expect(page.getByText("24 books for “dune”")).toBeVisible();

  // face out by default; Spines turns them round
  await expect(page.locator(".case__cover")).toHaveCount(24);
  await page.getByRole("button", { name: "Spines" }).click();
  await expect(page.locator(".case__spine").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /by Frank Herbert$/ })).toHaveCount(24);
});

test("a book found opens the preview with Add to To be read and Where to get", async ({ page }) => {
  await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books: BOOKS } }));
  await page.goto("/search?q=dune");
  await page.getByRole("button", { name: "Dune by Frank Herbert" }).click();
  const preview = page.getByRole("dialog", { name: "Quick preview: Dune" });
  await expect(preview.getByRole("button", { name: "Add to To be read" })).toBeVisible();
  await expect(preview.getByRole("button", { name: "Where to get" })).toBeVisible();
});

test("the librarian's card says what to do: before a search, when nothing is found, and offline", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByRole("heading", { name: "Ask the librarian" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search books or authors" })).toBeFocused();

  await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books: [] } }));
  await page.getByRole("searchbox", { name: "Search books or authors" }).fill("zzzz");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/\/search\?q=zzzz$/);
  await expect(page.getByRole("heading", { name: "No books found" })).toBeVisible();

  await page.unroute("**/api/books/search**");
  await page.route("**/api/books/search**", (route) => route.abort());
  await page.goto("/search?q=offline");
  await expect(page.getByRole("heading", { name: "Search is offline" })).toBeVisible();
  await page.unroute("**/api/books/search**");
  await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books: BOOKS } }));
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("button", { name: "Dune by Frank Herbert" })).toBeVisible();

  // no emoji, only pixel icons
  expect(await page.locator("body").innerText()).not.toMatch(/\p{Extended_Pictographic}/u);
});

test("Back returns to the library, from the help desk or straight from a link", async ({ page }) => {
  await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books: BOOKS } }));
  await page.goto("/library");
  await page.getByRole("button", { name: "Help desk: search for any book" }).click();
  await page.getByRole("searchbox", { name: "Search books or authors" }).fill("dune");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=dune$/);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/library$/);

  await page.goto("/search?q=dune");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/library$/);
});

test("on a phone, the search bar takes its own line and nothing runs off the side", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books: BOOKS } }));
  await page.goto("/search?q=dune");
  await expect(page.getByRole("button", { name: "Dune by Frank Herbert" })).toBeVisible();
  const back = await page.getByRole("button", { name: "Back", exact: true }).boundingBox();
  const bar = await page.getByRole("search").boundingBox();
  expect(bar.y).toBeGreaterThan(back.y + back.height - 1);
  expect(bar.width).toBeGreaterThan(340);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
