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

// The room is wider than the screen: the bar of places slides along to something before it is tapped.
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

test("tapping the bookshelf opens My Shelf, and a book on it still opens that book", async ({ page }) => {
  // a book first: it comes off the shelf and opens, as it always has
  await page.getByRole("button", { name: "Norwegian Wood by Haruki Murakami" }).click();
  await expect(page.getByRole("dialog", { name: "Book details" })).toBeVisible({ timeout: 8000 });
  await page.getByRole("button", { name: "Close book" }).click();
  await expect(page.getByRole("dialog", { name: "Book details" })).toBeHidden();

  // the bookshelf itself, away from its books (its top left corner)
  await page.getByRole("button", { name: /^Bookshelf, \d+ books$/ }).click({ position: { x: 8, y: 8 } });
  await expect(page).toHaveURL(/\/house\/shelf$/);
  await expect(page.getByRole("link", { name: "Back to room" })).toBeVisible();
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

// --- The room as one wide picture you move along --------------------------------------------

const room = (page) => page.getByRole("region", { name: /^Your room/ });
// the room has loaded, and the app's opening screen has gone from over it
async function roomShown(page) {
  await expect(page.getByRole("button", { name: /^Bookshelf, \d+ books$/ })).toBeVisible();
  await expect(page.getByText("Opening your shelf")).toBeHidden();
}
const scrolled = (page) => room(page).evaluate((el) => ({ left: el.scrollLeft, most: el.scrollWidth - el.clientWidth }));

test("the room moves sideways with the wheel, a drag and the arrow keys, and stops at both ends", async ({ page }) => {
  await roomShown(page);
  const box = await room(page).boundingBox();
  // high on the wall, clear of anything that can be tapped
  const x = box.x + box.width / 2;
  const y = box.y + 40;
  expect((await scrolled(page)).left).toBe(0);

  await page.mouse.move(x, y);
  await page.mouse.wheel(0, 300);
  await expect.poll(async () => (await scrolled(page)).left).toBeGreaterThan(0);

  const afterWheel = (await scrolled(page)).left;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 150, y, { steps: 6 });
  await page.mouse.up();
  await expect.poll(async () => (await scrolled(page)).left).toBeGreaterThan(afterWheel + 100);

  const afterDrag = (await scrolled(page)).left;
  await room(page).focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(async () => (await scrolled(page)).left).toBeGreaterThan(afterDrag + 20);

  // as far right as it goes, then as far left
  await page.mouse.move(x, y);
  await page.mouse.wheel(0, 50000);
  await expect.poll(async () => { const { left, most } = await scrolled(page); return Math.abs(left - most); }).toBeLessThan(1);
  await page.mouse.wheel(0, -50000);
  await expect.poll(async () => (await scrolled(page)).left).toBe(0);
});

test("the bar of places goes along the room in order, from the bay window to the bed", async ({ page }) => {
  await roomShown(page);
  const places = page.getByRole("navigation", { name: "Places in the room" }).getByRole("button");
  await expect(places).toHaveText(["Window", "Chair", "Bookshelf", "Clock", "Corkboard", "Bed"]);

  let last = -1;
  for (const place of ["Window", "Chair", "Bookshelf", "Clock", "Corkboard", "Bed"]) {
    await turnTo(page, place);
    const { left } = await scrolled(page);
    if (place === "Window") expect(left).toBe(0);
    else expect(left).toBeGreaterThan(last);
    last = left;
  }
});

test("a first visit says how to look around, until the room is moved, and not again", async ({ page }) => {
  // the room opened in beforeEach was the first visit
  const hint = page.getByText(/^(Swipe|Drag or scroll) to look around$/);
  await expect(hint).toBeVisible();
  await turnTo(page, "Bookshelf");
  await expect(hint).toBeHidden();

  await page.reload();
  await expect(page.getByRole("button", { name: /^Bookshelf, \d+ books$/ })).toBeVisible();
  await page.waitForTimeout(500);
  await expect(hint).toBeHidden();
});

test("at night the window looks out on the town with its windows lit", async ({ page }) => {
  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "sunny", temperature: 26, weatherCode: 0, isDay: false } })
  );
  await page.reload();
  await turnTo(page, "Window");

  await expect(page.getByRole("img", { name: "Window view: Clear night, 26 degrees" })).toBeVisible();
  const view = page.getByTestId("window-view");
  await expect(view.getByTestId("town-lights")).toBeVisible();
  await expect(view.getByTestId("bird")).toHaveCount(0);
});

// The picture is stretched a whole number of times in device pixels, so it is never blurred.
for (const [device, viewport, deviceScaleFactor] of [
  ["a phone", { width: 390, height: 844 }, 3],
  ["a laptop", { width: 1280, height: 800 }, 2],
]) {
  test.describe(`on ${device}`, () => {
    test.use({ viewport, deviceScaleFactor });

    test("the room is drawn at a whole number of device pixels per pixel of art", async ({ page }) => {
      await roomShown(page);
      const { across, down, crisp } = await page.locator(".strip canvas").evaluate((canvas) => {
        const { width, height } = canvas.getBoundingClientRect();
        return {
          across: (width * devicePixelRatio) / canvas.width,
          down: (height * devicePixelRatio) / canvas.height,
          crisp: getComputedStyle(canvas).imageRendering,
        };
      });
      expect(across).toBeGreaterThanOrEqual(1);
      expect(Math.abs(across - Math.round(across))).toBeLessThan(0.001);
      expect(Math.abs(down - across)).toBeLessThan(0.001);
      expect(crisp).toBe("pixelated");
    });
  });
}
