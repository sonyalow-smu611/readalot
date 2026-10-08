import { expect, test } from "@playwright/test";

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

// Recommendations are random and the quotes come from an outside API, so both are answered here.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/recommendations*", (route) => {
    const asked = new URL(route.request().url()).searchParams;
    route.fulfill({ json: asked.get("exclude") === "work-walden" ? WILLOWS : WALDEN });
  });
});

test("first visit asks for a mood, then recommends a book with a quote from it", async ({ page }) => {
  await page.goto("/");

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

  await page.goto("/");
  await page.getByRole("button", { name: /^Calm/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Add to To Be Read" }).click();

  await expect(page.getByRole("button", { name: "Added to To Be Read" })).toBeDisabled();
  expect(saved).toEqual({ bookId: "work-walden", status: "want_to_read" });
});

test("skipping keeps the check-in away for the day, and the room menu can reopen it", async ({ page }) => {
  await page.goto("/");
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
