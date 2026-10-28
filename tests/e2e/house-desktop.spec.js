import { expect, goToPlace, mockWeather, roomCanvas, roomReady, roomRegion, skipMoodCheckIn, test } from "./fixtures.js";

// Your house on a laptop: My Room and My Shelf fill the window, the same size as the town map,
// instead of sitting in the phone column the other pages use.
test.use({ viewport: { width: 1440, height: 900 } });

test.beforeEach(async ({ page }) => {
  await skipMoodCheckIn(page);
  await mockWeather(page);
});

const room = roomRegion;
const roomShown = roomReady;

test("My Room fills the laptop window, as the town does", async ({ page }) => {
  await page.goto("/house");
  await roomShown(page);

  const box = await room(page).boundingBox();
  expect(box.x).toBe(0);
  expect(box.width).toBe(1440);
  expect(box.y + box.height).toBe(900);
});

test("My Shelf fills the window too, its search kept to a comfortable width", async ({ page }) => {
  await page.goto("/house/shelf");
  const back = page.getByRole("link", { name: "Back to room" });
  await expect(back).toBeVisible();

  // the house's header runs the whole width of the window, once the page has slid in
  const header = page.locator("header", { has: back });
  await expect.poll(async () => (await header.boundingBox()).x).toBe(0);
  expect((await header.boundingBox()).width).toBe(1440);

  const search = await page.getByRole("search").boundingBox();
  expect(search.width).toBeLessThanOrEqual(1320);
  expect(Math.abs(search.x + search.width / 2 - 720)).toBeLessThan(2);
});

test("the other buildings still open in the phone column", async ({ page }) => {
  await page.goto("/library");
  const back = page.getByRole("link", { name: /Back to town/ });
  await expect(back).toBeVisible();
  const header = await page.locator("header", { has: back }).boundingBox();
  expect(header.width).toBeLessThanOrEqual(480);
});

// a card over the room stays a size that reads well, in the middle of the window
async function centredAndReadable(locator) {
  // once it has finished popping in
  await expect.poll(async () => { const box = await locator.boundingBox(); return Math.abs(box.x + box.width / 2 - 720); }).toBeLessThan(2);
  expect((await locator.boundingBox()).width).toBeLessThanOrEqual(760);
}

test("a book's card stays a readable width in the middle of the window", async ({ page }) => {
  await page.goto("/house");
  await roomShown(page);
  await page.getByRole("button", { name: "Norwegian Wood by Haruki Murakami" }).click();
  const card = page.getByRole("dialog", { name: "Book details" });
  await expect(card).toBeVisible({ timeout: 8000 });
  await centredAndReadable(card);
});

test("the Currently Reading card stays a readable width, centred", async ({ page }) => {
  await page.goto("/house");
  await roomShown(page);
  await page.getByRole("button", { name: /Currently reading Norwegian Wood/ }).click();
  await centredAndReadable(page.getByRole("dialog", { name: "Currently reading" }));
});

test("on a laptop the room is drawn large enough to fill the window's width", async ({ page }) => {
  await page.goto("/house");
  await roomShown(page);
  const picture = await roomCanvas(page).boundingBox();
  expect(picture.width).toBeGreaterThan(1440);
  // only plain wall above the bunting may be cut off the top
  await expect(page.getByRole("region", { name: /^Your room/ })).toHaveAttribute("data-cut", /^([0-9]|1[0-9]|2[0-4])$/);
});

test.describe("on a very wide, short window", () => {
  test.use({ viewport: { width: 2600, height: 650 }, deviceScaleFactor: 1 });

  test("a room narrower than the window sits in the middle of it", async ({ page }) => {
    await page.goto("/house");
    await roomShown(page);
    const picture = await roomCanvas(page).boundingBox();
    expect(picture.width).toBeLessThan(2600);
    expect(Math.abs(picture.x + picture.width / 2 - 1300)).toBeLessThan(2);
  });
});

test("resizing the window keeps the part of the room being looked at in the middle", async ({ page }) => {
  await page.goto("/house");
  await roomShown(page);
  await goToPlace(page, "Bookshelf");
  // how far along the room the middle of the window is, from 0 (left wall) to 1 (right wall)
  const canvas = await roomCanvas(page).elementHandle();
  const middle = (width) =>
    room(page).evaluate((el, [half, picture]) => (el.scrollLeft + half) / picture.getBoundingClientRect().width, [width / 2, canvas]);
  const before = await middle(1440);

  await page.setViewportSize({ width: 1100, height: 700 });
  await expect.poll(async () => Math.abs((await middle(1100)) - before)).toBeLessThan(0.01);
});
