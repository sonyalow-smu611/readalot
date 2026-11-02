// Scaffolded with AI assistance — see AI_USAGE.md
import { test as signedOut } from "@playwright/test";
import { expect, mockWeather, skipMoodCheckIn, test } from "./fixtures.js";

// The pixel look everywhere: titles in the pixel buttons' font (Arial bold), and cards, tags,
// inputs and modals square, with a black outline and a hard shadow, like the pixel buttons.
test.use({ viewport: { width: 360, height: 720 } });

const BOOK = { id: "pixel-look-1", title: "The Lamplit Library", authors: ["A. Writer"], coverUrl: "", description: "A dragon keeps a library.", genres: ["Fantasy"] };

test.beforeEach(async ({ page }) => {
  await skipMoodCheckIn(page);
  await mockWeather(page);
  await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books: [BOOK] } }));
  await page.route(`**/api/books/${BOOK.id}`, (route) => route.fulfill({ json: { book: BOOK } }));
  await page.route(`**/api/books/${BOOK.id}/reviews`, (route) => route.fulfill({ json: { reviews: [] } }));
});

// how a box is drawn: corners, outline, and its shadows that aren't inset
function look(locator) {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el);
    const shadows = style.boxShadow === "none" ? [] : style.boxShadow.split(/,(?![^(]*\))/).map((one) => one.trim());
    return {
      radius: ["TopLeft", "TopRight", "BottomLeft", "BottomRight"].map((c) => parseFloat(style[`border${c}Radius`])),
      width: parseFloat(style.borderTopWidth),
      lineStyle: style.borderTopStyle,
      colour: (style.borderTopColor.match(/[\d.]+/g) || []).slice(0, 3).map(Number),
      drops: shadows.filter((one) => !one.includes("inset")).map((one) => (one.match(/-?[\d.]+px/g) || []).map(parseFloat)),
    };
  });
}

// square, with a black (very dark) outline of at least 2 px
function expectPixelBox(box) {
  expect(box.radius).toEqual([0, 0, 0, 0]);
  expect(box.width).toBeGreaterThanOrEqual(2);
  expect(box.lineStyle).toBe("solid");
  for (const channel of box.colour) expect(channel).toBeLessThan(60);
}

// a shadow set off to the lower right with no blur
function expectHardShadow(box) {
  expect(box.drops.some(([x, y, blur = 0]) => x > 0 && y > 0 && blur === 0)).toBe(true);
}

test.describe("titles", () => {
  for (const [where, path] of [
    ["the town", "/"],
    ["the library", "/library"],
    ["a genre page", "/discover/fantasy"],
    ["the book page", `/books/${BOOK.id}`],
    ["My Shelf", "/house/shelf"],
    ["the salon", "/salon"],
  ]) {
    test(`on ${where} are in the pixel buttons' font, not Georgia`, async ({ page }) => {
      await page.goto(path);
      const headings = page.getByRole("heading");
      await expect(headings.first()).toBeVisible({ timeout: 15000 });
      const fonts = await headings.evaluateAll((all) => all.map((el) => `${el.textContent.trim().slice(0, 30)}: ${getComputedStyle(el).fontFamily}`));
      expect(fonts.filter((font) => /georgia|times|(^|[:,]\s*)serif/i.test(font))).toEqual([]);
    });
  }
});

test.describe("surfaces", () => {
  test("the book page's card is square, outlined in black, with a hard shadow, and its genre tag square and outlined", async ({ page }) => {
    await page.goto(`/books/${BOOK.id}`);
    await expect(page.getByRole("heading", { level: 1, name: BOOK.title })).toBeVisible();

    const card = await look(page.locator(".book-card"));
    expectPixelBox(card);
    expectHardShadow(card);
    expectPixelBox(await look(page.getByRole("list", { name: "Genres" }).getByRole("listitem").first()));
  });

  test("a genre's book card (a modal) is square, outlined in black, with a hard shadow", async ({ page }) => {
    await page.goto("/discover/fantasy");
    await page.getByRole("button", { name: new RegExp(`^${BOOK.title}`) }).click();
    const modal = await look(page.getByRole("dialog", { name: `Quick preview: ${BOOK.title}` }).locator(".modal-content"));
    expectPixelBox(modal);
    expectHardShadow(modal);
  });
});

// the search bars have their own ticket (pixel-and-reviews 02); a form's text box is Bootstrap's
signedOut("a form's text box is square and outlined in black", async ({ page }) => {
  await page.goto("/login");
  const input = page.getByRole("textbox").first();
  await expect(input).toBeVisible();
  expectPixelBox(await look(input));
});
