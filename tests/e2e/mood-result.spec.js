import { expect, mockWeather, test } from "./fixtures.js";

// The mood check-in: it opens on the first visit to My Room each day, recommends a book for the
// mood with a quote from it, and can be skipped for the day or reopened from the room menu.

const WALDEN = {
  mood: "calm",
  category: "nature",
  workId: "work-walden",
  book: { id: "work-walden", title: "Walden", authors: ["Henry David Thoreau"], coverUrl: "" },
  quote: { quoteText: "I went to the woods because I wished to live deliberately.", author: "Henry David Thoreau", work: "Walden" }
};
const WILLOWS = {
  mood: "calm",
  category: "wisdom",
  workId: "work-the-wind-in-the-willows",
  book: { id: "work-the-wind-in-the-willows", title: "The Wind in the Willows", authors: ["Kenneth Grahame"], coverUrl: "" },
  quote: { quoteText: "There is nothing half so much worth doing as simply messing about in boats.", author: "Kenneth Grahame", work: "The Wind in the Willows" }
};

// Recommendations are random and the quotes come from an outside API, so both are answered here,
// as is the room's live weather.
test.beforeEach(async ({ page }) => {
  await mockWeather(page);
  await page.route("**/api/recommendations*", (route) => {
    const asked = new URL(route.request().url()).searchParams;
    route.fulfill({ json: asked.get("exclude") === "work-walden" ? WILLOWS : WALDEN });
  });
});

test("first visit asks for a mood, then recommends a book with a quote from it", async ({ page }) => {
  await page.goto("/house");

  const checkIn = page.getByRole("dialog", { name: "How are you feeling today?" });
  await expect(checkIn).toBeVisible();
  for (const mood of ["Calm", "Low", "Stressed", "Excited"]) {
    await expect(checkIn.getByRole("button", { name: new RegExp(`^${mood}`) })).toBeVisible();
  }
  await expect(checkIn.getByRole("button", { name: "Continue" })).toBeDisabled();

  const asked = page.waitForRequest("**/api/recommendations*");
  await checkIn.getByRole("button", { name: /^Calm/ }).click();
  await checkIn.getByRole("button", { name: "Continue" }).click();
  expect(new URL((await asked).url()).searchParams.get("mood")).toBe("calm");

  const result = page.getByRole("dialog", { name: "A book for your mood" });
  await expect(result.getByRole("heading", { name: "Walden" })).toBeVisible();
  await expect(result.getByText("Henry David Thoreau", { exact: true })).toBeVisible();
  await expect(result.getByText("“I went to the woods because I wished to live deliberately.”")).toBeVisible();
  await expect(result.getByRole("link", { name: "Open book page" })).toHaveAttribute("href", "/books/work-walden");

  await result.getByRole("button", { name: "Show another recommendation" }).click();
  await expect(result.getByRole("heading", { name: "The Wind in the Willows" })).toBeVisible();
});

test("adding the recommended book puts it on the To Be Read shelf", async ({ page }) => {
  // the shelf is shared demo data: the save is answered here so other tests see it unchanged
  let saved = null;
  await page.route("**/api/user-books", (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    saved = route.request().postDataJSON();
    return route.fulfill({ status: 201, json: { userBook: {} } });
  });

  await page.goto("/house");
  await page.getByRole("button", { name: /^Calm/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Add to To Be Read" }).click();

  await expect(page.getByRole("status").filter({ hasText: "Added to To Be Read" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled();
  expect(saved).toEqual({ bookId: "work-walden", status: "want_to_read" });
});

test("Undo takes the recommended book off To Be Read again", async ({ page }) => {
  let removed = false;
  await page.route("**/api/user-books**", (route) => {
    const method = route.request().method();
    if (method === "POST") return route.fulfill({ status: 201, json: { userBook: {} } });
    // the shelf as it reads once the book is on it
    if (method === "GET") {
      return route.fulfill({ json: { books: [{ id: "work-walden", title: "Walden", authors: ["Henry David Thoreau"], status: "want_to_read", progress: 0 }] } });
    }
    if (method === "DELETE") {
      removed = true;
      return route.fulfill({ status: 204, body: "" });
    }
    return route.fallback();
  });
  await page.goto("/house");
  await page.getByRole("button", { name: /^Calm/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Add to To Be Read" }).click();
  await page.getByRole("button", { name: "Undo" }).click();

  await expect(page.getByRole("button", { name: "Add to To Be Read" })).toBeEnabled();
  expect(removed).toBe(true);
});

test("each mood has its own colour", async ({ page }) => {
  await page.goto("/house");
  const checkIn = page.getByRole("dialog", { name: "How are you feeling today?" });
  const fills = new Set();
  for (const mood of ["Calm", "Low", "Stressed", "Excited"]) {
    fills.add(await checkIn.getByRole("button", { name: new RegExp(`^${mood}`) }).evaluate((el) => getComputedStyle(el).backgroundColor));
  }
  expect(fills.size).toBe(4);
  await checkIn.getByRole("button", { name: /^Calm/ }).click();
  await expect(checkIn.getByRole("button", { name: "Continue" })).toHaveCSS("background-color", "rgb(59, 115, 48)");
});

test("coming Back from the recommended book's page lands on the same recommendation", async ({ page }) => {
  await page.goto("/house");
  await page.getByRole("button", { name: /^Calm/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  const result = page.getByRole("dialog", { name: "A book for your mood" });
  // a different book than the first one asked for: Back must not ask again
  await result.getByRole("button", { name: "Show another recommendation" }).click();
  await expect(result.getByRole("heading", { name: "The Wind in the Willows" })).toBeVisible();

  await result.getByRole("link", { name: "Open book page" }).click();
  await expect(page).toHaveURL(/\/books\/work-the-wind-in-the-willows$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/house$/);
  await expect(page.getByRole("dialog", { name: "A book for your mood" }).getByRole("heading", { name: "The Wind in the Willows" })).toBeVisible();
});

test("skipping keeps the check-in away for the day, and the room menu can reopen it", async ({ page }) => {
  await page.goto("/house");
  const checkIn = page.getByRole("dialog", { name: "How are you feeling today?" });

  await checkIn.getByRole("button", { name: "Skip for today" }).click();
  await expect(checkIn).toBeHidden();

  await page.reload();
  await expect(page.getByRole("button", { name: "Room menu" })).toBeVisible();
  await expect(checkIn).toBeHidden();

  await page.getByRole("button", { name: "Room menu" }).click();
  await page.getByRole("button", { name: "Mood check-in" }).click();
  await expect(checkIn).toBeVisible();
});

test("saving the mood quote keeps it in the salon's Saved quotes, where it can be removed", async ({ page }) => {
  await page.goto("/house");
  await page.getByRole("button", { name: /^Calm/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  const result = page.getByRole("dialog", { name: "A book for your mood" });
  await result.getByRole("button", { name: "Save quote" }).click();
  await expect(result.getByRole("button", { name: "Unsave" })).toBeVisible();
  // saving the quote leaves the book alone
  await expect(result.getByRole("button", { name: "Add to To Be Read" })).toBeEnabled();

  // tapping Unsave undoes it, and saving again works
  await result.getByRole("button", { name: "Unsave" }).click();
  await expect(result.getByRole("button", { name: "Save quote" })).toBeVisible();
  await result.getByRole("button", { name: "Save quote" }).click();
  await expect(result.getByRole("button", { name: "Unsave" })).toBeVisible();

  // another recommendation starts unsaved
  await result.getByRole("button", { name: "Show another recommendation" }).click();
  await expect(result.getByRole("heading", { name: "The Wind in the Willows" })).toBeVisible();
  await expect(result.getByRole("button", { name: "Save quote" })).toBeVisible();

  await page.goto("/house");
  await page.getByRole("button", { name: "Room menu" }).click();
  await page.getByRole("button", { name: "Mood check-in" }).click();
  await page.getByRole("button", { name: /^Calm/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  // a quote saved before comes up as Unsave
  await expect(result.getByRole("button", { name: "Unsave" })).toBeVisible();
  await result.getByRole("link", { name: "See saved quotes" }).click();

  await expect(page).toHaveURL(/\/salon\?tab=profile.*#saved-quotes$/);
  const saved = page.getByRole("list", { name: "Your saved quotes" });
  await expect(saved.getByText("“I went to the woods because I wished to live deliberately.”")).toBeVisible();
  await expect(saved.getByRole("link", { name: "Open book page" })).toHaveAttribute("href", "/books/work-walden");

  await expect(saved.getByRole("button", { name: "Remove quote from Walden" })).toHaveCSS("background-color", "rgb(168, 72, 58)");
  await saved.getByRole("button", { name: "Remove quote from Walden" }).click();
  await expect(page.getByText("No saved quotes yet")).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Profile" }).click();
  await expect(page.getByText("No saved quotes yet")).toBeVisible();
});
