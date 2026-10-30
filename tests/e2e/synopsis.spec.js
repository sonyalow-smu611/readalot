// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, mockWeather, skipMoodCheckIn, test } from "./fixtures.js";

// A book's synopsis, on a genre's book card and on the book's own page: Google's leftover HTML
// taken out, its breaks made into paragraphs, and a long one cut short with Read more.
test.use({ viewport: { width: 480, height: 800 } });

// what Google Books sends: tags, entities and line breaks mixed into the text
const MESSY = "<p>A <b>dragon</b> keeps a library &amp; lends its books.</p><p>One night a book goes missing.<br>Nobody&#39;s safe.</p>";

const book = (id, description) => ({ id, title: `Synopsis ${id}`, authors: ["A. Writer"], coverUrl: "", description });

test.beforeEach(async ({ page }) => {
  await skipMoodCheckIn(page);
  await mockWeather(page);
});

// the genre page with these books on it, then the first one's card
async function openGenreCard(page, books) {
  await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books } }));
  await page.goto("/discover/fantasy");
  await page.getByRole("button", { name: new RegExp(`^${books[0].title}`) }).click();
  const card = page.getByRole("dialog", { name: `Quick preview: ${books[0].title}` });
  await expect(card).toBeVisible();
  return card;
}

// the book's own page, its synopsis section
async function openBookPage(page, entry) {
  await page.route(`**/api/books/${entry.id}`, (route) => route.fulfill({ json: { book: entry } }));
  await page.goto(`/books/${entry.id}`);
  const synopsis = page.getByRole("region", { name: "Synopsis" });
  await expect(synopsis).toBeVisible();
  return synopsis;
}

// each paragraph's text, as the reader sees it
const paragraphs = (where) => where.locator("p").filter({ visible: true }).allInnerTexts();

test.describe("a synopsis with Google's leftover HTML", () => {
  const CLEAN = ["A dragon keeps a library & lends its books.", "One night a book goes missing.\nNobody's safe."];

  test("reads as plain paragraphs on a genre's book card", async ({ page }) => {
    const card = await openGenreCard(page, [book("messy-card", MESSY)]);
    const shown = await paragraphs(card);
    for (const text of CLEAN) expect(shown).toContain(text);
    await expect(card).not.toContainText(/<\/?[a-z]|&[a-z#0-9]+;/i);
  });

  test("reads as plain paragraphs on the book's page", async ({ page }) => {
    const synopsis = await openBookPage(page, book("messy-page", MESSY));
    expect(await paragraphs(synopsis)).toEqual(CLEAN);
    await expect(synopsis).not.toContainText(/<\/?[a-z]|&[a-z#0-9]+;/i);
  });
});

// three long paragraphs: far more than six lines on a phone
const LONG = Array.from({ length: 3 }, (_, n) => `Paragraph ${n + 1}. ${"The dragon reads by lamplight and the library grows. ".repeat(6)}`).join("\n\n");
const SHORT = "A dragon keeps a library.";

// whether the synopsis's text runs past what it shows
const cutShort = (text) => text.evaluate((el) => el.scrollHeight > el.clientHeight + 1);

for (const [where, open] of [
  ["a genre's book card", (page, entry) => openGenreCard(page, [entry])],
  ["the book's page", openBookPage],
]) {
  test.describe(`a synopsis on ${where}`, () => {
    test("a long one is cut short, and Read more and Show less open and close it", async ({ page }) => {
      const scope = await open(page, book(`long-${where.length}`, LONG));
      const more = scope.getByRole("button", { name: "Read more" });
      await expect(more).toHaveAttribute("aria-expanded", "false");
      const text = page.locator(`#${await more.getAttribute("aria-controls")}`);
      expect(await cutShort(text)).toBe(true);

      await more.click();
      const less = scope.getByRole("button", { name: "Show less" });
      await expect(less).toHaveAttribute("aria-expanded", "true");
      expect(await cutShort(text)).toBe(false);
      await expect(text.getByText(/^Paragraph 3\./)).toBeVisible();

      await less.click();
      await expect(scope.getByRole("button", { name: "Read more" })).toHaveAttribute("aria-expanded", "false");
      expect(await cutShort(text)).toBe(true);
    });

    test("a short one shows in full, with no Read more", async ({ page }) => {
      const scope = await open(page, book(`short-${where.length}`, SHORT));
      await expect(scope.getByText(SHORT)).toBeVisible();
      await expect(scope.getByRole("button", { name: /^(Read more|Show less)$/ })).toHaveCount(0);
    });

    test("a book with no synopsis says so", async ({ page }) => {
      const scope = await open(page, book(`none-${where.length}`, ""));
      await expect(scope.getByText("No synopsis for this book yet.")).toBeVisible();
      await expect(scope.getByRole("button", { name: /^(Read more|Show less)$/ })).toHaveCount(0);
    });
  });
}
