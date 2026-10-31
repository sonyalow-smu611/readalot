import { expect, test } from "./fixtures.js";
import { befriend } from "./supabaseUser.js";

// Friends in town: a friend has a house and, when online, walks the streets. The map is a canvas,
// so these go through the Friends and Places lists.
const WALK_IN = { timeout: 10_000 };

test.beforeEach(async ({ page, reader }) => {
  await befriend(reader.id, ["emma.reads", "ayaan.pages", "noah.bookmarks"], ["emma.reads", "ayaan.pages"]);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(new Date());
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [`readalot-daily:${reader.id}`, JSON.stringify({ day: today, shown: today })]);
  await page.goto("/");
  await expect(page.getByText("Loading the town…")).toBeHidden();
});

async function openPlace(page, name) {
  await page.getByRole("button", { name: "Places" }).click();
  await page.getByRole("navigation", { name: "Places in town" }).getByRole("button", { name: new RegExp(`^${name}`) }).click();
  return page.getByRole("dialog", { name });
}

test("only your friends have houses in town", async ({ page }) => {
  await page.getByRole("button", { name: "Places" }).click();
  const places = page.getByRole("navigation", { name: "Places in town" });
  for (const name of ["Emma's house", "Ayaan's house", "Noah's house"]) {
    await expect(places.getByRole("button", { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  await expect(places.getByRole("button", { name: /^Sofia's house/ })).toHaveCount(0);
});

test("a friend's house opens their profile", async ({ page }) => {
  const card = await openPlace(page, "Emma's house");
  await expect(card.getByText("Emma Tan", { exact: false })).toBeVisible();
  await expect(card).toContainText("Online now");
  await card.getByRole("button", { name: "Visit Emma" }).click();
  await expect(page).toHaveURL(/\/people\/emma\.reads$/, WALK_IN);
  await expect(page.getByRole("heading", { level: 1, name: "Emma Tan" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Visit Emma's room" })).toBeVisible();
});

// The Friends button counts who is online; its list shows everyone, and leads to their house.
test("the friends list shows who is online and finds their house", async ({ page }) => {
  const button = page.getByRole("button", { name: "Friends, 2 online" });
  await expect(button).toBeVisible();
  await button.click();

  const list = page.getByRole("navigation", { name: "Friends in town" });
  await expect(list.getByRole("button", { name: /Emma Tan.*Online now/ })).toBeVisible();
  await expect(list.getByRole("button", { name: /Ayaan Rahman.*Online now/ })).toBeVisible();

  await list.getByRole("button", { name: /Noah/ }).click();
  const card = page.getByRole("dialog", { name: "Noah's house" });
  await expect(card).toContainText("Last seen");
  await expect(card.getByRole("button", { name: "Visit Noah" })).toBeVisible();
});

// Online friends walk the streets; from the friends list you find them, say hi, and chat in a
// mini chat docked by the zoom buttons without leaving town.
test("you can find a friend out walking and chat to them", async ({ page }) => {
  await page.getByRole("button", { name: "Friends, 2 online" }).click();
  await page.getByRole("navigation", { name: "Friends in town" }).getByRole("button", { name: /Emma Tan/ }).click();

  const card = page.getByRole("dialog", { name: "Emma Tan" });
  await expect(card).toContainText("Online now");
  const box = page.getByRole("button", { name: "Chat with Emma Tan", exact: true });
  await expect(box).toHaveCount(0);
  await card.getByRole("button", { name: "Say hi" }).click();

  const chat = page.getByRole("region", { name: "Chat with Emma Tan" });
  await expect(chat).toBeVisible();
  await chat.getByRole("textbox", { name: "Message" }).fill("Fancy a walk to the library?");
  await chat.getByRole("button", { name: "Send" }).click();
  await expect(chat.getByText("Fancy a walk to the library?")).toBeVisible();

  // tuck it away to her box, and bring it back with the message still there
  await chat.getByRole("button", { name: "Minimise chat" }).click();
  await expect(chat).toBeHidden();
  await box.click();
  await expect(chat.getByText("Fancy a walk to the library?")).toBeVisible();

  await page.getByRole("button", { name: "Close chat with Emma Tan" }).click();
  await expect(chat).toBeHidden();
  await expect(box).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

test("a friend's card leads to their house", async ({ page }) => {
  await page.getByRole("button", { name: "Friends, 2 online" }).click();
  await page.getByRole("navigation", { name: "Friends in town" }).getByRole("button", { name: /Ayaan Rahman/ }).click();
  await page.getByRole("dialog", { name: "Ayaan Rahman" }).getByRole("button", { name: "Visit Ayaan's house" }).click();
  await expect(page).toHaveURL(/\/people\/ayaan\.pages$/, WALK_IN);
});

test("removing a friend takes their house away", async ({ page }) => {
  await page.getByRole("button", { name: "Friends, 2 online" }).click();
  await page.getByRole("navigation", { name: "Friends in town" }).getByRole("button", { name: /Ayaan Rahman/ }).click();
  const card = page.getByRole("dialog", { name: "Ayaan Rahman" });
  await card.getByRole("button", { name: "Remove friend" }).click();
  await card.getByRole("button", { name: "Yes, remove Ayaan" }).click();

  await expect(card).toBeHidden();
  await expect(page.getByRole("button", { name: "Friends, 1 online" })).toBeVisible();
  await page.getByRole("button", { name: "Places" }).click();
  await expect(page.getByRole("navigation", { name: "Places in town" }).getByRole("button", { name: /^Ayaan's house/ })).toHaveCount(0);
});
