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

// Friends' houses sit in the town too; each one opens that reader's room.
test("a friend's house opens their room", async ({ page }) => {
  const card = await openPlace(page, "Emma's house");
  await expect(card.getByText("Emma Tan", { exact: false })).toBeVisible();
  await card.getByRole("button", { name: "Visit Emma" }).click();
  await expect(page).toHaveURL(/\/people\/reader-emma$/);
  await expect(page.getByRole("heading", { level: 1, name: "Emma Tan's Room" })).toBeVisible();
});

test("every friend's house is in the Places list", async ({ page }) => {
  await page.getByRole("button", { name: "Places" }).click();
  const places = page.getByRole("navigation", { name: "Places in town" });
  for (const name of ["Emma's house", "Ayaan's house", "Sofia's house", "Noah's house"]) {
    await expect(places.getByRole("button", { name: new RegExp(`^${name}`) })).toBeVisible();
  }
});

// The sky follows the live weather; the weather chip steps through a preview of each look.
test("the weather chip previews day, night and rain", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const chip = page.getByRole("button", { name: /^Weather:/ });
  await expect(chip).toContainText("Live weather");
  for (const look of ["Day", "Night", "Rain", "Rainy night"]) {
    await chip.click();
    await expect(chip).toContainText("Preview");
    await expect(chip).toContainText(look);
  }
  await chip.click();
  await expect(chip).toContainText("Live weather");
  expect(errors).toEqual([]);
});
