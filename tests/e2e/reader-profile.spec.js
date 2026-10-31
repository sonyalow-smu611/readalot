// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test } from "./fixtures.js";

// A reader's profile, opened from a reader in the Cafe: who they are, how well your reading
// matches, and the way into their room. The signed-in test reader likes Fantasy and has no books;
// Emma likes Fantasy, Mystery and Romance.
test.use({ viewport: { width: 390, height: 844 } });

// your shelf is the shared demo shelf, which other tests change: it is answered here instead
test.beforeEach(async ({ page }) => {
  await page.route("**/api/user-books", (route) =>
    route.request().method() === "GET" ? route.fulfill({ json: { books: [] } }) : route.fallback()
  );
});

test.describe("the reader card", () => {
  test("shows their name, handle and how well your reading matches", async ({ page }) => {
    await page.goto("/people/emma.reads");

    await expect(page.getByRole("heading", { level: 1, name: "Emma Tan" })).toBeVisible();
    await expect(page.getByText("@emma.reads · Bishan", { exact: true })).toBeVisible();
    // no shared books, and your one favourite genre is one of hers: 40% (60% books + 40% genres)
    const match = page.getByRole("progressbar", { name: "Reading match" });
    await expect(match).toHaveAttribute("aria-valuenow", "40");
    await expect(page.getByText("40%", { exact: true })).toBeVisible();
  });

  test("shows their town character, described for screen readers", async ({ page }) => {
    await page.goto("/people/emma.reads");
    await expect(page.getByRole("img", { name: "Emma Tan's town character" })).toBeVisible();
  });
});

test.describe("follow", () => {
  test("Follow turns to Following and is still on after a reload", async ({ page }) => {
    await page.goto("/people/emma.reads");
    await page.getByRole("button", { name: "Follow", exact: true }).click();

    const following = page.getByRole("button", { name: "Following", exact: true });
    await expect(following).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(following).toHaveAttribute("aria-pressed", "true");

    // and off again, so the next test meets Emma unfollowed
    await following.click();
    await expect(page.getByRole("button", { name: "Follow", exact: true })).toHaveAttribute("aria-pressed", "false");
  });

  test("a follow that isn't saved says so", async ({ page }) => {
    await page.route("**/api/people/*/follow", (route) => route.fulfill({ status: 500, json: { error: "Server error" } }));
    await page.goto("/people/emma.reads");
    await page.getByRole("button", { name: "Follow", exact: true }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("button", { name: "Follow", exact: true })).toHaveAttribute("aria-pressed", "false");
  });
});

test.describe("message", () => {
  test("Message opens the chat over the profile, and Escape closes it back to Message", async ({ page }) => {
    await page.goto("/people/emma.reads");
    // the chat isn't on the page itself
    await expect(page.getByRole("textbox", { name: "Message" })).toHaveCount(0);

    const message = page.getByRole("button", { name: "Message", exact: true });
    await message.click();
    const chat = page.getByRole("dialog", { name: "Message Emma" });
    await expect(chat).toBeVisible();
    await expect(chat).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(chat).toBeHidden();
    await expect(message).toBeFocused();
  });

  test("the chat works inside it, and Close gives focus back to Message", async ({ page }) => {
    await page.goto("/people/emma.reads");
    const message = page.getByRole("button", { name: "Message", exact: true });
    await message.click();
    const chat = page.getByRole("dialog", { name: "Message Emma" });

    await chat.getByRole("textbox", { name: "Message" }).fill("Have you read The Hobbit?");
    await chat.getByRole("button", { name: "Send" }).click();
    await expect(chat.getByText("Have you read The Hobbit?")).toBeVisible();

    await chat.getByRole("button", { name: "Close" }).click();
    await expect(chat).toBeHidden();
    await expect(message).toBeFocused();
  });
});

// the readers as the server sends them, with Emma's shelf changed by `change`
async function changeEmma(page, change) {
  await page.route("**/api/people", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.readers = body.readers.map((reader) => (reader.id === "emma.reads" ? change(reader) : reader));
    await route.fulfill({ response, json: body });
  });
}

const card = (page, title) => page.getByRole("region", { name: title });

test.describe("currently reading", () => {
  test("shows the book they're reading, its author and its genre", async ({ page }) => {
    await page.goto("/people/emma.reads");
    const reading = card(page, "Currently Reading");
    await expect(reading.getByText("The Secret History", { exact: true })).toBeVisible();
    await expect(reading.getByText("by Donna Tartt", { exact: true })).toBeVisible();
    await expect(reading.getByText("Mystery", { exact: true })).toBeVisible();
  });

  test("says so when they aren't reading anything", async ({ page }) => {
    await changeEmma(page, (emma) => ({ ...emma, books: emma.books.map((book) => ({ ...book, status: "read" })) }));
    await page.goto("/people/emma.reads");
    await expect(card(page, "Currently Reading").getByText("Not reading anything right now")).toBeVisible();
  });

  test("the genre chip's label is readable on its colour", async ({ page }) => {
    await page.goto("/people/emma.reads");
    const chip = card(page, "Currently Reading").getByText("Mystery", { exact: true });
    const ratio = await chip.evaluate((el) => {
      const parse = (colour) => (colour.match(/[\d.]+/g) || []).map(Number).slice(0, 3);
      const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const style = getComputedStyle(el);
      const [hi, lo] = [lum(parse(style.color)), lum(parse(style.backgroundColor))].sort((a, b) => b - a);
      return (hi + 0.05) / (lo + 0.05);
    });
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});

test.describe("reading prefs", () => {
  test("lists their favourite genres, stars the ones you share and counts them", async ({ page }) => {
    await page.goto("/people/emma.reads");
    const prefs = card(page, "Reading Prefs");
    const genres = prefs.getByRole("list", { name: "Favourite genres" }).getByRole("listitem");
    await expect(genres).toHaveText(["★ Fantasy, you both like it", "Mystery", "Romance"]);
    await expect(prefs.getByText("★ 1 in common: Fantasy", { exact: true })).toBeVisible();
  });

  test("says so when you share no genres", async ({ page }) => {
    await changeEmma(page, (emma) => ({ ...emma, favoriteGenres: ["Mystery", "Romance"] }));
    await page.goto("/people/emma.reads");
    const prefs = card(page, "Reading Prefs");
    await expect(prefs.getByRole("list", { name: "Favourite genres" }).getByRole("listitem")).toHaveText(["Mystery", "Romance"]);
    await expect(prefs.getByText("No genres in common yet", { exact: true })).toBeVisible();
  });
});

test.describe("books you both have", () => {
  test("lists the books on both your shelves", async ({ page }) => {
    // your shelf has The Hobbit, which Emma has read (a newer route wins over beforeEach's)
    const hobbit = { id: "your-hobbit", title: "The Hobbit", authors: ["J.R.R. Tolkien"], status: "read" };
    await page.route("**/api/user-books", (route) =>
      route.request().method() === "GET" ? route.fulfill({ json: { books: [hobbit] } }) : route.fallback()
    );
    await page.goto("/people/emma.reads");
    const both = card(page, "Books You Both Have");
    await expect(both.getByText("1 shared book with You", { exact: true })).toBeVisible();
    await expect(both.getByText("The Hobbit", { exact: true })).toBeVisible();
    await expect(both.getByText("by J. R. R. Tolkien", { exact: true })).toBeVisible();
  });

  test("with none, points you to their shelf", async ({ page }) => {
    await page.goto("/people/emma.reads");
    const both = card(page, "Books You Both Have");
    await expect(both.getByText("No books in common yet.", { exact: false })).toBeVisible();
    await both.getByRole("link", { name: "See Emma's shelf" }).click();
    await expect(page).toHaveURL(/\/people\/emma\.reads\/room\/shelf$/);
  });

  test("the old tagline and bookshelf list are gone", async ({ page }) => {
    await page.goto("/people/emma.reads");
    await expect(card(page, "Books You Both Have")).toBeVisible();
    await expect(page.getByText("One more chapter, always.")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Finished" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Emma Tan's Bookshelf" })).toHaveCount(0);
    await expect(page.getByText(/sample readers/)).toBeVisible();
  });
});

test("an address with no reader says so and leads back to the Cafe", async ({ page }) => {
  await page.goto("/people/nobody.here");
  await expect(page.getByRole("heading", { level: 1, name: "Reader not found" })).toBeVisible();
  await page.getByRole("link", { name: "Find readers in the Cafe" }).click();
  await expect(page).toHaveURL(/\/cafe$/);
});

test.describe("on a small phone", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("nothing scrolls sideways", async ({ page }) => {
    await page.goto("/people/emma.reads");
    await expect(page.getByRole("heading", { level: 1, name: "Emma Tan" })).toBeVisible();
    const sideways = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sideways).toBe(0);
  });
});
