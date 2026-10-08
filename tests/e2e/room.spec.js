import { expect, test } from "@playwright/test";

// The room reads live weather and time; fixed answers keep these checks the same every run.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "rain", temperature: 27, weatherCode: 61, isDay: true } })
  );
  await page.route("**/api/time", (route) =>
    route.fulfill({ json: { unix: 1767240000, abbreviation: "SGT", utcOffset: "+08:00" } })
  );
  await page.goto("/");
});

test("room shows the window weather, the wall clock and the shelf", async ({ page }) => {
  await expect(page.getByRole("img", { name: "Window view: Rain, 27 degrees" })).toBeVisible();
  // 1767240000 is 2026-01-01 12:00 in Singapore
  await expect(page.getByRole("img", { name: "Singapore time 12:00" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Open bookshelf, \d+ books/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
});

test("bookcase opens the full bookshelf with spines and covers", async ({ page }) => {
  await page.getByRole("button", { name: /Open bookshelf/ }).click();

  for (const shelf of ["Reading", "To read", "Finished"]) {
    await expect(page.getByText(shelf, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Norwegian Wood by Haruki Murakami" })).toBeVisible();

  await page.getByRole("button", { name: "Covers" }).click();
  await expect(page.getByRole("button", { name: "Previous covers" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("button", { name: "Room menu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Back" })).toBeHidden();
});

test("dragging a book to another shelf saves its new status", async ({ page }) => {
  // answered here so the shared demo shelf is left as it was for the other tests
  await page.route("**/api/user-books/*", (route) => route.fulfill({ json: { userBook: {} } }));

  await page.getByRole("button", { name: /Open bookshelf/ }).click();
  const reading = page.locator('.room__bay[data-zone="reading"]');
  // let the zoom into the bookshelf finish before measuring where the books are
  await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
  await page.waitForTimeout(700);
  const saved = page.waitForRequest((request) => request.method() === "PATCH");

  // moved by hand in small steps: the shelves only pick up a drag that travels
  const from = await page.getByRole("button", { name: "Dune by Frank Herbert" }).boundingBox();
  const to = await reading.getByRole("button", { name: "Norwegian Wood by Haruki Murakami" }).boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 - 10, from.y + from.height / 2 - 20, { steps: 4 });
  await page.mouse.move(to.x + to.width + 30, to.y + to.height / 2, { steps: 12 });
  await page.waitForTimeout(300);
  await page.mouse.up();

  const request = await saved;
  expect(request.url()).toContain("/api/user-books/demo-shelf-15");
  expect(request.postDataJSON()).toEqual({ status: "reading" });
  await expect(reading.getByRole("button", { name: "Dune by Frank Herbert" })).toBeVisible();
});

test("buying a decoration spends credits and it can be placed on a shelf", async ({ page }) => {
  await expect(page.getByText("480").first()).toBeVisible();

  await page.getByRole("button", { name: "Room menu" }).click();
  await page.getByRole("button", { name: "Shop" }).click();
  await page.getByRole("button", { name: /Clay vase/ }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByText("440").first()).toBeVisible();

  // drag the vase out of the inventory onto the top shelf of the bookcase
  const piece = page.getByRole("region", { name: "Inventory" }).getByRole("button", { name: /Clay vase/ });
  const shelf = page.locator('[data-zone="case-top"]');
  const from = await piece.boundingBox();
  const to = await shelf.boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width * 0.7, to.y + to.height * 0.8, { steps: 8 });
  await page.mouse.up();

  await expect(page.getByRole("status")).toHaveText("Clay vase is on the shelf.");
  await expect(shelf.locator(".placed")).toHaveCount(1);
});

test("the book on the chair opens the Currently Reading card", async ({ page }) => {
  await page.getByRole("button", { name: /Currently reading Norwegian Wood/ }).click();

  const card = page.getByRole("dialog", { name: "Currently reading" });
  await expect(card.getByRole("heading", { name: "Norwegian Wood" })).toBeVisible();
  await expect(card.getByRole("link")).toHaveAttribute("href", "/books/demo-shelf-1");

  // a tap anywhere else puts it away
  await page.getByRole("img", { name: /Singapore time/ }).click();
  await expect(card).toBeHidden();
});

test("the sticky note opens the Quote of the Day", async ({ page }) => {
  await page.getByRole("button", { name: "Quote of the day" }).click();

  const quote = page.getByRole("dialog", { name: "Quote of the Day" });
  await expect(quote).toBeVisible();
  await quote.getByRole("button", { name: "Close" }).click();
  await expect(quote).toBeHidden();
});
