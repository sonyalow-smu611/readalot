import { expect, goToPlace, test } from "./fixtures.js";

// a phone-sized window, where the room is wider than the screen (the laptop view has its own
// journey, house-desktop.spec.js)
test.use({ viewport: { width: 480, height: 720 } });

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
  await goToPlace(page, place);
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

test("the weather chip floats just above the window and moves with the room", async ({ page }) => {
  await turnTo(page, "Window");
  const chip = page.getByRole("img", { name: "Window view: Rain, 27 degrees" });
  const glass = await page.getByTestId("window-view").boundingBox();
  const box = await chip.boundingBox();
  // above the glass, not far above it, and within the window's width
  expect(box.y + box.height).toBeLessThanOrEqual(glass.y);
  expect(glass.y - (box.y + box.height)).toBeLessThan(90);
  expect(box.x).toBeGreaterThanOrEqual(glass.x);
  expect(box.x + box.width).toBeLessThanOrEqual(glass.x + glass.width);

  await turnTo(page, "Bed");
  const moved = await chip.boundingBox();
  expect(box.x - moved.x).toBeGreaterThan(200);
});

// The room starts bare: the wall above the reading chair, where a gallery of frames used to hang
// (art x 300–400, y 175–235), is plain wall, the same colour as the bare wall by the window.
// The clock (its top at art y 166) finds the rows.
test("the room starts bare, with plain wall where the gallery of frames was", async ({ page }) => {
  await roomShown(page);
  await turnTo(page, "Chair");
  const odd = await page.getByRole("img", { name: /^Singapore time/ }).evaluate((clock) => {
    const canvas = document.querySelector(".strip canvas");
    const c = canvas.getBoundingClientRect();
    const unit = c.width / canvas.width;
    const row = (artY) => Math.round((clock.getBoundingClientRect().top - c.top) / unit + (artY - 166));
    const ctx = canvas.getContext("2d");
    const at = (x, y) => [...ctx.getImageData(x, row(y), 1, 1).data].join(",");
    const wall = at(280, 205);
    let differ = 0;
    for (let x = 300; x <= 400; x += 4) for (let y = 175; y <= 235; y += 4) if (at(x, y) !== wall) differ += 1;
    return differ;
  });
  expect(odd).toBe(0);
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
  await page.getByRole("button", { name: /Succulent trio/ }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByText("450").first()).toBeVisible();

  // pick the succulents, then tap one of the glowing spots they can stand on
  await page.getByRole("region", { name: "Inventory" }).getByRole("button", { name: /Succulent trio/ }).click();
  await expect(page.getByRole("status")).toContainText("Tap a glowing spot for the Succulent trio");
  await turnTo(page, "Window");
  await page.getByRole("button", { name: /^Put Succulent trio on the window seat/ }).locator("visible=true").first().click();

  await expect(page.getByRole("status")).toHaveText(/^Succulent trio is on the window seat/);
  await expect(page.getByRole("button", { name: "Succulent trio", exact: true })).toHaveCount(1);
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

test("the Places menu sits top left, opens the list of places and closes once one is picked", async ({ page }) => {
  await roomShown(page);
  const menu = page.getByRole("button", { name: "Places", exact: true });
  const list = page.getByRole("navigation", { name: "Places in the room" });
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(list).toBeHidden();
  // the top left corner of the room
  const box = await menu.boundingBox();
  const area = await room(page).boundingBox();
  expect(box.x - area.x).toBeLessThan(30);
  expect(box.y - area.y).toBeLessThan(30);

  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(list.getByRole("button")).toHaveText(["Window", "Chair", "Bookshelf", "Clock", "Corkboard", "Bed"]);
  await list.getByRole("button", { name: "Bed" }).click();
  await expect(list).toBeHidden();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect.poll(async () => (await scrolled(page)).left).toBeGreaterThan(0);

  // Esc closes it, back on the button
  await menu.click();
  await page.keyboard.press("Escape");
  await expect(list).toBeHidden();
  await expect(menu).toBeFocused();

  // so does a tap anywhere else
  await menu.click();
  await page.mouse.click(area.x + area.width / 2, area.y + 60);
  await expect(list).toBeHidden();
});

test("the places go along the room in order, from the bay window to the bed", async ({ page }) => {
  await roomShown(page);
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
      const { across, down, crisp } = await page.locator(".strip canvas").first().evaluate((canvas) => {
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
