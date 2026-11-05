// Scaffolded with AI assistance — see AI_USAGE.md
import { test, expect, townControl, fitsScreen } from "./fixtures.js";
import { townReady, standsStill } from "../fixtures.js";
import { EMMA, mockFriends } from "../townFriends.js";
import { readProfile, setDaily, sgDay } from "../supabaseUser.js";

test.beforeEach(async ({ page }) => {
  await mockFriends(page, { friends: [EMMA] });
});

async function openTown(page) {
  await page.goto("/");
  await townReady(page);
}

test("MAP-01 completed daily tasks award coins once and persist", async ({ page, reader }) => {
  await setDaily(reader.id, { done: ["check-in", "reading", "visit-room", "send-message", "add-book", "leave-note"], shown: sgDay() });
  await openTown(page);
  await (await townControl(page, "button", /^Daily tasks/)).click();
  const panel = page.getByRole("region", { name: "Daily tasks" });
  await expect(panel.getByRole("list", { name: "Today’s tasks" }).getByRole("listitem")).toHaveCount(3);
  await panel.getByRole("button", { name: "Claim 50 coins" }).click();
  const reward = page.getByRole("dialog", { name: "Daily reward" });
  await expect(reward).toContainText("+50 coins");
  await reward.getByRole("button", { name: "Nice!" }).click();
  await expect.poll(async () => (await readProfile(reader.id)).coins).toBe(530);
  await page.reload();
  await townReady(page);
  await (await townControl(page, "button", /^Daily tasks/)).click();
  await expect(panel.getByRole("button", { name: "Claimed. New tasks tomorrow" })).toBeDisabled();
  expect((await readProfile(reader.id)).coins).toBe(530);
});

test("MAP-08 unfinished daily tasks cannot be claimed; Go opens the house card", async ({ page, reader }) => {
  await setDaily(reader.id, { done: ["check-in"], shown: sgDay() });
  await openTown(page);
  await (await townControl(page, "button", /^Daily tasks/)).click();
  const panel = page.getByRole("region", { name: "Daily tasks" });
  await expect(panel.getByRole("button", { name: "Finish 2 more to claim" })).toBeDisabled();
  await panel.getByRole("button", { name: "Go: Update your reading progress" }).click();
  await expect(panel).toBeHidden();
  await expect(page.getByRole("dialog", { name: "Your house" })).toBeVisible();
});

test("MAP-02 public/private switch saves both ways", async ({ page, context, reader }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 1.2966, longitude: 103.8502 });
  await openTown(page);
  let privacy = await townControl(page, "switch", "Public profile and location");
  await expect(privacy).toHaveAttribute("aria-checked", "false");
  await privacy.click();
  await expect(privacy).toHaveAttribute("aria-checked", "true");
  await expect.poll(async () => (await readProfile(reader.id)).discoverable).toBe(true);
  await privacy.click();
  await expect(privacy).toHaveAttribute("aria-checked", "false");
  await page.reload();
  await townReady(page);
  privacy = await townControl(page, "switch", "Public profile and location");
  await expect(privacy).toHaveAttribute("aria-checked", "false");
  expect((await readProfile(reader.id)).discoverable).toBe(false);
});

test("MAP-03 music switches off/on and remembers the choice", async ({ page }, testInfo) => {
  await openTown(page);
  const phone = testInfo.project.name === "iphone";
  const music = async () => townControl(page, phone ? "switch" : "button", phone ? /^Music/ : /^Turn music/);
  const state = phone ? "aria-checked" : "aria-pressed";
  const initial = await (await music()).getAttribute(state);
  await (await music()).click();
  await expect(await music()).toHaveAttribute(state, initial === "true" ? "false" : "true");
  await page.reload();
  await townReady(page);
  await expect(await music()).toHaveAttribute(state, initial === "true" ? "false" : "true");
  await (await music()).click();
  await expect(await music()).toHaveAttribute(state, initial);
});

test("MAP-04 profile badge opens the salon Profile tab", async ({ page }) => {
  await openTown(page);
  await page.getByRole("link", { name: /^Your profile/ }).click();
  await expect(page).toHaveURL(/\/salon\?tab=profile&sheet=1$/);
  await expect(page.getByRole("tab", { name: "Profile", exact: true })).toHaveAttribute("aria-selected", "true");
  await fitsScreen(page);
});

for (const [place, enter, route] of [
  ["Your house", "Go inside", "/house"], ["Library", "Enter the library", "/library"],
  ["Cafe", "Enter the cafe", "/cafe"], ["Hair Salon", "Enter the salon", "/salon"],
]) {
  test(`MAP-05 Places → ${place} → town`, async ({ page }) => {
    await openTown(page);
    await page.getByRole("button", { name: "Places", exact: true }).click();
    await page.getByRole("navigation", { name: "Places in town" }).getByRole("button", { name: new RegExp(`^${place}`) }).click();
    await page.getByRole("dialog", { name: place, exact: true }).getByRole("button", { name: enter }).click();
    await expect(page).toHaveURL(new RegExp(`${route}$`), { timeout: 20_000 });
    await page.getByRole("link", { name: "Back to town" }).click();
    await expect(page).toHaveURL(/\/$/);
    await townReady(page);
  });
}

test("MAP-06 notifications open and friends list contains the friend", async ({ page }) => {
  await openTown(page);
  await (await townControl(page, "button", /^Notifications/)).click();
  await expect(page.getByRole("region", { name: "Notifications" })).toBeVisible();
  await page.getByRole("button", { name: /^Friends/ }).click();
  await expect(page.getByText("Emma Tan", { exact: true }).first()).toBeVisible();
});

test("MAP-09 visit notification opens the reader; clearing persists after reload", async ({ page, reader }) => {
  const visitedAt = new Date().toISOString();
  await mockFriends(page, { friends: [EMMA], visits: [{
    id: "feature-visit", at: visitedAt, visitor: { id: EMMA.id, displayName: EMMA.displayName },
  }] });
  await openTown(page);
  await (await townControl(page, "button", /^Notifications/)).click();
  const panel = page.getByRole("region", { name: "Notifications" });
  await panel.getByRole("button", { name: /Emma Tan visited your room/ }).click();
  await expect(page).toHaveURL(/\/people\/emma\.reads$/);
  await openTown(page);
  await (await townControl(page, "button", /^Notifications/)).click();
  await panel.getByRole("button", { name: "Clear all", exact: true }).click();
  await expect(panel).toContainText("Nothing yet.");
  // The panel clears optimistically; reloading must wait for the persistence write.
  await expect.poll(async () => Date.parse((await readProfile(reader.id)).notifications_cleared_at || "")).toBeGreaterThan(Date.parse(visitedAt));
  await page.reload();
  await townReady(page);
  await (await townControl(page, "button", /^Notifications/)).click();
  await expect(panel).toContainText("Nothing yet.");
});

test("MAP-07 tapping ground walks the character and dragging releases follow", async ({ page }, testInfo) => {
  await openTown(page);
  const canvas = page.locator(".town-map__canvas canvas");
  await standsStill(canvas);
  const target = await page.evaluate(() => {
    const scene = window.__townScene;
    scene.you.stop();
    return { x: scene.you.body.x + 100, y: scene.you.body.y };
  });
  const box = await canvas.boundingBox();
  const point = await page.evaluate(({ x, y }) => {
    const { worldView, zoom } = window.__townScene.cameras.main;
    return { x: (x - worldView.x) * zoom, y: (y - worldView.y) * zoom };
  }, target);
  if (testInfo.project.name === "iphone") await page.touchscreen.tap(box.x + point.x, box.y + point.y);
  else await page.mouse.click(box.x + point.x, box.y + point.y);
  await expect.poll(() => page.evaluate(({ x, y }) => {
    const body = window.__townScene.you.body;
    return Math.hypot(body.x - x, body.y - y);
  }, target), { timeout: 10_000 }).toBeLessThan(8);
  const follow = page.getByRole("button", { name: "Follow my character" });
  await follow.click();
  await expect(follow).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 50, { steps: 8 });
  await page.mouse.up();
  await expect(follow).toHaveAttribute("aria-pressed", "false");
});
