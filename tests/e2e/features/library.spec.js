// Scaffolded with AI assistance — see AI_USAGE.md
import { test, expect, BOOK, catalogue, fitsScreen } from "./fixtures.js";
import { openPlaces } from "../fixtures.js";

const GENRES = ["Bestsellers", "Romance", "Romantasy", "Fantasy", "Mystery & Thriller", "Horror", "Science Fiction", "Historical Fiction", "Young Adult", "Memoir & Biography", "Graphic Novels & Manga"];
const preview = (page) => page.getByRole("dialog", { name: `Quick preview: ${BOOK.title}` });

test.beforeEach(async ({ page }) => {
  await catalogue(page);
  await page.route("**/api/books/bestsellers**", (route) => route.fulfill({ json: { books: [BOOK] } }));
});

test("LIB-01 desk lamp switches off/on, independently, and persists", async ({ page }) => {
  await page.goto("/library");
  const lamp = page.getByRole("button", { name: "Help desk lamp", exact: true });
  await expect(lamp).toHaveAttribute("aria-pressed", "true");
  await lamp.click();
  await expect(lamp).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: "Help desk ceiling lamp" })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(lamp).toHaveAttribute("aria-pressed", "false");
  await lamp.click();
  await expect(lamp).toHaveAttribute("aria-pressed", "true");
});

test("LIB-02 help desk searches by the start of a title", async ({ page }) => {
  await page.goto("/library");
  await (await openPlaces(page)).getByRole("button", { name: "Help desk", exact: true }).click();
  await page.getByRole("button", { name: "Help desk: search for any book" }).click();
  const search = page.getByRole("searchbox", { name: "Search books or authors" });
  await expect(search).toBeFocused();
  await search.fill("The Mid");
  const sent = page.waitForRequest((request) => request.url().includes("/api/books/search") && new URL(request.url()).searchParams.get("q") === "The Mid");
  await search.press("Enter");
  await sent;
  await expect(page).toHaveURL(/\/search\?q=The(?:\+|%20)Mid$/);
  await page.getByRole("button", { name: `${BOOK.title} by Matt Haig` }).click();
  await expect(preview(page)).toBeVisible();
});

for (const genre of GENRES) {
  test(`LIB-03 ${genre}: open shelf, inspect Covers and Spines, open book`, async ({ page }, testInfo) => {
    await page.goto("/library");
    const menuLabel = { "Science Fiction": "Sci-Fi", "Memoir & Biography": "Memoir", "Graphic Novels & Manga": "Graphic Novels" }[genre] || genre;
    await (await openPlaces(page)).getByRole("button", { name: menuLabel, exact: true }).click();
    await page.getByRole("button", { name: `${genre} bookcase`, exact: true }).click();
    const shelf = page.getByRole("dialog", { name: genre, exact: true });
    const mode = shelf.getByRole("group", { name: "Show the books by" });
    for (const choice of ["Covers", "Spines"]) {
      await mode.getByRole("button", { name: choice, exact: true }).click();
      await expect(mode.getByRole("button", { name: choice, exact: true })).toHaveAttribute("aria-pressed", "true");
      await expect(shelf.getByRole("button", { name: `${BOOK.title} by Matt Haig` })).toBeVisible();
      // Both renderings are kept in the HTML report for the team's visual review.
      await testInfo.attach(`${genre}-${choice}`, { body: await shelf.screenshot(), contentType: "image/png" });
    }
    await shelf.getByRole("button", { name: `${BOOK.title} by Matt Haig` }).click();
    await expect(preview(page).getByRole("heading", { name: BOOK.title })).toBeVisible();
    await preview(page).getByRole("button", { name: "Close", exact: true }).click();
    await shelf.getByRole("button", { name: "Back to the hall" }).click();
    await expect(shelf).toBeHidden();
    await fitsScreen(page);
  });
}

test("LIB-04 uploaded cover reaches the scanner and opens the matched book", async ({ page }) => {
  let upload;
  await page.route("**/api/scan-book", (route) => {
    upload = route.request();
    return route.fulfill({ json: { book: BOOK, detectedText: BOOK.title, confidence: 0.95 } });
  });
  await page.goto("/library?scan=1");
  const scanner = page.getByRole("dialog", { name: "Book scanner" });
  await scanner.getByLabel("Or upload a photo of the cover").setInputFiles({
    name: "cover.png", mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"),
  });
  await expect(preview(page)).toBeVisible();
  expect(upload.method()).toBe("POST");
  expect(upload.postDataBuffer().length).toBeGreaterThan(0);
  await preview(page).getByRole("button", { name: "Close", exact: true }).click();
  await scanner.getByRole("button", { name: "Close", exact: true }).click();
  await expect(scanner).toBeHidden();
});

test("LIB-05 preview actions: add, undo, shops, reviews, and full page", async ({ page }) => {
  await page.goto("/library");
  await (await openPlaces(page)).getByRole("button", { name: "Fantasy", exact: true }).click();
  await page.getByRole("button", { name: "Fantasy bookcase" }).click();
  await page.getByRole("dialog", { name: "Fantasy", exact: true }).getByRole("button", { name: `${BOOK.title} by Matt Haig` }).click();
  const card = preview(page);
  await card.getByRole("button", { name: "Add to To be read" }).click();
  await expect(card.getByRole("status")).toContainText("On your To be read shelf");
  await card.getByRole("button", { name: "Undo" }).click();
  await expect(card.getByRole("button", { name: "Add to To be read" })).toBeVisible();
  await card.getByRole("button", { name: "Where to get" }).click();
  const shops = card.getByRole("region", { name: "Where to get this book" });
  await expect(shops.getByRole("link", { name: /^Amazon Singapore/ })).toHaveAttribute("target", "_blank");
  await expect(shops.getByRole("link", { name: /^NLB libraries/ })).toHaveAttribute("href", /nlb\.gov\.sg/);
  await card.getByRole("button", { name: /^Leave\/Read Reviews/ }).click();
  await expect(card.getByRole("region", { name: "Reviews" })).toBeVisible();
  await card.getByRole("button", { name: "Hide reviews" }).click();
  await card.getByRole("link", { name: "Open full book page" }).click();
  await expect(page).toHaveURL(new RegExp(`/books/${BOOK.id}$`));
  await expect(page.getByRole("heading", { level: 1, name: BOOK.title })).toBeVisible();
});

test("LIB-06 full page: rate, review, reload, edit and delete", async ({ page }) => {
  await page.goto(`/books/${BOOK.id}`);
  const reviews = page.getByRole("region", { name: "Reviews" });
  await expect(reviews.getByRole("button", { name: "Post Review" })).toBeDisabled();
  await reviews.getByRole("radio", { name: "4 stars" }).check();
  await reviews.getByRole("textbox", { name: "Your review (optional)" }).fill("A thoughtful library adventure.");
  await reviews.getByRole("button", { name: "Post Review" }).click();
  await expect(reviews).toContainText("A thoughtful library adventure.");
  await page.reload();
  await expect(reviews).toContainText("A thoughtful library adventure.");
  await reviews.getByRole("button", { name: "Edit your review" }).click();
  await reviews.getByRole("radio", { name: "5 stars" }).check();
  await reviews.getByRole("textbox", { name: "Your review (optional)" }).fill("Even better on rereading.");
  await reviews.getByRole("button", { name: "Post Review" }).click();
  await expect(reviews).toContainText("Rated 5 out of 5");
  await expect(reviews).toContainText("Even better on rereading.");
  await reviews.getByRole("button", { name: "Delete your review" }).click();
  await expect(reviews).toContainText("No one has reviewed it yet.");
});
