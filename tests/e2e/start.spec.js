// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test } from "@playwright/test";
import { test as signedIn } from "./fixtures.js";

// The landing page: a first-time, signed-out visitor sees it once; after that they go to Log in.
// Each test gets a fresh browser, so localStorage starts empty (a first visit).

const SIGN = "IKDA";
const SLOGAN = "Social media, but for book lovers.";
const SECTIONS = [
  "Meet Maya",
  "Explore the town",
  "Now make yourself",
  "Read more. Level up. Make it yours.",
  "Start in under two minutes",
  "Questions before you move in",
  "Your next book is waiting.",
];

// how clear the part of the page holding this heading is right now (words fade as they scroll)
function clarity(heading) {
  return heading.evaluate((el) => Number(getComputedStyle(el.closest("[data-fade]")).opacity));
}

test("a first-time visitor lands on the start page and reads about the town", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.getByRole("heading", { name: SIGN, level: 1 })).toBeVisible();
  await expect(page.getByText(SLOGAN)).toBeVisible();
  await expect(page.locator("#start-home").getByText("읽다 · to read")).toBeVisible();
  for (const title of SECTIONS) {
    await expect(page.getByRole("heading", { name: title })).toBeAttached();
  }

  await page.getByRole("link", { name: "Sign up" }).first().click();
  await expect(page.getByRole("heading", { name: "Create your card" })).toBeVisible();

  // seen once: signed-out visitors now go to Log in, as before
  await page.goto("/library");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("scrolling fades the sign away and the next section in", async ({ page }) => {
  await page.goto("/start");
  const sign = page.getByRole("heading", { name: SIGN, level: 1 });
  const why = page.getByRole("heading", { name: SECTIONS[0] });
  await expect.poll(() => clarity(sign)).toBe(1);
  expect(await clarity(why)).toBeLessThan(0.5);

  await why.scrollIntoViewIfNeeded();
  await expect.poll(() => clarity(why)).toBeGreaterThan(0.9);
  await expect.poll(() => clarity(sign)).toBeLessThan(0.5);
});

test("the bar and See how it works take you to each section", async ({ page }) => {
  await page.goto("/start");
  const bar = page.getByRole("navigation", { name: "Landing page" });

  await bar.getByRole("button", { name: "The town" }).click();
  await expect(page.getByRole("heading", { name: "Explore the town" })).toBeInViewport();
  await expect(bar.getByRole("button", { name: "The town" })).toHaveAttribute("aria-current", "true");

  // the highlight moves to the picked link at once, before the page has scrolled there
  await bar.getByRole("button", { name: "FAQ" }).click();
  expect(await bar.getByRole("button", { name: "FAQ" }).getAttribute("aria-current")).toBe("true");
  await expect(page.getByRole("heading", { name: "Questions before you move in" })).toBeInViewport();

  await bar.getByRole("button", { name: "IKDA, back to the top" }).click();
  await page.getByRole("button", { name: "See how it works" }).click();
  await expect(page.getByRole("heading", { name: "Start in under two minutes" })).toBeInViewport();
});

test("each building in town shows what you do there", async ({ page }) => {
  await page.goto("/start");
  const places = page.getByRole("tablist", { name: "Places in town" });
  await places.scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "Your bookshelf" })).toBeVisible();

  await places.getByRole("tab", { name: "Cafe" }).click();
  await expect(places.getByRole("tab", { name: "Cafe" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Meet other readers" })).toBeVisible();

  // the arrow keys move along the street
  await page.keyboard.press("ArrowRight");
  await expect(places.getByRole("tab", { name: "Hair Salon" })).toBeFocused();
  await expect(page.getByRole("heading", { name: "Make it you" })).toBeVisible();
});

test("the character you make waits at your door", async ({ page }) => {
  await page.goto("/start");
  await page.getByRole("heading", { name: "Now make yourself" }).scrollIntoViewIfNeeded();
  await page.getByRole("textbox", { name: "Your name in town" }).fill("Sam");
  await page.getByRole("tab", { name: "Hair", exact: true }).click();
  await page.getByRole("button", { name: "Bun" }).click();
  await expect(page.getByRole("button", { name: "Bun" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("heading", { name: "Your next book is waiting." }).scrollIntoViewIfNeeded();
  await expect(page.locator("#start-join").getByText("Sam")).toBeVisible();
});

test("tapping what readers do adds up XP and levels up", async ({ page }) => {
  await page.goto("/start");
  const tries = page.getByRole("group", { name: "Earn XP" });
  await tries.scrollIntoViewIfNeeded();
  await expect(page.getByText("100 XP to level 2")).toBeVisible();

  await tries.getByRole("button", { name: "Add a book +10" }).click();
  await expect(page.getByText("90 XP to level 2")).toBeVisible();
  await tries.getByRole("button", { name: "Finish a book +100" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Level 2! +50 coins" })).toBeVisible();
  await expect(page.getByText("530 coins")).toBeVisible();

  await page.getByRole("button", { name: "Start over" }).click();
  await expect(page.getByText("0 XP", { exact: true })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: SIGN, level: 1 })).toHaveCount(0);
});
