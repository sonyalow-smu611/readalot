// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test, townReady } from "./fixtures.js";
import { EMMA, NOAH, friend, mockFriends, skipDailyPanel } from "./townFriends.js";

// The friends list: who your friends are and what they're reading, chatting, adding by username
// and removing several at once.
const list = (page) => page.getByRole("navigation", { name: "Friends in town" });

async function openList(page) {
  await page.getByRole("button", { name: /^Friends,/ }).click();
  await expect(list(page)).toBeVisible();
}

test.beforeEach(async ({ page, reader }) => {
  await skipDailyPanel(reader.id);
});

test("each friend shows their head, their book and a chat button", async ({ page }) => {
  await mockFriends(page, { friends: [EMMA, NOAH] });
  await page.goto("/");
  await openList(page);

  const emma = list(page).locator(".friend-row").filter({ hasText: "Emma Tan" });
  await expect(emma).toContainText("Reading The Hobbit");
  await expect(emma.locator("canvas, img").first()).toBeVisible();
  // nothing on the go: when they were last seen instead
  await expect(list(page).locator(".friend-row").filter({ hasText: "Noah Lim" })).toContainText("Last seen");

  await emma.getByRole("button", { name: "Chat with Emma" }).click();
  await expect(page.getByRole("region", { name: "Chat with Emma Tan" })).toBeVisible();
  await expect(list(page)).toBeHidden();
});

test("the chat button works for a friend with no house", async ({ page }) => {
  await mockFriends(page, { friends: [{ ...NOAH, spot: null }] });
  await page.goto("/");
  await openList(page);
  await expect(list(page).getByRole("button", { name: /^Noah Lim/ })).toBeDisabled();
  await list(page).getByRole("button", { name: "Chat with Noah" }).click();
  await expect(page.getByRole("region", { name: "Chat with Noah Lim" })).toBeVisible();
});

test("a friend online with no character yet is found at their house", async ({ page }) => {
  await mockFriends(page, { friends: [{ ...EMMA, character: null }] });
  await page.goto("/");
  await townReady(page);
  await openList(page);
  await list(page).getByRole("button", { name: /^Emma Tan/ }).click();
  await expect(page.getByRole("dialog", { name: "Emma's house" })).toBeVisible();
});

test("friend requests have their own section, even with none waiting", async ({ page }) => {
  const town = await mockFriends(page, { friends: [EMMA], incoming: [{ requestId: "request-noah", reader: NOAH }] });
  await page.route("**/api/friends/requests/request-noah/accept", (route) => {
    town.incoming = [];
    town.friends = [EMMA, NOAH];
    return route.fulfill({ json: { accepted: true } });
  });
  await page.goto("/");
  await openList(page);

  await expect(list(page).getByRole("heading", { name: "Friend requests" })).toBeVisible();
  await expect(list(page)).toContainText("Noah Lim wants to be friends");
  await list(page).getByRole("button", { name: "Accept Noah Lim" }).click();

  await expect(list(page)).toContainText("No requests right now.");
  await expect(list(page).locator(".friend-row").filter({ hasText: "Noah Lim" })).toBeVisible();
});

test("adding a friend by username says how it went", async ({ page }) => {
  const town = await mockFriends(page, { friends: [EMMA], outgoing: ["sofia.stories"] });
  await page.goto("/");
  await openList(page);
  await list(page).getByRole("button", { name: "Add friend" }).click();
  const field = list(page).getByRole("textbox", { name: "Friend's username" });
  const send = list(page).getByRole("button", { name: "Send request" });
  await expect(send).toBeDisabled();

  await field.fill("nobody.here");
  await send.click();
  await expect(list(page).getByRole("status")).toHaveText("Couldn't find nobody.here. Check the spelling.");

  await field.fill("@Emma.Reads ");
  await send.click();
  await expect(list(page).getByRole("status")).toHaveText("You're already friends with emma.reads.");

  await field.fill("sofia.stories");
  await send.click();
  await expect(list(page).getByRole("status")).toHaveText("You've already asked sofia.stories.");

  await field.fill("@Ravi.Reads");
  await send.click();
  await expect(list(page).getByRole("status")).toHaveText("Friend request sent to ravi.reads.");
  await expect(field).toHaveValue("");
  expect(town.asked).toEqual(["nobody.here", "ravi.reads"]);
});

// A request can take a moment: the button says it's sending and can't be pressed twice.
test("Send request shows Sending… while the request is on its way", async ({ page }) => {
  const town = await mockFriends(page);
  let letGo;
  const held = new Promise((resolve) => (letGo = resolve));
  await page.route("**/api/friends/requests", async (route) => {
    await held;
    return route.fallback();
  });
  await page.goto("/");
  await openList(page);
  await list(page).getByRole("button", { name: "Add friend" }).click();
  await list(page).getByRole("textbox", { name: "Friend's username" }).fill("ravi.reads");
  await list(page).getByRole("button", { name: "Send request" }).click();

  const sending = list(page).getByRole("button", { name: "Sending…" });
  await expect(sending).toBeVisible();
  await expect(sending).toBeDisabled();
  letGo();
  await expect(list(page).getByRole("status")).toHaveText("Friend request sent to ravi.reads.");
  await expect(list(page).getByRole("button", { name: "Send request" })).toBeVisible();
  expect(town.asked).toEqual(["ravi.reads"]);
});

test("removing friends asks first, then removes the ones ticked", async ({ page }) => {
  const town = await mockFriends(page, { friends: [EMMA, NOAH] });
  await page.goto("/");
  await openList(page);

  // changing your mind leaves everyone there
  await list(page).getByRole("button", { name: "Remove friends" }).click();
  await list(page).getByRole("checkbox", { name: "Select Noah Lim" }).check();
  await list(page).getByRole("button", { name: "Cancel" }).click();
  await expect(list(page).getByRole("checkbox")).toHaveCount(0);

  await list(page).getByRole("button", { name: "Remove friends" }).click();
  const remove = list(page).getByRole("button", { name: "Remove", exact: true });
  await expect(remove).toBeDisabled();
  await list(page).getByRole("checkbox", { name: "Select Noah Lim" }).check();
  await expect(list(page)).toContainText("This removes 1 friend for both of you");
  await remove.click();
  expect(town.removed).toEqual([]);
  await list(page).getByRole("button", { name: "Yes, remove 1 friend" }).click();

  await expect(list(page).locator(".friend-row").filter({ hasText: "Noah Lim" })).toHaveCount(0);
  await expect(list(page).locator(".friend-row").filter({ hasText: "Emma Tan" })).toBeVisible();
  expect(town.removed).toEqual(["noah.bookmarks"]);
});

// A reader nearby who says yes at once (Pip) becomes a friend straight away: one card, the
// friend's, and they leave the nearby list, with no second card over the first.
test("adding a nearby reader who accepts at once leaves just their friend card", async ({ page }) => {
  const pip = friend("pip.librarian", "Pip the Librarian", 2);
  const town = await mockFriends(page);
  await page.route("**/api/nearby", (route) => route.fulfill({ json: { readers: [pip] } }));
  await page.route("**/api/friends/requests", (route) => {
    town.friends.push(pip);
    return route.fulfill({ status: 201, json: { requested: true } });
  });
  await page.goto("/");
  await townReady(page);
  await openList(page);
  await list(page).getByRole("button", { name: /^Pip the Librarian/ }).click();
  const cards = page.getByRole("dialog", { name: "Pip the Librarian" });
  await expect(cards).toHaveCount(1);
  await expect(cards).toContainText("Reader nearby");

  await cards.getByRole("button", { name: "Add friend" }).click();
  await expect(cards).toHaveCount(1);
  await expect(cards).toContainText("Friend");
  await expect(cards).not.toContainText("Reader nearby");
  await openList(page);
  await expect(list(page).getByRole("heading", { name: "Readers nearby" })).toHaveCount(0);
});
