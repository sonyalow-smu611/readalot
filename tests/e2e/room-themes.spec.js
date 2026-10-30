import {
  artColour, brightness, buy, expect, fromMenu, goToPlace, inventory, mockWeather, openShop, pickFromInventory,
  roomReady, skipMoodCheckIn, test,
} from "./fixtures.js";

// Every house has its own look: wall and floor colours, curtains, bedding, lamps and rug. The
// reader can change their own curtains and bedding from the Shop, and switch the lamps. What
// changes is only in the room's picture, so these checks read its pixels at known art positions.
test.use({ viewport: { width: 480, height: 720 } });

test.beforeEach(async ({ page }) => {
  await skipMoodCheckIn(page);
  await mockWeather(page);
});

const ROOMS = {
  mine: "/house",
  emma: "/people/emma.reads/room",
  ayaan: "/people/ayaan.pages/room",
  sofia: "/people/sofia.shelves/room",
  noah: "/people/noah.bookmarks/room",
};

async function open(page, room) {
  await page.goto(ROOMS[room]);
  await roomReady(page);
}

// a few pixels along a row, as one string: enough to tell one fabric or pattern from another
async function stripe(page, [x, y], count = 12) {
  const parts = [];
  for (let k = 0; k < count; k += 1) parts.push(await artColour(page, x + k * 2, y));
  return parts.join("|");
}

// Where to look, in art pixels: bare wall above the bookshelf (no wall spot there), the floor in
// front of it, inside the left curtain, across the quilt on the bed, in each lamp's shade, and on
// the wall beside the floor lamp (inside its pool of light at night).
const WALL = [600, 80];
const FLOOR = [620, 414];
const CURTAIN = [40, 200];
const QUILT = [966, 362];
const FLOOR_SHADE = [281, 262];
const TABLE_SHADE = [879, 330];
const BESIDE_LAMP = [315, 245];

test.describe("themes", () => {
  test("every house has its own wall and floor colours", async ({ page }) => {
    const walls = new Set();
    const floors = new Set();
    for (const room of Object.keys(ROOMS)) {
      await open(page, room);
      walls.add(await artColour(page, ...WALL));
      floors.add(await artColour(page, ...FLOOR));
    }
    expect(walls.size).toBe(5);
    expect(floors.size).toBeGreaterThanOrEqual(4);
  });

  test("every house has its own curtains and bedding", async ({ page }) => {
    const curtains = new Set();
    const quilts = new Set();
    for (const room of Object.keys(ROOMS)) {
      await open(page, room);
      curtains.add(await stripe(page, CURTAIN, 6));
      quilts.add(await stripe(page, QUILT));
    }
    expect(curtains.size).toBe(5);
    expect(quilts.size).toBe(5);
  });

  test("a themed wall still darkens at night", async ({ page }) => {
    await open(page, "ayaan");
    const day = brightness(await artColour(page, ...WALL));
    await mockWeather(page, { isDay: false });
    await open(page, "ayaan");
    await expect(page.getByRole("img", { name: /night/ }).first()).toBeAttached();
    await expect.poll(async () => brightness(await artColour(page, ...WALL))).toBeLessThan(day - 60);
  });
});

// Curtains and bedding work the same way: one set at a time on one spot, swapping with the set
// there, and taking it away brings back the room's own. One journey, run for each.
test.describe("curtains and bedding from the Shop", () => {
  for (const kind of [
    { group: "Curtains", picture: /\/room\/strip\/curtains-/, place: "Window", look: CURTAIN, size: 6,
      first: "Rose curtains", second: "Lavender curtains", spot: "at the window", is: "are" },
    { group: "Bedding", picture: /\/room\/strip\/bedding-/, place: "Bed", look: QUILT, size: 12,
      first: "Gingham bedding", second: "Tartan bedding", spot: "on the bed", is: "is" },
  ]) {
    test(`${kind.group.toLowerCase()}: bought, put ${kind.spot}, swapped, and taken away again`, async ({ page }) => {
      const looks = () => stripe(page, kind.look, kind.size);
      await open(page, "mine");
      const shop = await openShop(page);
      const group = shop.getByRole("group", { name: kind.group });
      await expect.poll(() => group.getByRole("button").count()).toBeGreaterThanOrEqual(5);
      await expect(group.locator("img").first()).toHaveAttribute("src", kind.picture);
      await fromMenu(page, "Shop");

      await goToPlace(page, kind.place);
      const own = await looks();

      // the first set goes on its glowing spot and changes how it looks
      await buy(page, kind.first);
      await pickFromInventory(page, kind.first);
      await expect(page.getByRole("status")).toContainText(`Tap a glowing spot for the ${kind.first}`);
      await page.getByRole("button", { name: `Put ${kind.first} ${kind.spot}` }).click();
      await expect(page.getByRole("status")).toHaveText(new RegExp(`^${kind.first} ${kind.is} ${kind.spot}`));
      await expect.poll(looks).not.toBe(own);
      const first = await looks();

      // a second set takes its place, and the first goes back to the inventory
      await buy(page, kind.second);
      await pickFromInventory(page, kind.second);
      await page.getByRole("button", { name: `Put ${kind.second} ${kind.spot}` }).click();
      await expect.poll(looks).not.toBe(first);
      await fromMenu(page, "Inventory");
      await expect(inventory(page).getByRole("button", { name: new RegExp(kind.first) })).toHaveCount(1);
      await fromMenu(page, "Inventory");

      // taking it away brings back the room's own
      const placed = page.getByRole("button", { name: kind.second, exact: true });
      await placed.click();
      await placed.getByText("Remove").click();
      await expect(page.getByRole("status")).toHaveText(`${kind.second} ${kind.is} back in your inventory`);
      await expect.poll(looks).toBe(own);
    });
  }
});

test.describe("lamps", () => {
  test("tapping a lamp switches it off, and on again", async ({ page }) => {
    await open(page, "mine");
    await goToPlace(page, "Chair");
    const lamp = page.getByRole("button", { name: "Floor lamp" });
    await expect(lamp).toHaveAttribute("aria-pressed", "true");
    const on = await artColour(page, ...FLOOR_SHADE);

    await lamp.click();
    await expect(lamp).toHaveAttribute("aria-pressed", "false");
    await expect.poll(() => artColour(page, ...FLOOR_SHADE)).not.toBe(on);
    await lamp.click();
    await expect(lamp).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => artColour(page, ...FLOOR_SHADE)).toBe(on);

    await goToPlace(page, "Bed");
    const table = page.getByRole("button", { name: "Table lamp" });
    await expect(table).toHaveAttribute("aria-pressed", "true");
    const tableOn = await artColour(page, ...TABLE_SHADE);
    await table.click();
    await expect(table).toHaveAttribute("aria-pressed", "false");
    await expect.poll(() => artColour(page, ...TABLE_SHADE)).not.toBe(tableOn);
    // switching a lamp opens nothing
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("at night a switched-off lamp leaves its corner dark", async ({ page }) => {
    await mockWeather(page, { isDay: false });
    await open(page, "mine");
    await goToPlace(page, "Chair");
    const lit = brightness(await artColour(page, ...BESIDE_LAMP));
    await page.getByRole("button", { name: "Floor lamp" }).click();
    await expect.poll(async () => brightness(await artColour(page, ...BESIDE_LAMP))).toBeLessThan(lit - 30);
  });

  test("lamps stay as they were after a look at My Shelf", async ({ page }) => {
    await open(page, "mine");
    await goToPlace(page, "Chair");
    await page.getByRole("button", { name: "Floor lamp" }).click();
    await page.getByRole("button", { name: /^Bookshelf, \d+ books$/ }).click({ position: { x: 8, y: 8 } });
    await page.getByRole("link", { name: "Back to room" }).click();
    await expect(page.getByRole("button", { name: "Floor lamp" })).toHaveAttribute("aria-pressed", "false");
  });
});
