// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test } from "@playwright/test";
import { hasSupabase, NEEDS_SUPABASE } from "./supabaseUser.js";

// The Log in and Register forms. These start signed out, so they use Playwright's own test, not
// the signed-in fixture. Getting past the email code is covered in onboarding.spec.js, which
// signs readers in directly (a test can't read the code from an inbox).

test.describe("log in and register", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("log in shows the form over the town, and Show password reveals it", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    const password = page.getByLabel("Password", { exact: true });
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(page.getByRole("button", { name: "Hide password" })).toBeVisible();
  });

  test("a short password is turned away", async ({ page }) => {
    await page.getByLabel("Email").fill("reader@readalot.test");
    await page.getByLabel("Password", { exact: true }).fill("abc");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("alert")).toHaveText("Use at least 6 characters.");
  });

  test("register checks the two passwords match", async ({ page }) => {
    await page.getByRole("link", { name: "Need a card? Register" }).click();
    await expect(page.getByRole("heading", { name: "Create your card" })).toBeVisible();
    await page.getByLabel("Email").fill("new@readalot.test");
    await page.getByLabel("Password", { exact: true }).fill("secret1");
    await page.getByLabel("Confirm password").fill("secret2");
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByRole("alert")).toHaveText("Those passwords do not match.");
  });

  test("a wrong password is turned away", async ({ page }) => {
    test.skip(!hasSupabase, NEEDS_SUPABASE);
    await page.getByLabel("Email").fill("nobody@readalot.test");
    await page.getByLabel("Password", { exact: true }).fill("not-the-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Check your email" })).toHaveCount(0);
  });
});
