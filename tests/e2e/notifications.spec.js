// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, goToPlace, nextPaint, skipMoodCheckIn, test, townReady } from "./fixtures.js";
import { signInPage } from "./supabaseUser.js";
import { EMMA, NOAH, friend, mockFriends, skipDailyPanel } from "./townFriends.js";

// The town's bell: friend requests (waiting, sent, accepted), messages, visits to your room and
// friends coming online. Nothing pops up by itself: the bell turns red, and the list opens from it.
const REQUEST = { requestId: "request-1", reader: friend("sofia.stories", "Sofia Rossi", null), at: new Date().toISOString() };
const VISIT = { id: "1", at: new Date().toISOString(), visitor: { id: "emma.reads", displayName: "Emma Tan" } };
const SECRET_VISIT = { id: "2", at: new Date().toISOString(), visitor: null };

const ACCEPTED = { id: "a1", at: new Date().toISOString(), reader: { id: "emma.reads", displayName: "Emma Tan" } };
const SENT = { id: "s1", at: new Date().toISOString(), reader: { id: "sofia.stories", displayName: "Sofia Rossi" } };
const MESSAGE = { id: "m1", at: new Date().toISOString(), direction: "received", reader: { id: "emma.reads", displayName: "Emma Tan" } };
// a message you sent yourself: never a notification
const MESSAGE_SENT = { id: "m2", at: new Date().toISOString(), direction: "sent", reader: { id: "emma.reads", displayName: "Emma Tan" } };

const bell = (page) => page.getByRole("button", { name: /^Notifications,/ });
const panel = (page) => page.getByRole("region", { name: "Notifications" });
const popUp = (page) => page.locator(".app-toast");
const slide = (page) => page.locator(".notification-slide");
const friendsList = (page) => page.getByRole("navigation", { name: "Friends in town" });

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

test("a friend request and a room visit turn the bell red and slide in, then fade away", async ({ page }) => {
  await mockFriends(page, { friends: [EMMA], incoming: [REQUEST], visits: [VISIT, SECRET_VISIT] });
  await page.goto("/");
  await expect(bell(page)).toHaveAccessibleName("Notifications, 3 new");
  await expect(bell(page).locator(".notifications-button__badge")).toBeVisible();
  // the newest slides in, says how many came with it, and fades away by itself
  await expect(slide(page)).toBeVisible();
  await expect(slide(page)).toContainText("+2 more");
  await expect(slide(page)).toBeHidden({ timeout: 10_000 });
  await expect(popUp(page)).toHaveCount(0);
  // fading doesn't read it: the bell is still red
  await expect(bell(page)).toHaveAccessibleName("Notifications, 3 new");

  await bell(page).click();
  await expect(panel(page)).toContainText("Sofia Rossi sent you a friend request");
  await expect(panel(page)).toContainText("Emma Tan visited your room");
  // someone private isn't named, and has no page to go to
  await expect(panel(page).getByRole("button", { name: /Someone visited your room/ })).toBeDisabled();

  await panel(page).getByRole("button", { name: /Sofia Rossi/ }).click();
  await expect(friendsList(page).getByRole("button", { name: "Accept Sofia Rossi" })).toBeVisible();
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
test("tapping the sliding notification goes to it", async ({ page }) => {
  await mockFriends(page, { friends: [EMMA], visits: [VISIT] });
  await page.goto("/");
  await slide(page).click();
  await expect(page).toHaveURL(/\/people\/emma\.reads$/);
});

test("something you did yourself (a request you sent) doesn't slide in", async ({ page }) => {
  await mockFriends(page, { friends: [EMMA], activity: { sent: [SENT] } });
  await page.goto("/");
  await townReady(page);
  await expect(bell(page)).toHaveAccessibleName("Notifications, 1 new");
  await expect(slide(page)).toHaveCount(0);
});

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

test("a friend coming online turns the bell red, once", async ({ page }) => {
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
  await expect(bell(page)).toHaveAccessibleName("Notifications, 1 new", { timeout: 35_000 });
  await expect(popUp(page)).toHaveCount(0);
  await bell(page).click();
  await expect(panel(page)).toContainText("Noah Lim is online");
  await bell(page).click();

  // looking at it made it read, and the town's next refresh brings nothing new
  await expect(bell(page)).toHaveAccessibleName("Notifications, 0 new");
  await page.waitForTimeout(21_000);
  await expect(bell(page)).toHaveAccessibleName("Notifications, 0 new");
});

test("requests sent, requests accepted and messages are in the bell, and each goes to its screen", async ({ page }) => {
  await mockFriends(page, {
    friends: [EMMA],
    sent: [{ requestId: "request-9", reader: friend("sofia.stories", "Sofia Rossi", null), at: SENT.at }],
    activity: { sent: [SENT], accepted: [ACCEPTED], messages: [MESSAGE, MESSAGE_SENT] },
  });
  await page.goto("/");
  await expect(bell(page)).toHaveAccessibleName("Notifications, 3 new");
  await bell(page).click();
  await expect(panel(page)).toContainText("You sent Sofia Rossi a friend request");
  await expect(panel(page)).toContainText("Emma Tan accepted your friend request");
  await expect(panel(page)).toContainText("Emma Tan sent you a message");
  await expect(panel(page)).not.toContainText("You sent Emma Tan a message");

  // a message opens the chat with them
  await panel(page).getByRole("button", { name: /Emma Tan sent you a message/ }).click();
  await expect(page.getByRole("button", { name: "Close chat with Emma Tan" })).toBeVisible();

  // a sent request opens the friends list, which says who is still to answer
  await bell(page).click();
  await panel(page).getByRole("button", { name: /You sent Sofia Rossi a friend request/ }).click();
  await expect(friendsList(page)).toContainText("You asked Sofia Rossi to be friends");
});

test("an accepted request opens the friend on the map", async ({ page }) => {
  await mockFriends(page, { friends: [EMMA], activity: { accepted: [ACCEPTED] } });
  await page.goto("/");
  await bell(page).click();
  await panel(page).getByRole("button", { name: /Emma Tan accepted your friend request/ }).click();
  await expect(panel(page)).toBeHidden();
  await expect(bell(page)).toHaveAccessibleName("Notifications, 0 new");
});

test("a friend removed is gone from the friends list at once", async ({ page }) => {
  await mockFriends(page, { friends: [EMMA, NOAH] });
  await page.goto("/");
  await townReady(page);
  await page.getByRole("button", { name: /^Friends/ }).click();
  await expect(friendsList(page)).toContainText("Emma Tan");
  await friendsList(page).getByRole("button", { name: "Remove friends" }).click();
  await friendsList(page).getByRole("checkbox", { name: "Select Emma Tan" }).check();
  await friendsList(page).getByRole("button", { name: "Remove", exact: true }).click();
  await friendsList(page).getByRole("button", { name: /^Yes, remove/ }).click();
  await expect(friendsList(page)).not.toContainText("Emma Tan");
});

test("a visitor's profile goes back to the town it was opened from, not the Cafe", async ({ page }) => {
  await mockFriends(page, { friends: [EMMA], visits: [VISIT] });
  await page.goto("/");
  await bell(page).click();
  await panel(page).getByRole("button", { name: /Emma Tan visited/ }).click();
  await expect(page).toHaveURL(/\/people\/emma\.reads$/);
  await page.getByRole("link", { name: "Back to town" }).click();
  await expect(page).toHaveURL(/\/$/);
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

// A note someone left on your board: in the bell, and tapping it opens your board with it marked New.
test("a new note on your board shows in the bell and opens the board, marked New", async ({ page }) => {
  await skipMoodCheckIn(page);
  const note = { id: "note-1", ownerId: "me", authorId: "sam", author: "Sam Lee", text: "Lovely shelf!", createdAt: new Date().toISOString() };
  await mockFriends(page, { friends: [EMMA], notes: [note] });
  await openTownLooked(page);
  await expect(bell(page)).toHaveAccessibleName("Notifications, 1 new");
  await bell(page).click();
  await panel(page).getByRole("button", { name: /Sam Lee left a note on your board/ }).click();

  await expect(page).toHaveURL(/\/house$/, { timeout: 15000 });
  const board = page.getByRole("dialog", { name: "Notice board" });
  const onBoard = board.locator(".board__note").filter({ hasText: "Lovely shelf!" });
  await expect(onBoard).toContainText("New");

  // once opened it's read: opened again, nothing is new
  await board.getByRole("button", { name: "Close" }).click();
  await goToPlace(page, "Corkboard");
  await page.getByRole("button", { name: "Notice board" }).click();
  await expect(onBoard).toBeVisible();
  await expect(onBoard).not.toContainText("New");
});
