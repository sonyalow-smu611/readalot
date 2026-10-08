import { expect, test } from "@playwright/test";

test("discover books opens", async ({ page }) => {
  await page.goto("/discover");
  await expect(page.getByRole("heading", { name: "Search Results" })).toBeVisible();
});
