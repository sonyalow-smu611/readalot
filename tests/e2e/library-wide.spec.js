// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test } from "./fixtures.js";

// The library on a laptop: the hall and an opened bookcase fill the window, like My Room,
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

test("an opened bookcase fills the laptop window and stands several shelves tall", async ({ page }) => {
  await page.goto("/library");
  await page.getByRole("button", { name: "Fantasy bookcase" }).click();
  const bookcase = page.getByRole("dialog", { name: "Fantasy" });

  // the bookcase spans the window, not a 480 px phone column
  await expect.poll(async () => (await bookcase.boundingBox()).width).toBeGreaterThan(1400);
  await expect(bookcase.getByRole("button", { name: /Wide book/ })).toHaveCount(24);
  expect(await bookcase.locator(".case__shelf").count()).toBeGreaterThanOrEqual(4);
});
