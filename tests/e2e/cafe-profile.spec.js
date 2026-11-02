// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test } from "./fixtures.js";

// Walking up to a reader in the Cafe opens their profile as a popup, and you stay in the Cafe.
async function openPopup(page) {
  await page.goto("/cafe");
  // by keyboard: on a phone a reader can be off screen until you drag the cafe over to them
  await page.getByRole("button", { name: /^Walk to / }).first().press("Enter");
  const popup = page.getByRole("dialog", { name: /^Meet / });
  await expect(popup).toBeVisible({ timeout: 15000 });
  return popup;
}

test("a reader's profile opens over the Cafe and closes back to it", async ({ page }) => {
  const popup = await openPopup(page);
  await expect(popup.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(popup.getByRole("link", { name: /^Visit .+'s room$/ })).toBeVisible();
  await expect(popup.getByRole("button", { name: "Add friend" })).toBeVisible();
  await expect(popup.getByRole("button", { name: "Message" })).toBeVisible();
  await expect(popup.getByRole("heading", { name: "Currently Reading" })).toBeAttached();
  await expect(popup.getByRole("heading", { name: "Books You Both Have" })).toBeAttached();
  await expect(popup.getByRole("button", { name: /'s profile/ })).toHaveCount(0);
  await expect(page).toHaveURL(/\/cafe$/);

  await popup.getByRole("button", { name: "Close reader profile" }).click();
  await expect(popup).toBeHidden();
  await expect(page).toHaveURL(/\/cafe$/);
});

test("Message opens the chat from the popup", async ({ page }) => {
  const popup = await openPopup(page);
  await popup.getByRole("button", { name: "Message" }).click();
  await expect(page.getByRole("dialog", { name: /^Message / })).toBeVisible();
});

test.describe("on a laptop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the popup sits in the middle at about 60% of the page's width", async ({ page }) => {
    const popup = await openPopup(page);
    await expect(popup.getByRole("heading", { level: 1 })).toBeVisible();
    await expect.poll(async () => (await popup.boundingBox()).width).toBe(660);
    const box = await popup.boundingBox();
    expect(Math.abs(box.x + box.width / 2 - 720)).toBeLessThanOrEqual(2);
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 700 } });

  test("the popup fits, and scrolls down to the last card", async ({ page }) => {
    const popup = await openPopup(page);
    const last = popup.getByRole("heading", { name: "Books You Both Have" });
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport();
    // it stays clear of the Daily button at the top of the page
    const daily = await page.getByRole("button", { name: /^Daily tasks/ }).boundingBox();
    expect((await popup.boundingBox()).y).toBeGreaterThanOrEqual(daily.y + daily.height);
    const sideways = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sideways).toBe(0);
  });
});
