// Scaffolded with AI assistance — see AI_USAGE.md
import { test, expect, catalogue, fitsScreen } from "./fixtures.js";
import { townReady } from "../fixtures.js";
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
