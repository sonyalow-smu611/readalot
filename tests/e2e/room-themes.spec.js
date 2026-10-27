import { expect, goToPlace, test } from "./fixtures.js";

// Every house has its own look: wall and floor colours, curtains, bedding, lamps and rug. The
// reader can change their own curtains and bedding from the Shop, and switch the lamps.
test.use({ viewport: { width: 480, height: 720 } });

let isDay = true;
test.beforeEach(async ({ page }) => {
  isDay = true;
  // today's mood check-in already answered, so it does not open over My Room
  await page.addInitScript(() => {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    localStorage.setItem("readalot.moodCheckIn", `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  });
  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "sunny", temperature: 27, weatherCode: 0, isDay } })
  );
});

const ROOMS = {
  mine: "/house",
  emma: "/people/reader-emma/room",
  ayaan: "/people/reader-ayaan/room",
  sofia: "/people/reader-sofia/room",
  noah: "/people/reader-noah/room",
};

async function open(page, room) {
  await page.goto(ROOMS[room]);
  await expect(page.getByRole("button", { name: /^Bookshelf, \d+ books?$/ })).toBeVisible();
  await expect(page.getByText("Opening your shelf")).toBeHidden();
  await page.waitForTimeout(300);
}

// The colour of the room's canvas at an art pixel (x, y), as "r,g,b". The clock's top (art y 166)
// finds the rows; the room must have been slid so that x is in the canvas (it always is: the
// canvas is the whole room).
function colourAt(page, x, y) {
  return page.getByRole("img", { name: /^Singapore time/ }).evaluate(
    (clock, [ax, ay]) => {
      const canvas = document.querySelector(".strip canvas");
      const c = canvas.getBoundingClientRect();
      const unit = c.width / canvas.width;
      const row = Math.round((clock.getBoundingClientRect().top - c.top) / unit + (ay - 166));
      return [...canvas.getContext("2d").getImageData(ax, row, 1, 1).data].slice(0, 3).join(",");
    },
    [x, y]
  );
}

const brightness = (rgb) => rgb.split(",").map(Number).reduce((a, b) => a + b, 0);

// bare wall above the bookshelf (no wall spot there), and the floor in front of the bookshelf
const WALL = [600, 80];
const FLOOR = [620, 414];

test("every house has its own wall and floor colours", async ({ page }) => {
  const walls = new Set();
  const floors = new Set();
  for (const room of Object.keys(ROOMS)) {
    await open(page, room);
    walls.add(await colourAt(page, ...WALL));
    floors.add(await colourAt(page, ...FLOOR));
  }
  expect(walls.size).toBe(5);
  expect(floors.size).toBeGreaterThanOrEqual(4);
});

// a few pixels along a row, as one string: enough to tell one fabric or pattern from another
async function stripe(page, x, y, count = 12) {
  const parts = [];
  for (let k = 0; k < count; k += 1) parts.push(await colourAt(page, x + k * 2, y));
  return parts.join("|");
}

// inside the left curtain, and across the quilt on the bed
const CURTAIN = [40, 200];
const QUILT = [966, 362];

test("every house has its own curtains and bedding", async ({ page }) => {
  const curtains = new Set();
  const quilts = new Set();
  for (const room of Object.keys(ROOMS)) {
    await open(page, room);
    curtains.add(await stripe(page, ...CURTAIN, 6));
    quilts.add(await stripe(page, ...QUILT));
  }
  expect(curtains.size).toBe(5);
  expect(quilts.size).toBe(5);
});

// --- Curtains and bedding from the Shop ---------------------------------------------------------

async function fromMenu(page, item) {
  const button = page.getByRole("button", { name: item, exact: true });
  if (!(await button.isVisible())) await page.getByRole("button", { name: "Room menu" }).click();
  await button.click();
}

async function buy(page, name) {
  await fromMenu(page, "Shop");
  await page.getByRole("region", { name: "Decoration shop" }).getByRole("button", { name: new RegExp(name) }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
}

const inventory = (page) => page.getByRole("region", { name: "Inventory" });

test("the Shop sells curtains, which hang at the window and swap with the ones there", async ({ page }) => {
  await open(page, "mine");
  await fromMenu(page, "Shop");
  const curtains = page.getByRole("region", { name: "Decoration shop" }).getByRole("group", { name: "Curtains" });
  await expect.poll(() => curtains.getByRole("button").count()).toBeGreaterThanOrEqual(5);
  await expect(curtains.locator("img").first()).toHaveAttribute("src", /\/room\/strip\/curtains-/);
  await fromMenu(page, "Shop");

  await goToPlace(page, "Window");
  const own = await stripe(page, ...CURTAIN, 6);

  await buy(page, "Rose curtains");
  await inventory(page).getByRole("button", { name: /Rose curtains/ }).click();
  await expect(page.getByRole("status")).toContainText("Tap a glowing spot for the Rose curtains");
  await page.getByRole("button", { name: "Put Rose curtains at the window" }).click();
  await expect(page.getByRole("status")).toHaveText(/^Rose curtains are at the window/);
  await expect.poll(() => stripe(page, ...CURTAIN, 6)).not.toBe(own);
  const rose = await stripe(page, ...CURTAIN, 6);

  // a second pair takes their place, and the first goes back to the inventory
  await buy(page, "Lavender curtains");
  await inventory(page).getByRole("button", { name: /Lavender curtains/ }).click();
  await page.getByRole("button", { name: "Put Lavender curtains at the window" }).click();
  await expect.poll(() => stripe(page, ...CURTAIN, 6)).not.toBe(rose);
  await fromMenu(page, "Inventory");
  await expect(inventory(page).getByRole("button", { name: /Rose curtains/ })).toHaveCount(1);
  await fromMenu(page, "Inventory");

  // taking them down brings back the room's own
  const hung = page.getByRole("button", { name: "Lavender curtains", exact: true });
  await hung.click();
  await hung.getByText("Remove").click();
  await expect(page.getByRole("status")).toHaveText("Lavender curtains are back in your inventory");
  await expect.poll(() => stripe(page, ...CURTAIN, 6)).toBe(own);
});

test("the Shop sells bedding, which goes on the bed and swaps with the bedding there", async ({ page }) => {
  await open(page, "mine");
  await fromMenu(page, "Shop");
  const bedding = page.getByRole("region", { name: "Decoration shop" }).getByRole("group", { name: "Bedding" });
  await expect.poll(() => bedding.getByRole("button").count()).toBeGreaterThanOrEqual(5);
  await expect(bedding.locator("img").first()).toHaveAttribute("src", /\/room\/strip\/bedding-/);
  await fromMenu(page, "Shop");

  await goToPlace(page, "Bed");
  const own = await stripe(page, ...QUILT);

  await buy(page, "Gingham bedding");
  await inventory(page).getByRole("button", { name: /Gingham bedding/ }).click();
  await page.getByRole("button", { name: "Put Gingham bedding on the bed" }).click();
  await expect(page.getByRole("status")).toHaveText(/^Gingham bedding is on the bed/);
  await expect.poll(() => stripe(page, ...QUILT)).not.toBe(own);
  const gingham = await stripe(page, ...QUILT);

  await buy(page, "Tartan bedding");
  await inventory(page).getByRole("button", { name: /Tartan bedding/ }).click();
  await page.getByRole("button", { name: "Put Tartan bedding on the bed" }).click();
  await expect.poll(() => stripe(page, ...QUILT)).not.toBe(gingham);
  await fromMenu(page, "Inventory");
  await expect(inventory(page).getByRole("button", { name: /Gingham bedding/ })).toHaveCount(1);
  await fromMenu(page, "Inventory");

  const made = page.getByRole("button", { name: "Tartan bedding", exact: true });
  await made.click();
  await made.getByText("Remove").click();
  await expect(page.getByRole("status")).toHaveText("Tartan bedding is back in your inventory");
  await expect.poll(() => stripe(page, ...QUILT)).toBe(own);
});

// --- Lamps ----------------------------------------------------------------------------------------

// in the floor lamp's shade, and on the wall beside it (inside its pool of light at night)
const FLOOR_SHADE = [281, 262];
const BESIDE_LAMP = [315, 245];
// in the table lamp's shade
const TABLE_SHADE = [879, 330];

test("tapping a lamp switches it off, and on again", async ({ page }) => {
  await open(page, "mine");
  await goToPlace(page, "Chair");
  const lamp = page.getByRole("button", { name: "Floor lamp" });
  await expect(lamp).toHaveAttribute("aria-pressed", "true");
  const on = await colourAt(page, ...FLOOR_SHADE);

  await lamp.click();
  await expect(lamp).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => colourAt(page, ...FLOOR_SHADE)).not.toBe(on);
  await lamp.click();
  await expect(lamp).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => colourAt(page, ...FLOOR_SHADE)).toBe(on);

  await goToPlace(page, "Bed");
  const table = page.getByRole("button", { name: "Table lamp" });
  await expect(table).toHaveAttribute("aria-pressed", "true");
  const tableOn = await colourAt(page, ...TABLE_SHADE);
  await table.click();
  await expect(table).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => colourAt(page, ...TABLE_SHADE)).not.toBe(tableOn);
  // nothing else opened
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("at night a switched-off lamp leaves its corner dark", async ({ page }) => {
  isDay = false;
  await open(page, "mine");
  await goToPlace(page, "Chair");
  const lit = brightness(await colourAt(page, ...BESIDE_LAMP));
  await page.getByRole("button", { name: "Floor lamp" }).click();
  await expect.poll(async () => brightness(await colourAt(page, ...BESIDE_LAMP))).toBeLessThan(lit - 30);
});

test("lamps stay as they were after a look at My Shelf", async ({ page }) => {
  await open(page, "mine");
  await goToPlace(page, "Chair");
  await page.getByRole("button", { name: "Floor lamp" }).click();
  await page.getByRole("button", { name: /^Bookshelf, \d+ books$/ }).click({ position: { x: 8, y: 8 } });
  await page.getByRole("link", { name: "Back to room" }).click();
  await expect(page.getByRole("button", { name: "Floor lamp" })).toHaveAttribute("aria-pressed", "false");
});

test("a themed wall still darkens at night", async ({ page }) => {
  await open(page, "ayaan");
  const day = brightness(await colourAt(page, ...WALL));
  isDay = false;
  await page.reload();
  await expect(page.getByRole("img", { name: /night/ }).first()).toBeAttached();
  await open(page, "ayaan");
  expect(brightness(await colourAt(page, ...WALL))).toBeLessThan(day - 60);
});
