// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test } from "./fixtures.js";

// The Hair Salon: the reader in the barber chair, the style studio, and the profile.
// The fixture signs in a reader whose favourite genre is Fantasy; what the salon saves goes to
// Supabase, so a reload shows it.
test.beforeEach(async ({ page }) => {
  await page.goto("/salon");
});

// the one big character in the barber chair, wearing the look being styled
const you = (page) => page.getByRole("img", { name: /^You: / });
const group = (page, name) => page.getByRole("group", { name, exact: true });

test("the salon shows the reader in the chair and the style studio", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Hair Salon" })).toBeVisible();
  await expect(you(page)).toHaveCount(1);
  await expect(you(page)).toHaveAttribute("aria-label", /Pink long hair/);
  await expect(page.getByRole("tab", { name: "Style studio" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Looks" })).toBeVisible();
  // nothing to save until something changes
  await expect(page.getByRole("button", { name: "Save look" })).toHaveCount(0);

  await page.getByRole("tab", { name: "Profile" }).click();
  await expect(page.getByRole("heading", { name: "Favourite genres" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "About you" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Fantasy" })).toBeVisible();
});

test("a new look shows on the reader straight away, is saved, and is still there after a reload", async ({ page }) => {
  await group(page, "Hair style").getByRole("radio", { name: "Bun" }).check();
  await group(page, "Hair colour").getByRole("radio", { name: "Chestnut" }).check();
  await expect(you(page)).toHaveAttribute("aria-label", /Chestnut bun hair/);
  await expect(page.getByText("New look ready")).toBeVisible();
  await page.getByRole("button", { name: "Save look" }).click();

  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save look" })).toHaveCount(0);

  await page.reload();
  await expect(you(page)).toHaveAttribute("aria-label", /Chestnut bun hair/);
  await expect(group(page, "Hair style").getByRole("radio", { name: "Bun" })).toBeChecked();
  await expect(group(page, "Hair colour").getByRole("radio", { name: "Chestnut" })).toBeChecked();
});

test("Reset puts back the saved look", async ({ page }) => {
  await group(page, "Hair style").getByRole("radio", { name: "Curly" }).check();
  await expect(you(page)).toHaveAttribute("aria-label", /curly hair/);
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(you(page)).toHaveAttribute("aria-label", /Pink long hair/);
  await expect(group(page, "Hair style").getByRole("radio", { name: "Long" })).toBeChecked();
});

test("presets, Surprise me, and parts that cost coins are locked", async ({ page }) => {
  await group(page, "Start from preset").getByRole("radio", { name: "Nova" }).check();
  await expect(you(page)).toHaveAttribute("aria-label", /^You: Ginger puff hair/);

  await page.getByRole("button", { name: "Surprise me" }).click();
  await expect(page.getByRole("button", { name: "Save look" })).toBeVisible();

  // the surprise keeps Nova as its base, so start again from someone else
  await group(page, "Start from preset").getByRole("radio", { name: "Rosie" }).check();
  await expect(you(page)).toHaveAttribute("aria-label", /^You: Pink long hair/);
  await page.getByRole("tab", { name: "Extras" }).click();
  const crown = page.getByRole("radio", { name: "Crown" });
  await expect(crown).toBeDisabled();
  await expect(crown).toHaveAccessibleDescription(/Coming soon/);
  // a flower needs curly hair; Rosie's is long
  await expect(page.getByRole("radio", { name: "Red flower" })).toBeDisabled();
  await expect(page.getByRole("radio", { name: "Red flower" })).toHaveAccessibleDescription("Only with curly hair");
});

test("leaving with an unsaved look asks first: stay, discard, or save and leave", async ({ page }) => {
  await group(page, "Hair colour").getByRole("radio", { name: "Black" }).check();
  await page.getByRole("link", { name: "Back to town" }).click();

  const dialog = page.getByRole("dialog", { name: "Save your new look?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Stay" }).click();
  await expect(page).toHaveURL(/\/salon$/);
  await expect(group(page, "Hair colour").getByRole("radio", { name: "Black" })).toBeChecked();

  await page.getByRole("link", { name: "Back to town" }).click();
  await dialog.getByRole("button", { name: "Discard and leave" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("Save look and leave keeps the new look", async ({ page }) => {
  await group(page, "Hair colour").getByRole("radio", { name: "Black" }).check();
  await page.getByRole("link", { name: "Back to town" }).click();
  await page.getByRole("dialog", { name: "Save your new look?" }).getByRole("button", { name: "Save look and leave" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/salon");
  await expect(group(page, "Hair colour").getByRole("radio", { name: "Black" })).toBeChecked();
  await expect(you(page)).toHaveAttribute("aria-label", /Black/);
});

test("Back to town with nothing changed goes straight back", async ({ page }) => {
  await page.getByRole("link", { name: "Back to town" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("the profile's cards still work in the salon", async ({ page }) => {
  await page.getByRole("tab", { name: "Profile" }).click();

  // About you: edit one card in place
  await page.getByRole("button", { name: "Edit location" }).click();
  await page.getByLabel("Location").fill("Tampines");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Tampines")).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit location" })).toBeFocused();

  // Edit profile: the full form
  await page.getByRole("button", { name: "Edit profile" }).click();
  await page.getByLabel("Name").fill("Robin");
  await page.getByRole("radio", { name: "Prefer not to say" }).first().click();
  await page.getByLabel("Age").fill("22");
  await page.getByRole("radiogroup", { name: "Religion" }).getByRole("radio", { name: "None" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "Robin" })).toBeVisible();

  // Privacy switch: going public asks the browser for the location
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation({ latitude: 1.2966, longitude: 103.8502 });
  const map = page.getByRole("switch", { name: "Public profile and location" });
  await expect(map).toHaveAttribute("aria-checked", "false");
  await map.click();
  await expect(map).toHaveAttribute("aria-checked", "true");

  // A shelf's book list opens and closes
  await page.getByRole("button", { name: /To read/ }).click();
  const list = page.getByRole("dialog", { name: /To read/ });
  await expect(list).toBeVisible();
  await list.getByRole("button", { name: "Close" }).click();
  await expect(list).toBeHidden();

  // Log out asks first
  await page.getByRole("button", { name: "Log out" }).click();
  const leave = page.getByRole("dialog", { name: "Close this book?" });
  await expect(leave.getByRole("button", { name: "Stay" })).toBeFocused();
  await leave.getByRole("button", { name: "Stay" }).click();
  await expect(leave).toBeHidden();
});

test("on a laptop the salon fills the window: the chair on the left, the widgets on the right", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const youBox = await you(page).boundingBox();
  const dockBox = await page.getByRole("tablist", { name: "Salon" }).boundingBox();
  expect(youBox.x + youBox.width / 2).toBeLessThan(640);
  expect(dockBox.x).toBeGreaterThan(640);
  expect(dockBox.x + dockBox.width).toBeGreaterThan(1100);
});

test("the reader stands by the chair as their town sprite, and shows in the mirror", async ({ page }) => {
  // one sprite you can hear, plus its reflection, which screen readers skip
  await expect(you(page)).toHaveCount(1);
  await expect(page.locator(".stage__glass canvas")).toHaveCount(1);
  // a change makes the reader hop
  await group(page, "Hair colour").getByRole("radio", { name: "Black" }).check();
  await expect(page.locator(".stage__model .pixel-character")).toHaveClass(/is-hopping/);
});
