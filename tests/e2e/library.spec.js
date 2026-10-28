// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test } from "./fixtures.js";

// The bookcases fill from a book search; answer it here so the tests never wait on Google Books.
const BOOKS = [
  { id: "lib-dragon", title: "The Dragon's Library", authors: ["A. Reader"], coverUrl: "" },
  { id: "lib-map", title: "A Map of Stars", authors: ["B. Writer"], coverUrl: "" },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books: BOOKS } }));
  // the live weather, fixed: rain at 27 degrees by day
  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "rain", temperature: 27, weatherCode: 61, isDay: true } })
  );
  await page.goto("/library");
});

test("the library hall has a bookcase for each category", async ({ page }) => {
  for (const name of ["Popular right now", "Fantasy", "Romance", "Mystery", "Science fiction", "History", "Classics", "Prize winners"]) {
    await expect(page.getByRole("button", { name: `${name} bookcase` })).toBeAttached();
  }
  await expect(page.getByRole("navigation", { name: "Places in the library" })).toBeVisible();
});

test("a bookcase opens its books, and a book opens its preview", async ({ page }) => {
  await page.getByRole("navigation", { name: "Places in the library" }).getByRole("button", { name: "Fantasy" }).click();
  await page.getByRole("button", { name: "Fantasy bookcase" }).click();

  const sheet = page.getByRole("dialog", { name: "Fantasy" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("button", { name: /The Dragon's Library/ })).toBeVisible();
  await expect(sheet.getByRole("link", { name: "See all Fantasy" })).toBeVisible();

  await sheet.getByRole("button", { name: /The Dragon's Library/ }).click();
  const preview = page.getByRole("dialog", { name: "Quick preview: The Dragon's Library" });
  await expect(preview).toBeVisible();
  await preview.getByRole("button", { name: "Close", exact: true }).click();
  await expect(preview).toBeHidden();

  await sheet.getByRole("button", { name: "Close", exact: true }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("button", { name: "Fantasy bookcase" })).toBeFocused();
});

test("the help desk puts the reader in the search bar", async ({ page }) => {
  await page.getByRole("navigation", { name: "Places in the library" }).getByRole("button", { name: "Help desk" }).click();
  await page.getByRole("button", { name: "Help desk: search for any book" }).click();

  const search = page.getByRole("searchbox", { name: "Search books or authors" });
  await expect(search).toBeFocused();
  await search.fill("dune");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=dune$/);
});

test("the library shows the live weather, and follows it after dark", async ({ page }) => {
  await expect(page.getByRole("img", { name: "Weather outside: Rain, 27 degrees" })).toBeVisible();

  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "sunny", temperature: 25, weatherCode: 0, isDay: false } })
  );
  await page.reload();
  await expect(page.getByRole("img", { name: "Weather outside: Sunny night, 25 degrees" })).toBeVisible();

  // ?scene= previews a sky without waiting for that weather
  await page.goto("/library?scene=cloudy");
  await expect(page.getByRole("img", { name: /Weather outside: Cloudy, 25 degrees/ })).toBeVisible();
});
