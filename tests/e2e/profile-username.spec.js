// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test, townReady } from "./fixtures.js";

// Your badge, your username and the music button. The fixture's reader has the username
// e2e.<first 8 of their id>; resetProfile gives it back between tests.
const usernameOf = (reader) => `e2e.${reader.id.slice(0, 8)}`;

test("the badge shows your @username and opens the salon on the Profile tab", async ({ page, reader }) => {
  await page.goto("/");
  await townReady(page);
  const badge = page.getByRole("link", { name: /^Your profile: Reader/ });
  await expect(badge).toContainText(`@${usernameOf(reader)}`);

  await badge.click();
  await expect(page).toHaveURL(/\/salon\?tab=profile/);
  await expect(page.getByRole("tab", { name: "Profile" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText(`@${usernameOf(reader)}`)).toBeVisible();
});

test("the username is checked as it's typed, then saved", async ({ page, reader }) => {
  await page.goto("/salon?tab=profile");
  await page.getByRole("button", { name: "Edit profile" }).click();
  const field = page.getByLabel("Username");
  await expect(field).toHaveValue(usernameOf(reader));
  await expect(page.getByText("Friends find you by this.")).toBeVisible();

  await field.fill("ab");
  await expect(page.getByText("Use 3–20 lowercase letters, numbers, dots or underscores.")).toBeVisible();

  // a demo reader's
  await field.fill("sofia.shelves");
  await expect(page.getByText("Someone already has that username.")).toBeVisible();

  // typed with an @ and capitals: the box keeps it as it will be saved
  const fresh = `e2e.n${Date.now().toString(36)}`;
  await field.fill(`@${fresh.toUpperCase()}`);
  await expect(field).toHaveValue(fresh);
  await expect(page.getByText("Available")).toBeVisible();

  // the rest of the form asks for these, which the fixture's reader hasn't answered
  await page.getByRole("radio", { name: "Prefer not to say" }).first().click();
  await page.getByLabel("Age").fill("22");
  await page.getByRole("radiogroup", { name: "Religion" }).getByRole("radio", { name: "None" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(`@${fresh}`)).toBeVisible();
  await page.reload();
  await expect(page.getByText(`@${fresh}`)).toBeVisible();
});

test("the music button sits beside Daily and slides along as Daily widens", async ({ page }) => {
  await page.goto("/");
  await townReady(page);
  const daily = page.locator('[data-tour="town-daily"]');
  const music = page.getByRole("button", { name: "Turn music off" });
  const dailyBox = await daily.boundingBox();
  const before = await music.boundingBox();
  // to Daily's right, in the same row
  expect(before.x).toBeGreaterThan(dailyBox.x + dailyBox.width - 1);
  expect(Math.abs(before.y + before.height / 2 - (dailyBox.y + dailyBox.height / 2))).toBeLessThan(4);

  await daily.hover();
  await expect.poll(async () => (await music.boundingBox()).x).toBeGreaterThan(before.x + 40);

  // and it still turns the music off and on
  await music.click();
  await expect(page.getByRole("button", { name: "Turn music on" })).toBeVisible();
  await page.getByRole("button", { name: "Turn music on" }).click();

  // every other page: beside the Daily button that DailyDock places
  await page.goto("/library");
  const dockDaily = page.locator(".daily-dock .daily-button");
  const dockMusic = page.locator(".daily-dock .music-toggle");
  await expect(dockMusic).toBeVisible();
  const d = await dockDaily.boundingBox();
  const m = await dockMusic.boundingBox();
  expect(m.x).toBeGreaterThan(d.x + d.width - 1);
});
