// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test } from "@playwright/test";
import { test as signedIn } from "./fixtures.js";

// The landing page: a first-time, signed-out visitor sees it once; after that they go to Log in.
// Each test gets a fresh browser, so localStorage starts empty (a first visit).

const TAGLINE = "Keep track of every book you read.";

// how clear the screen holding this heading is right now (the page fades screens as they scroll)
function clarity(heading) {
  return heading.evaluate((el) => Number(getComputedStyle(el.closest("[data-fade]")).opacity));
}

test("a first-time visitor lands on the start page and tours the town", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.getByRole("heading", { name: TAGLINE })).toBeVisible();
  for (const stop of ["Your bookshelf", "The Library", "The Cafe", "The Salon", "Scan a book"]) {
    await expect(page.getByRole("heading", { name: stop })).toBeAttached();
  }

  await page.getByRole("link", { name: "Sign up" }).first().click();
  await expect(page.getByRole("heading", { name: "Create your card" })).toBeVisible();

  // seen once: signed-out visitors now go to Log in, as before
  await page.goto("/library");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("scrolling fades the tagline away and the next stop in", async ({ page }) => {
  await page.goto("/start");
  const tagline = page.getByRole("heading", { name: TAGLINE });
  const house = page.getByRole("heading", { name: "Your bookshelf" });
  await expect.poll(() => clarity(tagline)).toBe(1);
  expect(await clarity(house)).toBeLessThan(0.2);

  await house.scrollIntoViewIfNeeded();
  await expect.poll(() => clarity(house)).toBeGreaterThan(0.9);
  await expect.poll(() => clarity(tagline)).toBeLessThan(0.2);
});

test("the bar and the town cards take you to each stop", async ({ page }) => {
  await page.goto("/start");
  const bar = page.getByRole("navigation", { name: "Landing page" });

  await bar.getByRole("button", { name: "Readers" }).click();
  await expect(page.getByRole("heading", { name: "Cafe" })).toBeInViewport();
  await expect(bar.getByRole("button", { name: "Readers" })).toHaveAttribute("aria-current", "true");

  await page.getByRole("heading", { name: "Everything your reading life needs." }).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /^Character: / }).click();
  await expect(page.getByRole("heading", { name: "The Salon" })).toBeInViewport();
});

test("tapping the scanner scene finds the book", async ({ page }) => {
  await page.goto("/start");
  const scan = page.getByRole("region", { name: "Scan a book" });
  await scan.scrollIntoViewIfNeeded();
  await expect(scan.getByText("Found it!")).not.toBeVisible();
  // the scene is a picture (hidden from screen readers), so it is found by its part
  await scan.locator(".art__book").click();
  await expect(scan.getByText("Found it!")).toBeVisible();
});

test("the last screen signs up too", async ({ page }) => {
  await page.goto("/start");
  await page.getByRole("heading", { name: "Your next book is waiting." }).scrollIntoViewIfNeeded();
  await page.getByRole("link", { name: "Sign up" }).last().click();
  await expect(page.getByRole("heading", { name: "Create your card" })).toBeVisible();
});

test("Log in on the start page opens Log in and counts as seen", async ({ page }) => {
  await page.goto("/start");
  await page.getByRole("link", { name: "Log in" }).first().click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("a visitor who leaves without choosing sees it again", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/start$/);
  await page.goto("/cafe");
  await expect(page).toHaveURL(/\/start$/);
});

test("the start page fits a phone without sideways scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto("/start");
  await expect(page.getByRole("link", { name: "Sign up" }).first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

signedIn("a signed-in reader never sees the start page", async ({ page }) => {
  await page.goto("/start");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: TAGLINE })).toHaveCount(0);
});
