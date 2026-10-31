// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, goToPlace, mockWeather, roomReady, skipMoodCheckIn, test } from "./fixtures.js";

// Every reader's reviews on a book (ticket 09), and writing, editing and deleting your own
// (ticket 10). The server's demo readers have reviewed Pride and Prejudice (demo-shelf-7):
// Emma Tan, Mei Chen (stars only) and Rin Sato, whose profile is private.
const PRIDE = "/books/demo-shelf-7";

const reviews = (page) => page.getByRole("region", { name: "Reviews" });
const reviewBy = (page, name) => reviews(page).getByRole("listitem").filter({ hasText: name });

test.beforeEach(async ({ page }) => {
  await skipMoodCheckIn(page);
  await mockWeather(page);
});

test.describe("everyone's reviews", () => {
  test("the book page lists every reader's review: name, stars, caption and when", async ({ page }) => {
    await page.goto(PRIDE);

    const emma = reviewBy(page, "Emma Tan");
    await expect(emma).toContainText("Rated 5 out of 5");
    await expect(emma).toContainText("Funnier every time I read it.");
    await expect(emma.locator("time")).toHaveText("3 days ago");
    // the exact date on hover
    await expect(emma.locator("time")).toHaveAttribute("title", /\d{4}/);

    // a stars-only review shows too
    await expect(reviewBy(page, "Mei Chen")).toContainText("Rated 4 out of 5");
  });

  test("a reviewer's name goes to their page; a private reader's name is not a link", async ({ page }) => {
    await page.goto(PRIDE);

    await expect(reviewBy(page, "Rin Sato")).toContainText("Slow start, lovely ending.");
    await expect(reviewBy(page, "Rin Sato").getByRole("link")).toHaveCount(0);

    await reviewBy(page, "Emma Tan").getByRole("link", { name: "Emma Tan" }).click();
    await expect(page).toHaveURL(/\/people\/emma\.reads$/);
    await expect(page.getByRole("heading", { level: 1, name: "Emma Tan" })).toBeVisible();
  });

  test("the rating is the Readalot readers' average, or Google's when nobody here has rated it", async ({ page }) => {
    // Pride and Prejudice: 5, 4 and 3 stars here; 4.3 on Google
    await page.goto(PRIDE);
    const rating = page.getByRole("region", { name: "Rating" });
    await expect(rating).toContainText("4 / 5");
    await expect(rating).toContainText("from 3 Readalot readers");

    // The Great Gatsby: no reviews here; 3.9 on Google
    await page.goto("/books/demo-shelf-9");
    await expect(reviews(page)).toContainText("No one has reviewed it yet.");
    await expect(rating).toContainText("3.9 / 5");
    await expect(rating).toContainText("from Google Books");
  });

  test("the genre card, My Shelf's card and the room's card list the reviews and the readers' average", async ({ page }) => {
    const { book } = await (await page.request.get("/api/books/demo-shelf-7")).json();
    await page.route("**/api/books/search**", (route) => route.fulfill({ json: { books: [book] } }));

    await page.goto("/discover/classics");
    await page.getByRole("button", { name: /^Pride and Prejudice/ }).click();
    const genreCard = page.getByRole("dialog", { name: "Quick preview: Pride and Prejudice" });
    await expect(genreCard.getByRole("region", { name: "Reviews" })).toContainText("Emma Tan");
    await expect(genreCard).toContainText("from 3 Readalot readers");

    await page.goto("/house/shelf");
    await page.getByRole("region", { name: /^Finished reading/ }).getByRole("button", { name: /^Pride and Prejudice/ }).click();
    const shelfCard = page.getByRole("dialog", { name: "Book details" });
    await expect(shelfCard.getByRole("region", { name: "Reviews" })).toContainText("Emma Tan");
    await expect(shelfCard).toContainText("from 3 Readalot readers");

    await page.goto("/house");
    await roomReady(page);
    await goToPlace(page, "Bookshelf");
    await page.getByRole("button", { name: "Pride and Prejudice by Jane Austen" }).click();
    await expect(page.getByRole("dialog", { name: "Book details" }).getByRole("region", { name: "Reviews" })).toContainText("Emma Tan");
  });
});

test.describe("your own review", () => {
  // a book that isn't on the shelf, and that no other test reviews
  const BOOK = { id: "review-journey-1", title: "The Lamplit Library", authors: ["A. Writer"], coverUrl: "", description: "A dragon keeps a library.", genres: ["Fantasy"], averageRating: 3.5 };

  test.beforeEach(async ({ page }) => {
    await page.route(`**/api/books/${BOOK.id}`, (route) => route.fulfill({ json: { book: BOOK } }));
  });

  test("rate and review a book you haven't shelved, then edit and delete it", async ({ page }) => {
    await page.goto(`/books/${BOOK.id}`);
    await expect(reviews(page)).toContainText("No one has reviewed it yet.");

    await reviews(page).getByRole("radio", { name: "4 stars" }).check();
    await reviews(page).getByRole("textbox", { name: "Your review (optional)" }).fill("A cosy read.");
    await reviews(page).getByRole("button", { name: "Save review" }).click();

    const mine = reviewBy(page, "You");
    await expect(mine).toContainText("Rated 4 out of 5");
    await expect(mine).toContainText("A cosy read.");
    await expect(mine.getByRole("link", { name: "You" })).toHaveAttribute("href", "/salon");
    await expect(page.getByRole("region", { name: "Rating" })).toContainText("from 1 Readalot reader");

    await mine.getByRole("button", { name: "Edit your review" }).click();
    await reviews(page).getByRole("radio", { name: "2 stars" }).check();
    await reviews(page).getByRole("textbox", { name: "Your review (optional)" }).fill("Changed my mind.");
    await reviews(page).getByRole("button", { name: "Save review" }).click();
    await expect(mine).toContainText("Rated 2 out of 5");
    await expect(mine).toContainText("Changed my mind.");

    await mine.getByRole("button", { name: "Delete your review" }).click();
    await expect(reviews(page)).toContainText("No one has reviewed it yet.");
    await expect(page.getByRole("region", { name: "Rating" })).toContainText("from Google Books");
  });

  test("a rating is needed, a caption stops at 500 characters, and others' reviews can't be changed", async ({ page }) => {
    await page.goto(PRIDE);
    await expect(reviewBy(page, "Emma Tan")).toBeVisible();
    await expect(reviewBy(page, "Emma Tan").getByRole("button")).toHaveCount(0);

    const save = reviews(page).getByRole("button", { name: "Save review" });
    const caption = reviews(page).getByRole("textbox", { name: "Your review (optional)" });
    await caption.fill("x".repeat(520));
    await expect(caption).toHaveValue("x".repeat(500));
    await expect(reviews(page)).toContainText("500 / 500");
    // no stars, no saving
    await expect(save).toBeDisabled();
    await reviews(page).getByRole("radio", { name: "1 star", exact: true }).check();
    await expect(save).toBeEnabled();

    // the server holds the same rules
    const tooMany = await page.request.post("/api/books/demo-shelf-7/reviews", { data: { rating: 6 } });
    expect(tooMany.status()).toBe(400);
    const tooLong = await page.request.post("/api/books/demo-shelf-7/reviews", { data: { rating: 3, reviewText: "x".repeat(501) } });
    expect(tooLong.status()).toBe(400);
  });

  test("your shelf takes your rating from your review", async ({ page }) => {
    const openGoneGirl = async () => {
      await roomReady(page);
      await goToPlace(page, "Bookshelf");
      await page.getByRole("button", { name: "Gone Girl by Gillian Flynn" }).click();
      return page.getByRole("dialog", { name: "Book details" });
    };
    await page.goto("/house");
    let card = await openGoneGirl();
    await expect(card.getByRole("link", { name: "Rate" })).toBeVisible();

    await card.getByRole("radio", { name: "5 stars" }).check();
    await card.getByRole("textbox", { name: "Your review (optional)" }).fill("Gripping.");
    await card.getByRole("button", { name: "Save review" }).click();
    await expect(card.getByRole("link", { name: "View review and rating" })).toBeVisible();

    // saved: the shelf reads it back from the reviews
    await page.reload();
    card = await openGoneGirl();
    await expect(card.getByRole("link", { name: "View review and rating" })).toBeVisible();

    await card.getByRole("button", { name: "Delete your review" }).click();
    await expect(card.getByRole("link", { name: "Rate" })).toBeVisible();
  });
});
