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

// The Friends button counts who is online; its list shows everyone, and leads to their house.
test("the friends list shows who is online and finds their house", async ({ page }) => {
  const button = page.getByRole("button", { name: "Friends, 2 online" });
  await expect(button).toBeVisible();
  await button.click();

  const list = page.getByRole("navigation", { name: "Friends in town" });
  await expect(list.getByRole("button", { name: /Emma Tan.*Online now/ })).toBeVisible();
  await expect(list.getByRole("button", { name: /Ayaan Rahman.*Online now/ })).toBeVisible();
  await expect(list.getByRole("button", { name: /Sofia.*Last seen 12 days ago/ })).toBeVisible();
  await expect(list.getByRole("button", { name: /Daniel.*Last seen 3 months ago/ })).toBeVisible();

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

  // the chat opens with what you've said before, and her box appears
  const chat = page.getByRole("region", { name: "Chat with Emma Tan" });
  await expect(chat).toBeVisible();
  await expect(chat.getByText("Hey! What's your favourite book lately?")).toBeVisible();
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
  await expect(page).toHaveURL(/\/people\/reader-ayaan$/, WALK_IN);
});

test("a friend's place card says when they are online", async ({ page }) => {
  const card = await openPlace(page, "Emma's house");
  await expect(card).toContainText("Online now");
});

test("every friend's house is in the Places list", async ({ page }) => {
  await page.getByRole("button", { name: "Places" }).click();
  const places = page.getByRole("navigation", { name: "Places in town" });
  for (const name of ["Emma's house", "Ayaan's house", "Sofia's house", "Noah's house", "Mei's house", "Daniel's house", "Priya's house"]) {
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
