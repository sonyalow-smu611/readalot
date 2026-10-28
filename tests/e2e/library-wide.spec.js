// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test } from "./fixtures.js";

// The library on a laptop: the hall and a genre's "See all" page fill the window, like My Room,
// instead of sitting in the phone column.
test.use({ viewport: { width: 1440, height: 900 } });

const BOOKS = Array.from({ length: 24 }, (_, index) => ({
  id: `wide-${index}`,
  title: `Wide book ${index + 1}`,
  authors: ["A. Reader"],
  coverUrl: "",
}));

test.beforeEach(async ({ page }) => {
  await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books: BOOKS } }));
  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "sunny", temperature: 30, weatherCode: 0, isDay: true } })
  );
});

test("a bookcase's See all page fills the laptop window, with fuller shelves", async ({ page }) => {
  await page.goto("/library");
  await page.getByRole("navigation", { name: "Places in the library" }).getByRole("button", { name: "Fantasy" }).click();
  await page.getByRole("button", { name: "Fantasy bookcase" }).click();
  await page.getByRole("link", { name: "See all Fantasy" }).click();
  await expect(page).toHaveURL(/\/discover\//);

  // the page spans the window, not a 480 px phone column
  const heading = page.getByRole("heading", { name: /Fantasy/ });
  await expect(heading).toBeVisible();
  const sorts = await page.getByRole("group", { name: "Sort books" }).boundingBox();
  expect(sorts.width).toBeGreaterThan(900);

  // each shelf holds more than the phone's 6 books
  const firstShelf = page.locator(".shelf-tier").first();
  await expect(firstShelf.getByText("Shelf 1", { exact: true })).toBeVisible();
  await expect(firstShelf.getByRole("button", { name: /Wide book/ })).toHaveCount(10);
});
