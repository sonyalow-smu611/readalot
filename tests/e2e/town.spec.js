import { expect, test } from "./fixtures.js";

// The town is home. The map is a canvas, so these checks go through the Places list, the
// same labelled buttons a keyboard or screen reader user would use.
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Loading the town…")).toBeHidden();
});

async function openPlace(page, name) {
  await page.getByRole("button", { name: "Places" }).click();
  await page.getByRole("navigation", { name: "Places in town" }).getByRole("button", { name: new RegExp(`^${name}`) }).click();
  return page.getByRole("dialog", { name });
}

test("the town draws the map, with no bottom tab bar", async ({ page }) => {
  await expect(page.locator(".town canvas")).toBeVisible();
  await expect(page.getByRole("link", { name: "Your profile" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Scan a book" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
});

// Every building opens its owner's page inside the shared shell, and Back to town returns.
for (const [place, button, url, owner] of [
  ["Your house", "Go inside", /\/house$/, "Sonz"],
  ["Library", "Enter the library", /\/library$/, "Aasim"],
  ["Cafe", "Enter the cafe", /\/cafe$/, "Emiley"],
  ["Hair Salon", "Enter the salon", /\/salon$/, "Aalric"],
]) {
  test(`${place} opens its page and leads back to town`, async ({ page }) => {
    const card = await openPlace(page, place);
    await card.getByRole("button", { name: button }).click();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole("heading", { level: 1, name: place })).toBeVisible();
    await expect(page.getByText(owner, { exact: false }).first()).toBeVisible();

    await page.getByRole("link", { name: "Back to town" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
}

test("the library shows the existing Discover page", async ({ page }) => {
  await page.goto("/library");
  await expect(page.getByRole("search")).toBeVisible();
});

test("old addresses open the buildings", async ({ page }) => {
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/salon$/);
  await page.goto("/people");
  await expect(page).toHaveURL(/\/cafe$/);
});

test("a place card closes with its close button", async ({ page }) => {
  const card = await openPlace(page, "Cafe");
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Close" }).click();
  await expect(card).toBeHidden();
});
