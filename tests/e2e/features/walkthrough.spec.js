// Scaffolded with AI assistance — see AI_USAGE.md
import { test, expect, catalogue, fitsScreen } from "./fixtures.js";
import { standsStill, townReady } from "../fixtures.js";
import { mockFriends } from "../townFriends.js";
import { readProfile } from "../supabaseUser.js";

const tour = (page) => page.getByRole("region", { name: "Walkthrough", exact: true });

async function replay(page) {
  await catalogue(page);
  await mockFriends(page);
  await page.goto("/salon?tab=profile&sheet=1");
  await page.getByRole("button", { name: "Replay the walkthrough", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await townReady(page);
  await expect(tour(page)).toContainText("Let me show you round");
}

async function next(page, words) {
  await tour(page).getByRole("button", { name: "Next", exact: true }).click();
  await expect(tour(page)).toContainText(words);
}

test("TOUR-01 replay follows the screen layout; phone menu stays open through Next and Back", async ({ page }, testInfo) => {
  await replay(page);
  await next(page, "The weather:");
  await next(page, "You! The number is your level");
  const menu = page.getByRole("button", { name: /^Menu(?:, something new)?$/ });
  if (testInfo.project.name === "iphone") {
    await expect(menu).toBeVisible();
    await next(page, "Places lists every building");
    await next(page, "Friends: see who's online");
    await next(page, "Tap ☰.");
    await expect(tour(page).getByRole("button", { name: "Next", exact: true })).toHaveCount(0);
    await menu.click();
    const rows = page.getByRole("group", { name: "Town menu", exact: true });
    for (const [index, words] of ["Daily tasks:", "The bell:", "The music button:", "Private or Public."].entries()) {
      if (index) await next(page, words);
      await expect(tour(page)).toContainText(words);
      await expect(rows).toBeVisible();
      await expect(menu).toHaveAttribute("aria-expanded", "true");
    }
    await next(page, "Drag the map to look around");
    await expect(rows).toBeHidden();
    await tour(page).getByRole("button", { name: "Back", exact: true }).click();
    await expect(tour(page)).toContainText("Daily tasks:");
    await expect(rows).toBeVisible();
  } else {
    await expect(menu).toBeHidden();
    for (const words of ["Daily tasks:", "The music button:", "Places lists every building", "Friends: see who's online", "The bell:", "Private or Public.", "Drag the map to look around"]) {
      await next(page, words);
    }
    await expect(tour(page)).not.toContainText("Tap ☰.");
  }
  await fitsScreen(page);
  await tour(page).getByRole("button", { name: "Skip tour", exact: true }).click();
  await expect(tour(page)).toHaveCount(0);
});

// Pip has no account: the app plays Pip for the walkthrough (client/src/services/walkthroughPip.js)
test("TOUR-03 cafe walkthrough: Pip sits in the cafe, says yes, writes back, has a room, and leaves with the tour", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await replay(page);
  for (const section of ["Your house", "Library", "Your shelf", "Library"]) {
    await tour(page).getByRole("button", { name: "Skip this part", exact: true }).click();
    await expect(tour(page).getByText(new RegExp(`of \\d+ · ${section}$`))).toBeVisible();
  }
  await tour(page).getByRole("button", { name: "Skip this step", exact: true }).click();
  await expect(page).toHaveURL(/\/cafe$/);
  await expect(tour(page)).toContainText("Readers sit at the tables");
  await next(page, "That's Pip, the town librarian");

  await page.getByRole("button", { name: /^Walk to Pip the Librarian/ }).click();
  const profile = page.getByRole("dialog", { name: "Meet Pip the Librarian" });
  await expect(profile).toBeVisible({ timeout: 20_000 });
  await expect(tour(page)).toContainText("A reader's profile");
  await expect(profile).toContainText("Project Hail Mary");
  await next(page, "Send Pip a friend request.");

  // the walkthrough slides the card up from under its text bar first
  const add = profile.getByRole("button", { name: "Add friend", exact: true });
  await standsStill(add);
  await add.click();
  await expect(profile.getByRole("button", { name: /Added as friend/ })).toBeVisible();
  await expect(tour(page)).toContainText("Pip said yes!");

  await profile.getByRole("button", { name: "Message", exact: true }).click();
  const chat = page.getByRole("dialog", { name: "Message Pip" });
  await chat.getByRole("textbox", { name: "Your message", exact: true }).fill("Hello Pip!");
  await chat.getByRole("button", { name: /^SEND/i }).click();
  await expect(chat.getByText("Hello Pip!", { exact: true })).toBeVisible();
  // Pip's reply, one of Pip's lines
  await expect(chat.getByText(/^(Hi! Have you found|Lovely to hear from you|Ooh, tell me|Have you visited the cafe|Don't forget your daily tasks|A good book and a cup of tea)/)).toBeVisible();
  await chat.getByRole("button", { name: "Close", exact: true }).click();
  await expect(tour(page)).toContainText("Visit Pip's room.");

  await profile.getByRole("link", { name: "Visit Pip's room", exact: true }).click();
  await expect(page).toHaveURL(/\/people\/pip\.ikda\/room$/);
  await expect(tour(page)).toContainText("Pip's room!", { timeout: 20_000 });
  await expect(page.locator('[aria-label^="Bookshelf, 4 books"]')).toHaveCount(1);

  await next(page, "Back in town, Pip has a house now");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('[data-tour="town-friends"]')).toHaveAttribute("aria-label", /^Friends, 1 online/);
  // the welcome note Pip pinned on your board waits in the bell (a phone keeps the bell in ☰)
  const bell = testInfo.project.name === "iphone" ? page.locator('[data-tour="town-menu"]') : page.locator('[data-tour="town-bell"]');
  await expect(bell).toHaveAttribute("aria-label", testInfo.project.name === "iphone" ? "Menu, something new" : "Notifications, 1 new");

  await tour(page).getByRole("button", { name: "Skip tour", exact: true }).click();
  await expect(tour(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Friends, 0 online/ })).toBeVisible();
  if (testInfo.project.name !== "iphone") await expect(page.getByRole("button", { name: "Notifications, 0 new", exact: true })).toBeVisible();
  await page.goto("/cafe");
  await expect(page.getByText(/\d+ readers in café/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: /^Walk to Pip/ })).toHaveCount(0);
});

test("TOUR-02 salon walkthrough uses the town badge to open Profile; skipping persists", async ({ page, reader }) => {
  test.setTimeout(90_000);
  await replay(page);
  // Skip earlier sections through the visible controls to isolate the changed Salon steps.
  for (const section of ["Your house", "Library", "Your shelf", "Library", "Cafe", "Salon"]) {
    await tour(page).getByRole("button", { name: "Skip this part", exact: true }).click();
    await expect(tour(page).getByText(new RegExp(`of \\d+ · ${section}$`))).toBeVisible();
  }
  await tour(page).getByRole("button", { name: "Skip this step", exact: true }).click();
  await expect(page).toHaveURL(/\/salon(?:\?.*)?$/);
  await expect(tour(page)).toContainText("Restyle me here");
  await next(page, "Tap your badge.");
  await expect(page).toHaveURL(/\/$/);
  await townReady(page);
  await page.getByRole("link", { name: /^Your profile/ }).click();
  await expect(page).toHaveURL(/\/salon\?tab=profile/);
  await expect(page.getByRole("tab", { name: "Profile", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(tour(page)).toContainText("Your card: books reading, to read and finished");
  await tour(page).getByRole("button", { name: "Skip tour", exact: true }).click();
  await expect.poll(async () => Boolean((await readProfile(reader.id)).tour_seen_at)).toBe(true);
  await page.reload();
  await expect(page.getByRole("tab", { name: "Profile", exact: true })).toBeVisible();
  await expect(tour(page)).toHaveCount(0);
});
