// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test } from "./fixtures.js";

// A book found in the library (or search) offers two simple choices: Add to To be read, which
// puts it on the To be read shelf in My Room, and Where to get, which lists shops and the library.
const id = `find-${Date.now()}`;
const BOOK = { id, title: "The Midnight Library", authors: ["Matt Haig"], isbn: "9780525559474", coverUrl: "", description: "Between life and death there is a library." };

test.beforeEach(async ({ page }) => {
  // the test server finds books on Google Books, which knows nothing of this one: the shelf
  // here starts empty and keeps what is added to it
  const added = [];
  await page.route("**/api/user-books", (route) => {
    if (route.request().method() === "POST") {
      const { bookId, status } = route.request().postDataJSON();
      if (bookId === id) added.push({ ...BOOK, status });
      return route.fulfill({ json: { userBook: { bookId, status } } });
    }
    return route.fulfill({ json: { books: added } });
  });
  await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books: [BOOK] } }));
  await page.route(`**/api/books/${id}`, (route) => route.fulfill({ json: { book: BOOK } }));
  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "sunny", temperature: 29, weatherCode: 0, isDay: true } })
  );
  await page.goto("/library");
  await page.getByRole("button", { name: "Fantasy bookcase" }).click();
  await page.getByRole("dialog", { name: "Fantasy" }).getByRole("button", { name: "The Midnight Library by Matt Haig" }).click();
});

const preview = (page) => page.getByRole("dialog", { name: "Quick preview: The Midnight Library" });

test("a found book offers Add to To be read and Where to get, not the three reading statuses", async ({ page }) => {
  await expect(preview(page).getByRole("button", { name: "Add to To be read" })).toBeVisible();
  await expect(preview(page).getByRole("button", { name: "Where to get" })).toBeVisible();
  await expect(preview(page).getByText("Reading status")).toHaveCount(0);
  await expect(preview(page).getByRole("button", { name: /^(Want to Read|Reading|Read)$/ })).toHaveCount(0);
});

test("Add to To be read puts the book on that shelf, and the preview says so", async ({ page }) => {
  await preview(page).getByRole("button", { name: "Add to To be read" }).click();
  await expect(preview(page).getByRole("status")).toHaveText(/On your To be read shelf/);
  await expect(preview(page).getByRole("button", { name: "Add to To be read" })).toHaveCount(0);

  // My Room's shelf has it under To be read
  await preview(page).getByRole("link", { name: "See it in My Room" }).click();
  await expect(page).toHaveURL(/\/house\/shelf/);
  await expect(page.getByRole("region", { name: /^To be read/ }).getByText("The Midnight Library").first()).toBeVisible();
});

test("Where to get lists shops and the library, each opening that shop's search in a new tab", async ({ page }) => {
  const toggle = preview(page).getByRole("button", { name: "Where to get" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  const shops = preview(page).getByRole("region", { name: "Where to get this book" });
  for (const heading of ["Bookshops in Singapore", "Online bookshops", "Marketplaces", "Ebooks", "Borrow it free"]) {
    await expect(shops.getByRole("heading", { name: heading })).toBeVisible();
  }
  // shops that search by ISBN get it; the rest get the title and author
  const amazon = shops.getByRole("link", { name: /^Amazon Singapore/ });
  await expect(amazon).toHaveAttribute("href", /amazon\.sg\/s\?k=9780525559474/);
  await expect(amazon).toHaveAttribute("target", "_blank");
  await expect(shops.getByRole("link", { name: /^NLB libraries/ })).toHaveAttribute("href", /nlb\.gov\.sg.*The%20Midnight%20Library%20Matt%20Haig/);
  await expect(shops.getByRole("link", { name: /^Shopee/ })).toHaveAttribute("href", /shopee\.sg\/search\?keyword=The%20Midnight%20Library/);
});

test("the reviews wait behind their own button", async ({ page }) => {
  const toggle = preview(page).getByRole("button", { name: /^Leave\/Read Reviews/ });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(preview(page).getByRole("heading", { name: "Reviews" })).toBeHidden();
  await toggle.click();
  await expect(preview(page).getByRole("heading", { name: "Reviews" })).toBeVisible();
  await expect(preview(page).getByRole("button", { name: "Hide reviews" })).toBeVisible();
});

test.describe("the book's own page", () => {
  test("a book not on the shelf offers Add to To be read and Where to get, then shows its shelves by My Room's names", async ({ page }) => {
    await preview(page).getByRole("link", { name: "Open full book page" }).click();
    await expect(page).toHaveURL(new RegExp(`/books/${id}$`));
    await expect(page.getByRole("heading", { level: 1, name: "The Midnight Library" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Reading status" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Where to get" })).toBeVisible();

    await page.getByRole("button", { name: "Add to To be read" }).click();
    const shelves = page.getByRole("group", { name: "Reading status" });
    await expect(shelves.getByRole("button")).toHaveText(["To be read", "Currently reading", "Finished reading"]);
    await expect(shelves.getByRole("button", { name: "To be read" })).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("on a laptop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the preview is roomy: wide, with the cover in a column on the left", async ({ page }) => {
    const dialog = preview(page).locator(".modal-content");
    await expect.poll(async () => (await dialog.boundingBox()).width).toBeGreaterThan(800);
    const cover = await preview(page).locator(".preview__cover").boundingBox();
    const title = await preview(page).getByRole("heading", { name: "The Midnight Library" }).boundingBox();
    const add = await preview(page).getByRole("button", { name: "Add to To be read" }).boundingBox();
    // the title and the choices sit beside the cover, not under it
    expect(title.x).toBeGreaterThan(cover.x + cover.width);
    expect(add.x).toBeGreaterThan(cover.x + cover.width);
    expect(cover.width).toBeGreaterThan(200);
  });
});
