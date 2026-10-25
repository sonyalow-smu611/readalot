import { expect, test } from "./fixtures.js";

// The room reads live weather and time; fixed answers keep these checks the same every run.
test.beforeEach(async ({ page }) => {
  // today's mood check-in already answered, so it does not open over the room
  await page.addInitScript(() => {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    localStorage.setItem("readalot.moodCheckIn", `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  });
  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "rain", temperature: 27, weatherCode: 61, isDay: true } })
  );
  await page.route("**/api/time", (route) =>
    route.fulfill({ json: { unix: 1767240000, abbreviation: "SGT", utcOffset: "+08:00" } })
  );
  await page.goto("/house");
});

// The room is 3D: the bar of places turns the reader to face something before it is tapped.
async function turnTo(page, place) {
  await page.getByRole("navigation", { name: "Places in the room" }).getByRole("button", { name: place }).click();
  // let the turn finish
  await page.waitForTimeout(900);
}

test("room shows the window weather, the wall clock and the shelf", async ({ page }) => {
  await turnTo(page, "Window");
  const view = page.getByRole("img", { name: "Window view: Rain, 27 degrees" });
  await expect(view).toBeVisible();
  await expect(view.getByText("27°")).toBeVisible();
  // 1767240000 is 2026-01-01 12:00 in Singapore
  await turnTo(page, "Clock");
  await expect(page.getByRole("img", { name: "Singapore time 12:00" })).toBeVisible();
  await turnTo(page, "Bookshelf");
  await expect(page.getByRole("button", { name: /^Bookshelf, \d+ books$/ })).toBeVisible();
});

// The view through the bay window follows the weather: rain here (the weather is answered with
// rain above), birds on a clear day.
test("rain falls past the bay window when it rains", async ({ page }) => {
  await turnTo(page, "Window");
  const view = page.getByTestId("window-view");

  await expect(view).toBeVisible();
  expect(await view.getByTestId("raindrop").count()).toBeGreaterThan(0);
  await expect(view.getByTestId("bird")).toHaveCount(0);
});

test("birds fly past the bay window on a clear day", async ({ page }) => {
  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "sunny", temperature: 31, weatherCode: 0, isDay: true } })
  );
  await page.reload();
  await turnTo(page, "Window");
  const view = page.getByTestId("window-view");

  await expect(view).toBeVisible();
  await expect(view.getByTestId("bird")).toHaveCount(3);
  await expect(view.getByTestId("bird").first()).toBeVisible();
});

test("the bookcase turns you to your books, in the room", async ({ page }) => {
  await page.getByRole("button", { name: /^Bookshelf, \d+ books$/ }).click();

  await expect(page.getByRole("button", { name: "Norwegian Wood by Haruki Murakami" })).toBeInViewport();
  await page.waitForTimeout(700);
  await expect(page.getByRole("button", { name: "Back" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Spines" })).toHaveCount(0);
});

test("buying a decoration spends credits and it can be placed in the room", async ({ page }) => {
  await expect(page.getByText("480").first()).toBeVisible();

  await page.getByRole("button", { name: "Room menu" }).click();
  await page.getByRole("button", { name: "Shop" }).click();
  await page.getByRole("button", { name: /Clay vase/ }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByText("440").first()).toBeVisible();

  // pick the vase, then tap one of the glowing spots it can stand on
  await page.getByRole("region", { name: "Inventory" }).getByRole("button", { name: /Clay vase/ }).click();
  await expect(page.getByRole("status")).toContainText("Tap a glowing spot for the Clay vase");
  await turnTo(page, "Window");
  await page.getByRole("button", { name: /^Put Clay vase on the window seat/ }).locator("visible=true").first().click();

  await expect(page.getByRole("status")).toHaveText(/^Clay vase is on the window seat/);
  await expect(page.getByRole("button", { name: "Clay vase", exact: true })).toHaveCount(1);
});

test("the book on the chair opens the Currently Reading card", async ({ page }) => {
  await page.getByRole("button", { name: /Currently reading Norwegian Wood/ }).click();

  const card = page.getByRole("dialog", { name: "Currently reading" });
  await expect(card.getByRole("heading", { name: "Norwegian Wood" })).toBeVisible();
  await expect(card.getByRole("link")).toHaveAttribute("href", "/books/demo-shelf-1");

  // a tap anywhere else puts it away
  await turnTo(page, "Window");
  await expect(card).toBeHidden();
});

test("the corkboard opens the Quote of the Day", async ({ page }) => {
  // the real quote changes every day; quotes from the dataset have a topic but no author
  await page.route("**/api/quote/today", (route) =>
    route.fulfill({ json: { quoteText: "So many books, so little time.", author: "", topic: "books" } })
  );
  await turnTo(page, "Corkboard");
  await page.getByRole("button", { name: "Quote of the day" }).click();

  const quote = page.getByRole("dialog", { name: "Quote of the Day" });
  await expect(quote.getByText("“So many books, so little time.”")).toBeVisible();
  await expect(quote.getByText("On books")).toBeVisible();
  await quote.getByRole("button", { name: "Close" }).click();
  await expect(quote).toBeHidden();
});
