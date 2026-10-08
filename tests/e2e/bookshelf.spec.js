import { expect, test } from "@playwright/test";

// What happens to a book from the full bookshelf, shelf by shelf. Saves are answered here, so
// the shared demo shelf stays as it was for the other tests; `saves` records what was sent.
let saves;

test.beforeEach(async ({ page }) => {
  saves = [];
  await page.addInitScript(() => {
    // today's mood check-in already answered, so it does not open over the room
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    localStorage.setItem("readalot.moodCheckIn", `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  });
  await page.route("**/api/user-books/*", (route) => {
    saves.push({ id: route.request().url().split("/").pop(), ...route.request().postDataJSON() });
    return route.fulfill({ json: { userBook: {} } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: /Open bookshelf/ }).click();
  await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
});

test("a To read book can be started, which moves it to Reading", async ({ page }) => {
  await page.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" }).click();
  await page.getByRole("button", { name: "Started reading" }).click();

  await expect.poll(() => saves).toEqual([{ id: "demo-shelf-2", status: "reading" }]);
  // it is a Reading book now: progress and Finished take the place of Started reading
  await expect(page.getByRole("slider")).toHaveValue("0");
  await expect(page.getByRole("button", { name: "Finished" })).toBeVisible();

  await page.getByRole("button", { name: "Close book" }).click();
  const reading = page.locator('.room__bay[data-zone="reading"]');
  await expect(reading.getByRole("button", { name: "The Hobbit by J.R.R. Tolkien" })).toBeVisible();
});

test("a Reading book has a progress slider and can be finished", async ({ page }) => {
  await page.getByRole("button", { name: "Norwegian Wood by Haruki Murakami" }).click();

  const slider = page.getByRole("slider");
  await expect(slider).toHaveValue("42");
  await slider.fill("80");
  await expect(page.getByText("80% read")).toBeVisible();
  await expect.poll(() => saves).toEqual([{ id: "demo-shelf-1", progress: 80 }]);

  await page.getByRole("button", { name: "Finished" }).click();
  await expect.poll(() => saves.at(-1)).toEqual({ id: "demo-shelf-1", status: "read", progress: 100 });

  // a Finished book that has not been reviewed or rated offers both, on the book's page
  await expect(page.getByRole("link", { name: "Review" })).toHaveAttribute("href", "/books/demo-shelf-1");
  await expect(page.getByRole("link", { name: "Rate" })).toHaveAttribute("href", "/books/demo-shelf-1");
});

test("a Finished book's cover leads to its page to review and rate", async ({ page }) => {
  await page.getByRole("button", { name: "Covers" }).click();
  await page.getByRole("button", { name: /Pride and Prejudice/ }).click();

  await expect(page.getByRole("link", { name: "Rate" })).toBeVisible();
  await page.getByRole("link", { name: "Review" }).click();

  await expect(page).toHaveURL(/\/books\/demo-shelf-7$/);
  await expect(page.getByRole("button", { name: "Close book" })).toBeHidden();
});

test("a Finished book already reviewed and rated offers to view them", async ({ page }) => {
  await page.route("**/api/user-books", async (route) => {
    const response = await route.fetch();
    const { books } = await response.json();
    const reviewed = books.map((book) =>
      book.id === "demo-shelf-7" ? { ...book, reviewed: true, myRating: 5 } : book
    );
    return route.fulfill({ response, json: { books: reviewed } });
  });
  await page.reload();
  await page.getByRole("button", { name: /Open bookshelf/ }).click();

  await page.getByRole("button", { name: "Pride and Prejudice by Jane Austen" }).click();

  await expect(page.getByRole("link", { name: "View review and rating" })).toHaveAttribute(
    "href",
    "/books/demo-shelf-7"
  );
  await expect(page.getByRole("link", { name: "Review", exact: true })).toHaveCount(0);
});

test("the bookshelf scrolls on a short screen, and the arrow goes back to the room", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 600 });
  const shelves = page.locator(".room__scroll");

  expect(await shelves.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await shelves.hover();
  await page.mouse.wheel(0, 400);
  await expect.poll(() => shelves.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "Gone Girl by Gillian Flynn" })).toBeInViewport();

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("button", { name: "Back" })).toBeHidden();
  await expect(page.getByRole("button", { name: /Open bookshelf/ })).toBeVisible();
});
