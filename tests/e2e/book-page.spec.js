// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, mockWeather, skipMoodCheckIn, test } from "./fixtures.js";

// A book's own page: on a laptop it fills the window, the cover beside the details and the
// synopsis and reviews under them; on a phone it stays one column.
const BOOK = {
  id: "page-layout-1",
  title: "The Lamplit Library",
  authors: ["A. Writer"],
  coverUrl: "",
  description: "A dragon keeps a library.",
  genres: ["Fantasy"],
  pageCount: 320,
};

test.beforeEach(async ({ page }) => {
  await skipMoodCheckIn(page);
  await mockWeather(page);
  await page.route(`**/api/books/${BOOK.id}`, (route) => route.fulfill({ json: { book: BOOK } }));
  await page.route(`**/api/books/${BOOK.id}/reviews`, (route) => route.fulfill({ json: { reviews: [] } }));
});

async function openPage(page) {
  await page.goto(`/books/${BOOK.id}`);
  const title = page.getByRole("heading", { level: 1, name: BOOK.title });
  await expect(title).toBeVisible();
  return {
    title: await title.boundingBox(),
    cover: await page.getByRole("img", { name: `${BOOK.title}, no cover picture` }).boundingBox(),
    synopsis: await page.getByRole("region", { name: "Synopsis" }).boundingBox(),
    reviews: await page.getByRole("region", { name: "Reviews" }).boundingBox(),
  };
}

test.describe("on a laptop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the book page fills the window: cover on the left, details beside it, synopsis and reviews below", async ({ page }) => {
    const { title, cover, synopsis, reviews } = await openPage(page);

    // wider than the 480 px phone column
    expect(synopsis.width).toBeGreaterThan(600);
    // the cover beside the title, in the same band
    expect(cover.x + cover.width).toBeLessThanOrEqual(title.x);
    expect(title.y).toBeLessThan(cover.y + cover.height);
    // synopsis and reviews start under the cover
    expect(synopsis.y).toBeGreaterThanOrEqual(cover.y + cover.height);
    expect(reviews.y).toBeGreaterThan(synopsis.y);
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 360, height: 720 } });

  test("the book page stays one column, with no sideways scroll", async ({ page }) => {
    const { title, cover } = await openPage(page);

    expect(title.y).toBeGreaterThanOrEqual(cover.y + cover.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
});
