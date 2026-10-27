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
  await expect(page.getByRole("link", { name: "Scan a book" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
});

// Your character walks to the door before the page opens, so going in takes a few seconds.
const WALK_IN = { timeout: 10_000 };

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
    await expect(page).toHaveURL(url, WALK_IN);
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

// Friends' houses sit in the town too; each one opens that reader's profile, with the way into
// their room.
test("a friend's house opens their profile", async ({ page }) => {
  const card = await openPlace(page, "Emma's house");
  await expect(card.getByText("Emma Tan", { exact: false })).toBeVisible();
  await card.getByRole("button", { name: "Visit Emma" }).click();
  await expect(page).toHaveURL(/\/people\/reader-emma$/, WALK_IN);
  await expect(page.getByRole("heading", { level: 1, name: "Emma Tan" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Visit Emma's room" })).toBeVisible();
});

// The camera can follow your character; dragging the map lets it go again.
test("the follow button keeps the camera on your character", async ({ page }) => {
  const follow = page.getByRole("button", { name: "Follow my character" });
  await expect(follow).toHaveAttribute("aria-pressed", "false");
  await follow.click();
  await expect(follow).toHaveAttribute("aria-pressed", "true");

  const box = await page.locator(".town canvas").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 60, { steps: 6 });
  await page.mouse.up();
  await expect(follow).toHaveAttribute("aria-pressed", "false");
});

// Going in, your character walks over to the door first.
test("your character walks to a building before going in", async ({ page }) => {
  const card = await openPlace(page, "Library");
  await card.getByRole("button", { name: "Enter the library" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Walking to Library…" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Follow my character" })).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/\/library$/, WALK_IN);
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
