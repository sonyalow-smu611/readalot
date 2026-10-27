// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test } from "@playwright/test";
import { test as signedIn } from "./fixtures.js";

// The landing page: a first-time, signed-out visitor sees it once; after that they go to Log in.
// Each test gets a fresh browser, so localStorage starts empty (a first visit).

test("a first-time visitor lands on the start page and tours the town", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.getByRole("heading", { name: "Move in. Read more. Meet readers." })).toBeVisible();
  for (const stop of ["Your house", "Library", "Cafe", "Hair Salon", "Scan a book"]) {
    await expect(page.getByRole("heading", { name: stop })).toBeVisible();
  }

  await page.getByRole("link", { name: "Sign up" }).click();
  await expect(page.getByRole("heading", { name: "Create your card" })).toBeVisible();

  // seen once: signed-out visitors now go to Log in, as before
  await page.goto("/library");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("Log in on the start page opens Log in and counts as seen", async ({ page }) => {
  await page.goto("/start");
  await page.getByRole("link", { name: "Log in" }).click();
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
  await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

signedIn("a signed-in reader never sees the start page", async ({ page }) => {
  await page.goto("/start");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Move in. Read more. Meet readers." })).toHaveCount(0);
});
