// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test, townReady } from "./fixtures.js";
import { setDiscoverable } from "./supabaseUser.js";
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

// Anything that waits on the server shows it's on its way, then a tick once it's done.
test("accepting a request shows it's on its way, then a tick, then they're a friend", async ({ page }) => {
  const sofia = friend("sofia.stories", "Sofia Rossi", 2);
  const town = await mockFriends(page, { incoming: [{ requestId: "r1", reader: sofia, at: new Date().toISOString() }] });
  let letGo;
  const held = new Promise((resolve) => (letGo = resolve));
  await page.route("**/api/friends/requests/r1/accept", async (route) => {
    await held;
    town.incoming = [];
    town.friends = [sofia];
    return route.fulfill({ json: { accepted: true } });
  });
  await page.goto("/");
  await openList(page);
  const accept = list(page).getByRole("button", { name: "Accept Sofia Rossi" });
  await accept.click();
  await expect(accept).toHaveAttribute("aria-busy", "true");
  await expect(accept).toContainText("Accepting…");
  await expect(accept).toBeDisabled();
  letGo();
  await expect(accept).toContainText("✓");
  await expect(list(page)).toContainText("No requests right now.");
  await expect(list(page).locator(".friend-row").filter({ hasText: "Sofia Rossi" })).toBeVisible();
});

test("removing friends shows it's on its way, then a tick", async ({ page }) => {
  await mockFriends(page, { friends: [EMMA, NOAH] });
  let letGo;
  const held = new Promise((resolve) => (letGo = resolve));
  await page.route("**/api/friends/*", async (route) => {
    if (route.request().method() === "DELETE") await held;
    return route.fallback();
  });
  await page.goto("/");
  await openList(page);
  await list(page).getByRole("button", { name: "Remove friends" }).click();
  await list(page).getByRole("checkbox", { name: "Select Noah Lim" }).check();
  await list(page).getByRole("button", { name: "Remove", exact: true }).click();
  const confirm = list(page).getByRole("button", { name: "Yes, remove 1 friend" });
  await confirm.click();
  await expect(list(page).getByRole("button", { name: /Removing…/ })).toBeVisible();
  letGo();
  await expect(list(page).getByRole("button", { name: /Removed/ })).toContainText("✓");
  await expect(list(page).locator(".friend-row").filter({ hasText: "Noah Lim" })).toHaveCount(0);
});

// A friend you remove who is near you is still in town: on the map and in the list, as a reader
// nearby, who you can ask again.
test("a friend you remove who is near you stays in town as a reader nearby", async ({ page, reader }) => {
  await setDiscoverable(reader.id, true);
  try {
    const town = await mockFriends(page, { friends: [EMMA, NOAH] });
    // the server leaves friends out of who is nearby
    await page.route("**/api/nearby", (route) =>
      route.fulfill({ json: { readers: town.friends.some((one) => one.id === EMMA.id) ? [] : [{ ...EMMA, requested: false }] } })
    );
    await page.goto("/");
    await townReady(page);
    await openList(page);
    await list(page).getByRole("button", { name: "Remove friends" }).click();
    await list(page).getByRole("checkbox", { name: "Select Emma Tan" }).check();
    await list(page).getByRole("button", { name: "Remove", exact: true }).click();
    await list(page).getByRole("button", { name: "Yes, remove 1 friend" }).click();

    await expect(list(page).getByRole("heading", { name: "Readers nearby" })).toBeVisible();
    await expect(list(page).getByRole("button", { name: /^Emma Tan/ })).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__townScene.walkers["emma.reads"]?.kind)).toBe("nearby");
  } finally {
    await setDiscoverable(reader.id, false);
  }
});

// The chat by the zoom buttons gets out of the way when anything else is pressed.
test("an open chat closes when another button is pressed", async ({ page }) => {
  await mockFriends(page, { friends: [EMMA] });
  await page.goto("/");
  await openList(page);
  await list(page).locator(".friend-row").filter({ hasText: "Emma Tan" }).getByRole("button", { name: "Chat with Emma" }).click();
  const chat = page.getByRole("region", { name: "Chat with Emma Tan" });
  await expect(chat).toBeVisible();
  await page.getByRole("button", { name: "Places" }).click();
  await expect(chat).toBeHidden();
  // its box is still there, to open it again
  await expect(page.getByRole("button", { name: "Close chat with Emma Tan" })).toBeVisible();
});

// One thing at a time on a phone: the bell shuts the chat, and the chat shuts the bell.
test("the chat and the bell never cover each other", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockFriends(page, { friends: [EMMA] });
  await page.goto("/");
  await openList(page);
  await list(page).locator(".friend-row").filter({ hasText: "Emma Tan" }).getByRole("button", { name: "Chat with Emma" }).click();
  const chat = page.getByRole("region", { name: "Chat with Emma Tan" });
  const bellPanel = page.getByRole("region", { name: "Notifications" });
  await expect(chat).toBeVisible();
  // the chat stops below every button along the top, so they can all still be pressed
  const chatTop = (await chat.boundingBox()).y;
  for (const name of [/^Notifications,/, "Places", /^Friends,/]) {
    const box = await page.getByRole("button", { name }).boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(chatTop);
  }

  await page.getByRole("button", { name: /^Notifications,/ }).click();
  await expect(bellPanel).toBeVisible();
  await expect(chat).toBeHidden();

  // opening the chat from its box shuts the bell
  await page.locator(".chat-dock__name").filter({ hasText: "Emma" }).click();
  await expect(chat).toBeVisible();
  await expect(bellPanel).toBeHidden();
});

test("Add friend on a reader's profile shows it's sending, then a tick", async ({ page }) => {
  await mockFriends(page);
  let letGo;
  const held = new Promise((resolve) => (letGo = resolve));
  await page.route("**/api/friends/requests", async (route) => {
    await held;
    return route.fallback();
  });
  await page.goto("/people/sofia.shelves");
  const add = page.locator('[data-tour="reader-add"]');
  await expect(add).toHaveText("Add friend");
  await add.click();
  await expect(add).toContainText("Sending…");
  await expect(add).toHaveAttribute("aria-busy", "true");
  letGo();
  await expect(add).toContainText("✓");
  await expect(add).toContainText("Request sent");
});
