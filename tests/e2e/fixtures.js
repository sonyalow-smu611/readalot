import { test as base, expect } from "@playwright/test";

// Shared set-up and helpers for the end-to-end tests. Specs import `test` and `expect` from here,
// not from @playwright/test, so every test starts the same way.

// The app sends a signed-out visitor to Log in. Every test starts already signed in, as "Reader",
// the way the app does with no Supabase keys.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        "readalot-preview-user",
        JSON.stringify({
          id: "e2e-reader",
          email: "reader@readalot.test",
          user_metadata: { name: "Reader" },
        }),
      );
    });
    await use(page);
  },
});

export { expect };

// --- Fixed answers, so every run sees the same thing --------------------------------------------

// Today's mood check-in already answered, so it doesn't open over My Room.
export async function skipMoodCheckIn(page) {
  await page.addInitScript(() => {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    localStorage.setItem("readalot.moodCheckIn", `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  });
}

// The live weather, answered here: a clear day unless told otherwise. A later call replaces it
// (Playwright uses the newest matching route).
export async function mockWeather(page, weather = {}) {
  const answer = { scene: "sunny", temperature: 27, weatherCode: 0, isDay: true, ...weather };
  await page.route("**/api/weather*", (route) => route.fulfill({ json: answer }));
}

// 1767240000 is 2026-01-01 12:00 in Singapore
export const NOON = 1767240000;

export async function mockTime(page, unix = NOON) {
  await page.route("**/api/time", (route) =>
    route.fulfill({ json: { unix, abbreviation: "SGT", utcOffset: "+08:00" } })
  );
}

// Quotes from the dataset have a topic but no author.
export async function mockQuote(page, quote = { quoteText: "So many books, so little time.", author: "", topic: "books" }) {
  await page.route("**/api/quote/today", (route) => route.fulfill({ json: quote }));
}

// --- In the room ----------------------------------------------------------------------------------

// The room you look around in: "Your room", or "Emma's room" when visiting.
export const roomRegion = (page, whose = "Your") => page.getByRole("region", { name: new RegExp(`^${whose} room`) });

// The room's picture, the canvas it's painted on (pixel checks need it; nothing else does).
export const roomCanvas = (page) => page.getByTestId("room-canvas");

// The room has loaded its pictures, the app's opening screen has gone, and the room is painted.
export async function roomReady(page) {
  await expect(page.getByRole("button", { name: /^Bookshelf, \d+ books?$/ })).toBeVisible();
  await expect(page.getByText("Opening your shelf")).toBeHidden();
  await nextPaint(page);
}

// Waits for the browser to paint twice: anything the app changed is on screen (and in the canvas).
export async function nextPaint(page) {
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
}

// Waits until something that scrolls sideways (the room, a row of covers) has stopped moving:
// the same scroll position three reads in a row.
export async function scrollSettled(locator) {
  let last = null;
  let same = 0;
  await expect
    .poll(
      async () => {
        const left = await locator.evaluate((el) => el.scrollLeft);
        same = left === last ? same + 1 : 0;
        last = left;
        return same;
      },
      { intervals: [100], timeout: 5000 }
    )
    .toBeGreaterThanOrEqual(2);
}

// Opens the Places menu (unless it's open), picks a place, and waits for the room to stop sliding.
// Before the room has loaded, a place may open a page instead; then there's no room to wait for.
export async function goToPlace(page, place) {
  const list = page.getByRole("navigation", { name: "Places in the room" });
  if (!(await list.isVisible())) await page.getByRole("button", { name: "Places", exact: true }).click();
  await list.getByRole("button", { name: place, exact: true }).click();
  const room = page.getByRole("region", { name: /room\. Swipe/ });
  if (await room.count()) await scrollSettled(room);
}

// The colour of the room's picture at an art pixel (x, y), as "r,g,b". Art x is the canvas's own
// column; the clock, whose top is at art y 166, finds the row (the room grows wall above it on
// taller screens).
export async function artColour(page, x, y) {
  const canvas = await roomCanvas(page).elementHandle();
  return page.getByRole("img", { name: /^Singapore time/ }).evaluate(
    (clock, [ax, ay, picture]) => {
      const box = picture.getBoundingClientRect();
      const unit = box.width / picture.width;
      const row = Math.round((clock.getBoundingClientRect().top - box.top) / unit + (ay - 166));
      return [...picture.getContext("2d").getImageData(ax, row, 1, 1).data].slice(0, 3).join(",");
    },
    [x, y, canvas]
  );
}

export const brightness = (rgb) => rgb.split(",").map(Number).reduce((a, b) => a + b, 0);

// --- The room menu, the Shop and the inventory ------------------------------------------------------

// An item in the room menu, opening the menu first if it's shut.
export async function fromMenu(page, item) {
  const button = page.getByRole("button", { name: item, exact: true });
  if (!(await button.isVisible())) await page.getByRole("button", { name: "Room menu" }).click();
  await button.click();
}

export async function openShop(page) {
  await fromMenu(page, "Shop");
  return page.getByRole("region", { name: "Decoration shop" });
}

export const inventory = (page) => page.getByRole("region", { name: "Inventory" });

// Buys a piece (by its name) and confirms the price.
export async function buy(page, name) {
  const shop = await openShop(page);
  await shop.getByRole("button", { name: new RegExp(name) }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
}

export async function pickFromInventory(page, name) {
  await inventory(page).getByRole("button", { name: new RegExp(name) }).click();
}
