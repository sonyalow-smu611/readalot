import { expect, mockWeather, skipMoodCheckIn, test } from "./fixtures.js";

// A building has no bar across the top: its own background runs up to the top of the screen, with
// the back button in the top left, clear of the page's own controls.
test.beforeEach(async ({ page }) => {
  await skipMoodCheckIn(page);
  await mockWeather(page);
});

function overlaps(a, b) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

async function backInTheCorner(page, name = "Back to town") {
  const back = page.getByRole("link", { name });
  await expect(back).toBeVisible();
  await expect(page.locator("header", { has: back })).toHaveCount(0);
  // once the page has slid in
  await expect.poll(async () => (await back.boundingBox()).x).toBeLessThan(20);
  const box = await back.boundingBox();
  expect(box.y).toBeLessThan(20);
  return box;
}

for (const [label, viewport] of [
  ["a phone", { width: 390, height: 844 }],
  ["a laptop", { width: 1440, height: 900 }],
]) {
  test.describe(`on ${label}`, () => {
    test.use({ viewport });

    test("the room's Places button sits below the back button", async ({ page }) => {
      await page.goto("/house");
      const back = await backInTheCorner(page);
      const places = await page.getByRole("button", { name: "Places" }).boundingBox();
      expect(overlaps(back, places)).toBe(false);
    });

    test("the library's search bar sits below the back button", async ({ page }) => {
      await page.goto("/library");
      const back = await backInTheCorner(page);
      const search = await page.getByRole("search").boundingBox();
      expect(overlaps(back, search)).toBe(false);
    });

    test("the cafe's reader count sits below the back button", async ({ page }) => {
      await page.goto("/cafe");
      const back = await backInTheCorner(page);
      const count = await page.getByText("4 sample readers").boundingBox();
      expect(overlaps(back, count)).toBe(false);
    });

    test("the salon has the back button with no bar", async ({ page }) => {
      await page.goto("/salon");
      await backInTheCorner(page);
    });

    test("My Shelf starts with the back button, above its search", async ({ page }) => {
      await page.goto("/house/shelf");
      const back = await backInTheCorner(page, "Back to room");
      const search = await page.getByRole("search").boundingBox();
      expect(search.y).toBeGreaterThanOrEqual(back.y + back.height);
    });
  });
}

test("a page that couldn't find its reader still has the back button", async ({ page }) => {
  await page.goto("/people/nobody/room");
  await expect(page.getByText("We couldn't find that reader.")).toBeVisible();
  await backInTheCorner(page, "Back to the Cafe");
  await expect(page.getByRole("heading", { level: 1, name: "Room not found" })).toBeAttached();
});
