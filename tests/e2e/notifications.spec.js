// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test } from "./fixtures.js";
import { EMMA, NOAH, friend, mockFriends, skipDailyPanel } from "./townFriends.js";

// The town's bell: friend requests, visits to your room and friends coming online pop up once and
// stay in the list.
const REQUEST = { requestId: "request-1", reader: friend("sofia.stories", "Sofia Rossi", null) };
const VISIT = { id: "1", at: new Date().toISOString(), visitor: { id: "emma.reads", displayName: "Emma Tan" } };
const SECRET_VISIT = { id: "2", at: new Date().toISOString(), visitor: null };

const bell = (page) => page.getByRole("button", { name: /^Notifications,/ });
const panel = (page) => page.getByRole("region", { name: "Notifications" });
const popUp = (page) => page.locator(".app-toast");

test.beforeEach(async ({ page, reader }) => {
  await skipDailyPanel(page, reader.id);
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
  await page.reload();
  await expect(page.getByText("Loading the town…")).toBeHidden();
  await expect(bell(page)).toHaveAccessibleName("Notifications, 0 new");
  await bell(page).click();
  await expect(panel(page)).toContainText("Emma Tan visited your room");
  await panel(page).getByRole("button", { name: "Clear all" }).click();
  await expect(panel(page)).toContainText("Nothing yet");
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
  await page.goto("/");
  await expect(page.getByText("Loading the town…")).toBeHidden();
  // Emma was already here when you arrived: no news
  await expect(bell(page)).toHaveAccessibleName("Notifications, 0 new");

  town.friends = [EMMA, { ...NOAH, lastSeenAt: new Date().toISOString() }];
  await expect(popUp(page)).toContainText("Noah Lim is online", { timeout: 35_000 });
  await expect(bell(page)).toHaveAccessibleName("Notifications, 1 new");

  // the town's next refresh brings nothing new
  await page.waitForTimeout(31_000);
  await expect(bell(page)).toHaveAccessibleName("Notifications, 1 new");
});

test("the bell's list is empty for a new reader", async ({ page }) => {
  await mockFriends(page);
  await page.goto("/");
  await bell(page).click();
  await expect(panel(page)).toContainText("Nothing yet");
});
