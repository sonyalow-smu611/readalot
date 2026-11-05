// Scaffolded with AI assistance — see AI_USAGE.md
import { test, expect, fitsScreen } from "./fixtures.js";
import { giveXp, readProfile, readXp, seedReaderBook } from "../supabaseUser.js";
import { useRealApi } from "../fixtures.js";

const group = (page, name) => page.getByRole("group", { name, exact: true });
async function profile(page) {
  await page.goto("/salon?tab=profile&sheet=1");
  await expect(page.getByRole("tab", { name: "Profile", exact: true })).toHaveAttribute("aria-selected", "true");
}

test("SALON-01 hair, skin and outfit save together and survive reload", async ({ page, reader }) => {
  await page.goto("/salon?sheet=1");
  await group(page, "Hair style").getByRole("radio", { name: "Bun", exact: true }).check();
  await group(page, "Hair colour").getByRole("radio", { name: "Chestnut", exact: true }).check();
  await page.getByRole("tab", { name: "Skin", exact: true }).click();
  await group(page, "Skin tone").getByRole("radio", { name: "Skin tone 8", exact: true }).check();
  await page.getByRole("tab", { name: "Outfit", exact: true }).click();
  await group(page, "Top").getByRole("radio", { name: "Long coat", exact: true }).check();
  await page.getByRole("button", { name: "Save look", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save look", exact: true })).toHaveCount(0);
  await expect.poll(async () => (await readProfile(reader.id)).character).toMatchObject({ hair: "bun", hairColour: "chestnut", skin: "tone-8", top: "coat" });
  await page.reload();
  await expect(group(page, "Hair style").getByRole("radio", { name: "Bun", exact: true })).toBeChecked();
  await page.getByRole("tab", { name: "Skin", exact: true }).click();
  await expect(group(page, "Skin tone").getByRole("radio", { name: "Skin tone 8", exact: true })).toBeChecked();
  await page.getByRole("tab", { name: "Outfit", exact: true }).click();
  await expect(group(page, "Top").getByRole("radio", { name: "Long coat", exact: true })).toBeChecked();
  await fitsScreen(page);
});

test("SALON-02 favourite genres, gender and religion persist", async ({ page }) => {
  await profile(page);
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await page.getByRole("radiogroup", { name: "Gender", exact: true }).getByRole("radio", { name: "Non-binary", exact: true }).check();
  await page.getByLabel("Age", { exact: true }).fill("24");
  await page.getByRole("radiogroup", { name: "Religion", exact: true }).getByRole("radio", { name: "None", exact: true }).check();
  const genres = group(page, "Favourite genres");
  await genres.getByRole("button", { name: "Romance", exact: true }).click();
  await expect(genres.getByRole("button", { name: "Romance", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit profile", exact: true })).toBeVisible();
  await expect(page.getByText("Non-binary", { exact: true })).toBeVisible();
  await expect(page.getByText("None", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await expect(page.getByRole("radiogroup", { name: "Gender", exact: true }).getByRole("radio", { name: "Non-binary", exact: true })).toBeChecked();
  await expect(page.getByRole("radiogroup", { name: "Religion", exact: true }).getByRole("radio", { name: "None", exact: true })).toBeChecked();
  await expect(genres.getByRole("button", { name: "Romance", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("link", { name: "Romance bookcase in the library" }).click();
  await expect(page.getByRole("dialog", { name: "Romance", exact: true })).toBeVisible();
});

test("SALON-03 earned XP updates the level bar and pays level-up coins once", async ({ page, reader }) => {
  const book = await seedReaderBook(reader.id, { title: "Level Journey", authors: ["Test Author"], genres: ["Fantasy"], description: "A test book." });
  try {
    await useRealApi(page);
    await giveXp(reader.id, 90);
    await profile(page);
    await expect(page.getByRole("progressbar", { name: "Progress to level 2" })).toHaveAttribute("aria-valuenow", "90");
    await page.goto("/house/shelf");
    await page.getByRole("button", { name: /^Level Journey by/ }).click();
    await page.getByRole("dialog", { name: "Book details" }).getByRole("button", { name: "Start reading" }).click();
    await expect.poll(async () => (await readXp(reader.id)).some((event) => event.action === "start_book" && event.xp === 20)).toBe(true);
    await expect.poll(async () => (await readProfile(reader.id)).coins).toBe(530);
    await profile(page);
    await expect(page.getByRole("progressbar", { name: "Progress to level 3" })).toHaveAttribute("aria-valuenow", "7");
    await expect(page.getByText("140 XP to level 3, which gives 75 coins")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("progressbar", { name: "Progress to level 3" })).toHaveAttribute("aria-valuenow", "7");
    expect((await readProfile(reader.id)).coins).toBe(530);
  } finally {
    await book.remove();
  }
});

test("SALON-04 reading tracker lists each status and reading progress", async ({ page }) => {
  // The tracker must reflect the shelf's data rather than a hardcoded number.
  const { books } = await (await page.request.get("/api/user-books")).json();
  await profile(page);
  for (const [status, label] of [["want_to_read", "To read"], ["reading", "Reading"], ["read", "Finished"]]) {
    const expected = books.filter((book) => book.status === status);
    await page.getByRole("button", { name: new RegExp(`^\\d+ ${label}$`) }).click();
    const list = page.getByRole("dialog", { name: new RegExp(`^${label}\\b`) });
    await expect(list.getByRole("listitem")).toHaveCount(expected.length);
    for (const book of expected) {
      await expect(list.getByRole("link", { name: new RegExp(book.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })).toBeVisible();
      if (status === "reading") await expect(list).toContainText(`${book.progress}%`);
    }
    await list.getByRole("button", { name: "Close", exact: true }).click();
    await expect(list).toBeHidden();
  }
});
