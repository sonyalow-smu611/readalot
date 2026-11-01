// Scaffolded with AI assistance — see AI_USAGE.md
import { readFileSync } from "node:fs";
import { expect, skipMoodCheckIn, test } from "./fixtures.js";
import { EMMA, mockFriends, skipDailyPanel } from "./townFriends.js";

// Tapping the map, and coming back out of a building. The map is a canvas with nothing to label,
// so these tap by position and read where everyone is from the page's __townScene (dev only).
const WALK_IN = { timeout: 10_000 };
const BOOT = { timeout: 20_000 };
const { doors, lake } = JSON.parse(readFileSync("client/src/town/map-data.json"));
const front = (art) => [doors[art].x + doors[art].w / 2, doors[art].y + doors[art].h + 8];

const you = (page) => page.evaluate(() => {
  const body = window.__townScene?.you?.body;
  return body ? [body.x, body.y] : null;
});

// Taps the map at a map position, which has to be on screen.
async function tapMap(page, [x, y]) {
  const box = await page.locator(".town-map__canvas canvas").boundingBox();
  const spot = await page.evaluate(([mapX, mapY]) => {
    const { worldView, zoom } = window.__townScene.cameras.main;
    return [(mapX - worldView.x) * zoom, (mapY - worldView.y) * zoom];
  }, [x, y]);
  await page.mouse.click(box.x + spot[0], box.y + spot[1]);
}

test.beforeEach(async ({ page, reader }) => {
  await mockFriends(page, { friends: [EMMA] });
  await skipDailyPanel(page, reader.id);
  await skipMoodCheckIn(page);
  await page.goto("/");
  await expect(page.getByText("Loading the town…")).toBeHidden(BOOT);
  await page.evaluate(() => window.__townScene.you.stop());
});

test("tapping the ground walks your character there and they stay", async ({ page }) => {
  const [x, y] = await you(page);
  const spot = [x + 220, y];
  await tapMap(page, spot);
  await expect.poll(async () => Math.hypot(...(await you(page)).map((at, i) => at - spot[i])), WALK_IN).toBeLessThan(8);
  await page.waitForTimeout(4500);
  expect(Math.hypot(...(await you(page)).map((at, i) => at - spot[i]))).toBeLessThan(8);
});

test("tapping the lake takes your character to the shore, not into the water", async ({ page }) => {
  await tapMap(page, [lake.x, lake.y - lake.ry + 60]);
  await page.waitForTimeout(4000);
  const [x, y] = await you(page);
  expect(((x - lake.x) / lake.rx) ** 2 + ((y - lake.y) / lake.ry) ** 2).toBeGreaterThan(1);
});

test("a tap on the ground closes an open card", async ({ page }) => {
  await page.getByRole("button", { name: "Places" }).click();
  await page.getByRole("navigation", { name: "Places in town" }).getByRole("button", { name: /^Your house/ }).click();
  const card = page.getByRole("dialog", { name: "Your house" });
  await expect(card).toBeVisible();
  const [x, y] = await you(page);
  await tapMap(page, [x - 120, y]);
  await expect(card).toBeHidden();
});

test("tapping a townsperson makes them jiggle, then carry on", async ({ page }) => {
  // the camera brought to one of them, so they can be tapped
  await page.evaluate(() => {
    const scene = window.__townScene;
    // one well in from the edges, so the camera can bring it to the middle of the screen
    const inTown = (one) => one.x > 800 && one.x < 2800 && one.y > 500 && one.y < 2000;
    const walker = scene.children.list.find((one) => one.input && one.texture?.key.startsWith("avatar-") && inTown(one));
    window.__walker = walker;
    scene.cameras.main.centerOn(walker.x, walker.y);
  });
  await page.waitForTimeout(100);
  const before = await you(page);
  // the wobble is over in half a second: noted every frame so it can't be missed between looks
  await page.evaluate(() => {
    window.__wobble = 0;
    const note = () => {
      window.__wobble = Math.max(window.__wobble, Math.abs(window.__walker.angle));
      requestAnimationFrame(note);
    };
    note();
  });
  await tapMap(page, await page.evaluate(() => [window.__walker.x, window.__walker.y - 50]));
  await expect.poll(() => page.evaluate(() => window.__wobble), { timeout: 2000 }).toBeGreaterThan(1);
  await expect.poll(() => page.evaluate(() => window.__walker.angle), { timeout: 2000 }).toBe(0);
  expect(await you(page)).toEqual(before);
});

for (const [name, button, art, url] of [
  ["Library", "Enter the library", "library", /\/library$/],
  ["Cafe", "Enter the cafe", "cafe", /\/cafe$/],
  ["Your house", "Go inside", "house", /\/house$/],
]) {
  test(`coming back from ${name} leaves you outside its door`, async ({ page }) => {
    await page.getByRole("button", { name: "Places" }).click();
    await page.getByRole("navigation", { name: "Places in town" }).getByRole("button", { name: new RegExp(`^${name}`) }).click();
    await page.getByRole("dialog", { name }).getByRole("button", { name: button }).click();
    await expect(page).toHaveURL(url, WALK_IN);
    await page.getByRole("link", { name: "Back to town" }).click();
    await expect.poll(() => you(page), BOOT).toEqual(front(art));
    await page.waitForTimeout(4500);
    expect(await you(page)).toEqual(front(art));
  });
}

test("coming back from a friend's house leaves you outside it", async ({ page }) => {
  await page.getByRole("button", { name: "Places" }).click();
  await page.getByRole("navigation", { name: "Places in town" }).getByRole("button", { name: /^Emma's house/ }).click();
  await page.getByRole("dialog", { name: "Emma's house" }).getByRole("button", { name: "Visit Emma" }).click();
  await expect(page).toHaveURL(/\/people\/emma\.reads$/, WALK_IN);
  await page.goBack();
  await expect.poll(() => you(page), BOOT).toEqual(front("cottage-white"));
});

test("refreshing the page starts you from your front door again", async ({ page }) => {
  await page.getByRole("button", { name: "Places" }).click();
  await page.getByRole("navigation", { name: "Places in town" }).getByRole("button", { name: /^Library/ }).click();
  await page.getByRole("dialog", { name: "Library" }).getByRole("button", { name: "Enter the library" }).click();
  await expect(page).toHaveURL(/\/library$/, WALK_IN);
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => window.__townScene?.you?.stayPut), BOOT).toBe(false);
});
