// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test } from "@playwright/test";

test("a visitor can reach sign in from the landing page", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Log in" }).first().click();

  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});
