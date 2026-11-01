import { expect, test } from "./fixtures.js";

test("discover books opens", async ({ page }) => {
  await page.goto("/discover");
  await expect(page.getByRole("search")).toBeVisible();
  await expect(page.getByRole("button", { name: "Places", exact: true })).toBeVisible();
});
