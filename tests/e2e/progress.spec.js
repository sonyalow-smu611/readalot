// Scaffolded with AI assistance — see AI_USAGE.md
// Reader levels and coins: the map's badge, XP for visiting a room (once a day), level-up coins,
// the Shop spending saved coins, and the database refusing coins a reader sets themselves.
import { expect, test } from "./fixtures.js";
import { giveXp, readProfile, readXp, readerClient } from "./supabaseUser.js";

const badge = (page) => page.getByRole("link", { name: /^Your profile/ });

async function quietRoom(page) {
  // today's mood check-in already answered, so it does not open over the room
  await page.addInitScript(() => {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    localStorage.setItem("readalot.moodCheckIn", `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  });
  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "sunny", temperature: 27, weatherCode: 0, isDay: true } })
  );
}

test("the map's badge shows the reader's level and coins", async ({ page }) => {
  await page.goto("/");
  await expect(badge(page)).toHaveAccessibleName(/Reader, level 1, 100 XP to the next level, 480 coins/);
  await badge(page).click();
  await expect(page).toHaveURL(/\/salon$/);
});

test("visiting a reader's room earns 15 XP, once a day", async ({ page, reader }) => {
  await quietRoom(page);
  await page.goto("/people/reader-emma/room");
  await expect(page.getByRole("heading", { level: 1, name: "Emma's Room" })).toBeVisible();
  await expect.poll(async () => (await readXp(reader.id)).length).toBe(1);
  expect((await readXp(reader.id))[0]).toMatchObject({ action: "visit_room", target: "reader-emma", xp: 15 });

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Emma's Room" })).toBeVisible();
  await page.waitForTimeout(1000);
  expect(await readXp(reader.id)).toHaveLength(1);
});

test("a level-up gives coins, and the salon shows the new level", async ({ page, reader }) => {
  await quietRoom(page);
  await giveXp(reader.id, 90);
  await page.goto("/");
  await expect(badge(page)).toHaveAccessibleName(/level 1, 10 XP to the next level, 480 coins/);

  // 90 + 15 reaches level 2, which gives 50 coins
  await page.goto("/people/reader-emma/room");
  await expect.poll(async () => (await readProfile(reader.id)).coins).toBe(530);

  await page.goto("/salon");
  await page.getByRole("tab", { name: "Profile" }).click();
  await expect(page.getByRole("heading", { name: "Reader level" })).toBeVisible();
  await expect(page.getByText("145 XP to level 3, which gives 75 coins")).toBeVisible();
});

test("buying from the Shop spends saved coins", async ({ page, reader }) => {
  await quietRoom(page);
  await page.goto("/house");
  await expect(page.getByRole("button", { name: /^Bookshelf, \d+ books$/ })).toBeVisible();
  const menu = page.getByRole("button", { name: "Shop", exact: true });
  if (!(await menu.isVisible())) await page.getByRole("button", { name: "Room menu" }).click();
  await menu.click();
  const shop = page.getByRole("region", { name: "Decoration shop" });
  await shop.getByRole("button", { name: /Succulent trio/ }).click();
  await page.getByRole("button", { name: "Confirm" }).click();

  await expect.poll(async () => (await readProfile(reader.id)).coins).toBe(450);
  await page.reload();
  await expect(page.locator(".home__credits")).toContainText("450");
});

test("a reader can't set their own coins or XP", async ({ reader }) => {
  const client = readerClient(reader.session);
  const coins = await client.from("profiles").update({ coins: 99999 }).eq("id", reader.id);
  expect(coins.error).not.toBeNull();
  const xp = await client.from("xp_events").insert({ reader: reader.id, action: "finish_book", target: "x", day: "2026-01-01", xp: 1000 });
  expect(xp.error).not.toBeNull();
  expect((await readProfile(reader.id)).coins).toBe(480);
});
