// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, skipMoodCheckIn, standsStill, test, townReady } from "./fixtures.js";
import { EMMA, mockFriends, skipDailyPanel } from "./townFriends.js";

// Dragging the town around on a phone-sized screen. The map is a canvas with nothing to label, so
// these press by position and read what the camera shows from the page's __townScene (dev only).
const IPHONE = { width: 390, height: 844 };
const MAP = { width: 3584, height: 2560 };
// A drag only starts once the press has moved a little, and that first step doesn't move the map.
const SLACK = 40;

test.use({ viewport: IPHONE });

async function openTown(page, reader) {
  await mockFriends(page, { friends: [EMMA] });
  await skipDailyPanel(reader.id);
  await skipMoodCheckIn(page);
  await page.goto("/");
  await townReady(page);
  await standsStill(page.locator(".town-map__canvas canvas"));
  await page.evaluate(() => window.__townScene.you.stop());
}

// The part of the map on screen, once the camera has drawn its latest position.
const shown = (page) =>
  page.evaluate(async () => {
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    const { worldView, zoom } = window.__townScene.cameras.main;
    return { x: worldView.x, y: worldView.y, width: worldView.width, height: worldView.height, zoom };
  });

const stepsBetween = ([fromX, fromY], [toX, toY], steps = 12) =>
  Array.from({ length: steps }, (_, i) => [
    fromX + ((toX - fromX) * (i + 1)) / steps,
    fromY + ((toY - fromY) * (i + 1)) / steps,
  ]);

async function mouseDrag(page, from, to) {
  await page.mouse.move(...from);
  await page.mouse.down();
  for (const step of stepsBetween(from, to)) await page.mouse.move(...step);
  await page.mouse.up();
}

// Playwright can only tap, so a moving finger goes straight to the browser. A finger's place in
// the list is its id, so null skips one; "touchEnd" lifts the fingers it names, or all of them.
async function touchscreen(page, context) {
  const cdp = await context.newCDPSession(page);
  return (type, ...fingers) =>
    cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: fingers.flatMap((at, id) => (at ? [{ x: at[0], y: at[1], id }] : [])),
    });
}

async function touchDrag(touch, from, to, steps) {
  await touch("touchStart", from);
  for (const step of stepsBetween(from, to, steps)) await touch("touchMove", step);
  await touch("touchEnd");
}

// The map follows the press: dragging down by some distance shows what was above, by that distance
// divided by the zoom. Ending on a zoom button doesn't press it.
function expectFollowed(before, after, [fromX, fromY], [toX, toY]) {
  expect(after.zoom).toBe(before.zoom);
  expect(Math.abs(after.x - before.x + (toX - fromX) / before.zoom)).toBeLessThan(SLACK);
  expect(Math.abs(after.y - before.y + (toY - fromY) / before.zoom)).toBeLessThan(SLACK);
}

test("a mouse drag carries on across the buttons over the map", async ({ page, reader }) => {
  await openTown(page, reader);
  const button = await page.getByRole("button", { name: "Zoom out" }).boundingBox();
  // it ends on the button: back on the bare map, a frozen drag would jump to catch up
  const x = button.x + button.width / 2;
  const from = [x, 300];
  const to = [x, button.y + button.height / 2];

  const before = await shown(page);
  await mouseDrag(page, from, to);
  expectFollowed(before, await shown(page), from, to);
});

test("a drag takes over from the camera gliding to a place", async ({ page, reader }) => {
  await openTown(page, reader);
  await page.getByRole("button", { name: "Places" }).click();
  await page.getByRole("navigation", { name: "Places in town" }).getByRole("button").first().click();
  const from = [195, 300];
  const to = [195, 500];

  await page.mouse.move(...from);
  await page.mouse.down();
  await page.mouse.move(195, 320);
  const before = await shown(page);
  for (const step of stepsBetween([195, 320], to)) await page.mouse.move(...step);
  await page.mouse.up();
  // past where the glide would have ended
  await page.waitForTimeout(900);
  expectFollowed(before, await shown(page), [195, 320], to);
});

test.describe("with a finger", () => {
  test.use({ hasTouch: true, isMobile: true, deviceScaleFactor: 3 });

  test("dragging reaches every corner of the map and comes back", async ({ page, reader, context }) => {
    await openTown(page, reader);
    const touch = await touchscreen(page, context);
    // each one drags the map the other way, to show the corner it is named for
    const leftward = [[60, 420], [330, 420]];
    const rightward = [[330, 420], [60, 420]];
    const upward = [[195, 160], [195, 700]];
    const downward = [[195, 700], [195, 160]];

    async function dragUntilStopped(from, to) {
      let last = null;
      for (let i = 0; i < 20; i++) {
        await touchDrag(touch, from, to, 4);
        const now = await shown(page);
        if (last && now.x === last.x && now.y === last.y) return now;
        last = now;
      }
      throw new Error("the map never reached its edge");
    }

    await dragUntilStopped(...leftward);
    const topLeft = await dragUntilStopped(...upward);
    expect([topLeft.x, topLeft.y]).toEqual([0, 0]);

    await dragUntilStopped(...rightward);
    const topRight = await shown(page);
    expect(topRight.x + topRight.width).toBeCloseTo(MAP.width, 0);
    expect(topRight.y).toBe(0);

    const bottomRight = await dragUntilStopped(...downward);
    expect(bottomRight.x + bottomRight.width).toBeCloseTo(MAP.width, 0);
    expect(bottomRight.y + bottomRight.height).toBeCloseTo(MAP.height, 0);

    const bottomLeft = await dragUntilStopped(...leftward);
    expect(bottomLeft.x).toBe(0);
    expect(bottomLeft.y + bottomLeft.height).toBeCloseTo(MAP.height, 0);
  });

  test("a tap with a finger still walks your character there", async ({ page, reader }) => {
    await openTown(page, reader);
    const you = () => page.evaluate(() => [window.__townScene.you.body.x, window.__townScene.you.body.y]);
    const [x, y] = await you();
    const spot = [x + 220, y];
    const { x: left, y: top, zoom } = await shown(page);

    await page.touchscreen.tap((spot[0] - left) * zoom, (spot[1] - top) * zoom);

    await expect
      .poll(async () => Math.hypot(...(await you()).map((at, i) => at - spot[i])), { timeout: 10_000 })
      .toBeLessThan(8);
  });

  test("a drag can start in the gap between the zoom buttons", async ({ page, reader, context }) => {
    await openTown(page, reader);
    const zoomIn = await page.getByRole("button", { name: "Zoom in" }).boundingBox();
    const zoomOut = await page.getByRole("button", { name: "Zoom out" }).boundingBox();
    const x = zoomIn.x + zoomIn.width / 2;
    const from = [x, (zoomIn.y + zoomIn.height + zoomOut.y) / 2];
    const to = [x - 250, from[1]];

    const before = await shown(page);
    await touchDrag(await touchscreen(page, context), from, to);
    expectFollowed(before, await shown(page), from, to);
  });

  test("a touch drag carries on across the buttons over the map", async ({ page, reader, context }) => {
    await openTown(page, reader);
    const button = await page.getByRole("button", { name: "Zoom out" }).boundingBox();
    const x = button.x + button.width / 2;
    const from = [x, 300];
    const to = [x, button.y + button.height / 2];

    const before = await shown(page);
    await touchDrag(await touchscreen(page, context), from, to);
    expectFollowed(before, await shown(page), from, to);
  });

  test("a pinch keeps zooming while a finger crosses the buttons over the map", async ({ page, reader, context }) => {
    await openTown(page, reader);
    const touch = await touchscreen(page, context);
    const button = await page.getByRole("button", { name: "Zoom out" }).boundingBox();
    const still = [250, 500];
    const from = [310, 620];
    const to = [button.x + button.width / 2, button.y + button.height / 2];

    const before = await shown(page);
    await touch("touchStart", still, from);
    for (const step of stepsBetween(from, to)) await touch("touchMove", still, step);
    await touch("touchEnd");

    const spread = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const after = await shown(page);
    expect(after.zoom).toBeCloseTo((before.zoom * spread(still, to)) / spread(still, from), 1);
  });

  test("the finger left after a pinch carries on dragging", async ({ page, reader, context }) => {
    await openTown(page, reader);
    const touch = await touchscreen(page, context);
    const lifted = [150, 420];
    const from = [240, 420];
    const to = [240, 620];

    await touch("touchStart", lifted, from);
    await touch("touchEnd", lifted);
    const before = await shown(page);
    for (const step of stepsBetween(from, to)) await touch("touchMove", null, step);
    await touch("touchEnd");
    expectFollowed(before, await shown(page), from, to);
  });

  test("a pinch the phone cuts short leaves the map free to drag", async ({ page, reader, context }) => {
    await openTown(page, reader);
    const touch = await touchscreen(page, context);
    const from = [195, 420];
    const to = [195, 620];

    await touch("touchStart", [150, 420], [240, 420]);
    await touch("touchCancel");
    const before = await shown(page);
    await touchDrag(touch, from, to);
    expectFollowed(before, await shown(page), from, to);
  });
});

test.describe("switching to a phone view after the page has loaded", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("a touch drag still moves the map", async ({ page, reader, context }) => {
    await openTown(page, reader);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setDeviceMetricsOverride", { ...IPHONE, deviceScaleFactor: 3, mobile: true });
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await expect.poll(() => page.evaluate(() => window.__townScene.scale.width)).toBe(IPHONE.width);
    const from = [195, 420];
    const to = [195, 620];

    const before = await shown(page);
    await touchDrag(await touchscreen(page, context), from, to);
    expectFollowed(before, await shown(page), from, to);
  });
});
