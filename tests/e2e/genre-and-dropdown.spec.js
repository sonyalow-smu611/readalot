// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, mockWeather, skipMoodCheckIn, test } from "./fixtures.js";

// A favourite genre opens bookcases you swipe through, and the About you drop-down is the app's
// own, not the browser's.
const BOOKS = Array.from({ length: 24 }, (_, i) => ({
  id: `genre-${i}`,
  title: `Fantasy Book ${i + 1}`,
  authors: ["A. Writer"],
  coverUrl: "",
  ratingsCount: 100 - i,
}));

test.beforeEach(async ({ page }) => {
  await mockWeather(page);
  await skipMoodCheckIn(page);
});

test("a genre shows bookcases in a carousel, moved by swiping or by the arrows and dots", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books: BOOKS } }));
  await page.goto("/discover/fantasy");

  const carousel = page.getByRole("region", { name: /bookcases$/ });
  await expect(carousel.getByRole("group", { name: "Bookcase 1 of 2" })).toBeVisible();
  await expect(carousel.locator(".case__frame")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Previous bookcase" })).toBeDisabled();

  const track = carousel.locator(".genre__track");
  await page.getByRole("button", { name: "Next bookcase" }).click();
  await expect.poll(() => track.evaluate((el) => Math.round(el.scrollLeft / el.clientWidth))).toBe(1);
  await expect(page.getByRole("button", { name: "Next bookcase" })).toBeDisabled();

  // a swipe back: the track is scrolled the way a finger scrolls it
  await track.evaluate((el) => el.scrollTo({ left: 0 }));
  await expect(page.getByRole("button", { name: "Bookcase 1 of 2" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: /^Fantasy Book 1 by/ }).click();
  await expect(page.getByRole("dialog", { name: "Quick preview: Fantasy Book 1" })).toBeVisible();
});

test("About you's drop-down is the app's own list, not the browser's", async ({ page }) => {
  await page.goto("/salon");
  await page.getByRole("tab", { name: "Profile" }).click();
  await page.getByRole("button", { name: "Edit gender" }).click();

  expect(await page.locator("select").count()).toBe(0);
  const button = page.locator("#about-gender");
  await button.click();
  const list = page.getByRole("listbox");
  await expect(list).toBeVisible();
  await expect(list).toHaveCSS("box-shadow", /rgb\(30, 26, 36\) 3px 3px 0px 0px/);

  // the keyboard moves through it, and Escape closes the list but keeps the card
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(list).toBeHidden();
  await expect(page.getByRole("button", { name: "Save" })).toBeVisible();

  await button.click();
  await page.keyboard.press("Escape");
  await expect(list).toBeHidden();
  await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
});
