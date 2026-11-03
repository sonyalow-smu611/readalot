// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, nextPaint, test, townReady } from "./fixtures.js";
import { signInPage } from "./supabaseUser.js";
import { EMMA, NOAH, friend, mockFriends, skipDailyPanel } from "./townFriends.js";

// The town's bell: friend requests, visits to your room and friends coming online pop up once and
// stay in the list.
const REQUEST = { requestId: "request-1", reader: friend("sofia.stories", "Sofia Rossi", null), at: new Date().toISOString() };
const VISIT = { id: "1", at: new Date().toISOString(), visitor: { id: "emma.reads", displayName: "Emma Tan" } };
const SECRET_VISIT = { id: "2", at: new Date().toISOString(), visitor: null };

const bell = (page) => page.getByRole("button", { name: /^Notifications,/ });
const panel = (page) => page.getByRole("region", { name: "Notifications" });
const popUp = (page) => page.locator(".app-toast");

// Opens the town and waits for its first look at the notifications: until then the bell says 0 new
// whatever is waiting.
async function openTownLooked(page, open = () => page.goto("/")) {
  const looked = page.waitForResponse("**/api/notifications/visits*");
  await open();
  await looked;
  await townReady(page);
  await nextPaint(page);
}

test.beforeEach(async ({ page, reader }) => {
  await skipDailyPanel(reader.id);
});

test("a friend request and a room visit pop up and stay in the bell", async ({ page }) => {
  await mockFriends(page, { friends: [EMMA], incoming: [REQUEST], visits: [VISIT, SECRET_VISIT] });
  await page.goto("/");
  await expect(popUp(page)).toContainText("3 new notifications");
  await expect(bell(page)).toHaveAccessibleName("Notifications, 3 new");

  await popUp(page).getByRole("button", { name: "View" }).click();
  await expect(panel(page)).toContainText("Sofia Rossi sent you a friend request");
  await expect(panel(page)).toContainText("Emma Tan visited your room");
  // someone private isn't named, and has no page to go to
  await expect(panel(page).getByRole("button", { name: /Someone visited your room/ })).toBeDisabled();

  await panel(page).getByRole("button", { name: /Sofia Rossi/ }).click();
  await expect(page.getByRole("navigation", { name: "Friends in town" }).getByRole("button", { name: "Accept Sofia Rossi" })).toBeVisible();
  await expect(bell(page)).toHaveAccessibleName("Notifications, 0 new");

  // a reload doesn't show them again
  await openTownLooked(page, () => page.reload());
  await expect(bell(page)).toHaveAccessibleName("Notifications, 0 new");
  await bell(page).click();
  await expect(panel(page)).toContainText("Emma Tan visited your room");
  await panel(page).getByRole("button", { name: "Clear all" }).click();
  await expect(panel(page)).toContainText("Nothing yet");
});

// What's read and what's cleared is saved with your profile, so another device agrees.
test("read and cleared stay that way on another device", async ({ page, browser, reader }, testInfo) => {
  await mockFriends(page, { friends: [EMMA], visits: [VISIT] });
  await page.goto("/");
  await townReady(page);
  await expect(bell(page)).toHaveAccessibleName("Notifications, 1 new");
  await bell(page).click();
  await expect(panel(page)).toContainText("Emma Tan visited your room");
  await bell(page).click();
  await expect(bell(page)).toHaveAccessibleName("Notifications, 0 new");

  // the same reader on a second device: a fresh browser, with nothing saved from the first
  const device = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
  try {
    const other = await device.newPage();
    await signInPage(other, reader.session);
    await skipDailyPanel(reader.id);
    await mockFriends(other, { friends: [EMMA], visits: [VISIT] });
    await openTownLooked(other);
    await expect(bell(other)).toHaveAccessibleName("Notifications, 0 new");
    await bell(other).click();
    await expect(panel(other)).toContainText("Emma Tan visited your room");
    await panel(other).getByRole("button", { name: "Clear all" }).click();
    await expect(panel(other)).toContainText("Nothing yet");
  } finally {
    await device.close();
  }

  await openTownLooked(page, () => page.reload());
  await bell(page).click();
  await expect(panel(page)).toContainText("Nothing yet");
});

test("on a laptop the unread count sits on the bell", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await mockFriends(page, { friends: [EMMA], visits: [VISIT] });
  await page.goto("/");
  await expect(bell(page)).toHaveAccessibleName("Notifications, 1 new");

  const button = await bell(page).boundingBox();
  const badge = await bell(page).locator(".notifications-button__badge").boundingBox();
  expect(badge.x).toBeGreaterThan(button.x);
  expect(badge.x).toBeLessThan(button.x + button.width);
});

test("a visitor's notification opens their profile", async ({ page }) => {
  await mockFriends(page, { friends: [EMMA], visits: [VISIT] });
  await page.goto("/");
  await bell(page).click();
  await panel(page).getByRole("button", { name: /Emma Tan visited/ }).click();
  await expect(page).toHaveURL(/\/people\/emma\.reads$/);
});

test("a friend coming online pops up, once", async ({ page }) => {
  test.setTimeout(100_000);
  const town = await mockFriends(page, { friends: [EMMA, NOAH] });
  // the town's first look: whoever is online before it was already here
  const firstLook = page.waitForResponse("**/api/notifications/visits*");
  await page.goto("/");
  await firstLook;
  await townReady(page);
  // Emma was already here when you arrived: no news
  await expect(bell(page)).toHaveAccessibleName("Notifications, 0 new");

  town.friends = [EMMA, { ...NOAH, lastSeenAt: new Date().toISOString() }];
  await expect(popUp(page)).toContainText("Noah Lim is online", { timeout: 35_000 });
  await expect(bell(page)).toHaveAccessibleName("Notifications, 1 new");

  // the town's next refresh brings nothing new
  await page.waitForTimeout(31_000);
  await expect(bell(page)).toHaveAccessibleName("Notifications, 1 new");
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 700 } });

  test("the bell can be tapped, with nothing over it", async ({ page }) => {
    await mockFriends(page);
    await page.goto("/");
    await townReady(page);
    await bell(page).click({ timeout: 5000 });
    await expect(panel(page)).toBeVisible();
    await bell(page).click({ timeout: 5000 });
    await expect(panel(page)).toBeHidden();
  });
});
