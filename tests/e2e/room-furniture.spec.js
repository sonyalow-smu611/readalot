import {
  buy, expect, fromMenu, goToPlace, inventory, mockWeather, pickFromInventory, placeAt, roomReady, skipMoodCheckIn, test,
} from "./fixtures.js";
import { signInPage } from "./supabaseUser.js";

// My Room's furniture is kept in the reader's account: what's in the inventory and where each
// placed piece stands survive a reload, and another device. The test server has no Supabase, so
// it keeps rooms in memory for the run; every test starts and ends with the reader's room empty.
test.use({ viewport: { width: 480, height: 720 } });

const asReader = (reader) => ({ Authorization: `Bearer ${reader.session.access_token}` });

async function emptyRoom(request, reader) {
  await request.put(`/api/rooms/${reader.id}/furniture`, { headers: asReader(reader), data: { pieces: [] } });
}

test.beforeEach(async ({ page, request, reader }) => {
  await emptyRoom(request, reader);
  await skipMoodCheckIn(page);
  await mockWeather(page);
  await page.goto("/house");
  await roomReady(page);
});

test.afterEach(async ({ request, reader }) => {
  await emptyRoom(request, reader);
});

async function reload(page) {
  await page.reload();
  await roomReady(page);
}

const inInventory = (page, name) => inventory(page).getByRole("button", { name: new RegExp(name) });

const placed = (page, name) => page.getByRole("button", { name, exact: true });

// where a placed piece is on the screen, with the room slid to `place` first
async function whereIs(page, name, place) {
  await goToPlace(page, place);
  const box = await placed(page, name).boundingBox();
  return { x: Math.round(box.x), y: Math.round(box.y) };
}

test("a placed piece is in the same place after a reload", async ({ page }) => {
  await buy(page, "Mountain poster");
  await goToPlace(page, "Bed");
  await placeAt(page, "Mountain poster", { x: 1000, y: 220 });
  await expect(placed(page, "Mountain poster")).toHaveCount(1);
  const before = await whereIs(page, "Mountain poster", "Bed");
  await reload(page);
  await expect(placed(page, "Mountain poster")).toHaveCount(1);
  expect(await whereIs(page, "Mountain poster", "Bed")).toEqual(before);
});

test("a piece moved somewhere else is there after a reload", async ({ page }) => {
  await buy(page, "Mountain poster");
  await goToPlace(page, "Bed");
  await placeAt(page, "Mountain poster", { x: 1000, y: 220 });
  const poster = placed(page, "Mountain poster");
  const start = await whereIs(page, "Mountain poster", "Bed");
  await poster.click();
  await poster.getByText("Move", { exact: true }).click();
  const bar = page.getByRole("group", { name: "Moving Mountain poster" });
  for (let step = 0; step < 4; step++) await bar.getByRole("button", { name: "Move left" }).click();
  await bar.getByRole("button", { name: "Done" }).click();
  const moved = await whereIs(page, "Mountain poster", "Bed");
  expect(moved.x).toBeLessThan(start.x);

  await reload(page);
  expect(await whereIs(page, "Mountain poster", "Bed")).toEqual(moved);
});

test("a piece taken down is back in the inventory, not the room, after a reload", async ({ page }) => {
  await buy(page, "Mountain poster");
  await goToPlace(page, "Bed");
  await placeAt(page, "Mountain poster", { x: 1000, y: 220 });
  const poster = placed(page, "Mountain poster");
  await poster.click();
  await poster.getByText("Remove").click();
  await expect(poster).toHaveCount(0);

  await reload(page);
  await expect(placed(page, "Mountain poster")).toHaveCount(0);
  await fromMenu(page, "Inventory");
  await expect(inInventory(page, "Mountain poster")).toHaveCount(1);
});

test("a chair swapped in stays in the nook after a reload, and the one it replaced in the inventory", async ({ page }) => {
  await goToPlace(page, "Chair");
  await buy(page, "Rocking chair");
  await placeAt(page, "Rocking chair", "in the reading nook");
  await buy(page, "Wingback chair");
  await placeAt(page, "Wingback chair", "in the reading nook");
  await expect(placed(page, "Wingback chair")).toHaveCount(1);

  await reload(page);
  await expect(placed(page, "Wingback chair")).toHaveCount(1);
  await expect(placed(page, "Rocking chair")).toHaveCount(0);
  await fromMenu(page, "Inventory");
  await expect(inInventory(page, "Rocking chair")).toHaveCount(1);
});

test("a cat is still in the room after a reload", async ({ page }) => {
  await buy(page, "Calico");
  await placeAt(page, "Calico", "on the floor");
  await expect(placed(page, "Calico")).toHaveCount(1);
  await reload(page);
  await expect(placed(page, "Calico")).toHaveCount(1);
});

test("the room looks the same on another device", async ({ page, browser, reader }) => {
  await buy(page, "Mountain poster");
  await goToPlace(page, "Bed");
  await placeAt(page, "Mountain poster", { x: 1000, y: 220 });
  const here = await whereIs(page, "Mountain poster", "Bed");

  const other = await browser.newPage({ viewport: { width: 480, height: 720 } });
  try {
    await signInPage(other, reader.session);
    await skipMoodCheckIn(other);
    await mockWeather(other);
    await other.goto("/house");
    await roomReady(other);
    await expect(placed(other, "Mountain poster")).toHaveCount(1);
    expect(await whereIs(other, "Mountain poster", "Bed")).toEqual(here);
  } finally {
    await other.close();
  }
});

test.describe("when the furniture can't load or save", () => {
  const FURNITURE = "**/api/rooms/*/furniture";

  test("the Shop and the inventory wait until the furniture has loaded", async ({ page }) => {
    let release;
    const held = new Promise((done) => (release = done));
    await page.route(FURNITURE, async (route) => {
      if (route.request().method() === "GET") await held;
      await route.continue();
    });
    await reload(page);
    await page.getByRole("button", { name: "Room menu" }).click();
    await expect(page.getByRole("button", { name: "Shop", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Inventory", exact: true })).toBeDisabled();

    release();
    await expect(page.getByRole("button", { name: "Shop", exact: true })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Inventory", exact: true })).toBeEnabled();
  });

  test("a change that can't be saved says so, and the next change saves both", async ({ page }) => {
    let failures = 1;
    await page.route(FURNITURE, async (route) => {
      if (route.request().method() === "PUT" && failures > 0) {
        failures -= 1;
        await route.fulfill({ status: 500, json: { error: "down" } });
      } else await route.continue();
    });
    await buy(page, "Mountain poster");
    await expect(page.getByText("Couldn't save your room. Your next change will try again.")).toBeVisible();
    await buy(page, "Moon poster");
    await expect(inInventory(page, "Moon poster")).toHaveCount(1);

    await page.unroute(FURNITURE);
    await reload(page);
    await fromMenu(page, "Inventory");
    await expect(inInventory(page, "Mountain poster")).toHaveCount(1);
    await expect(inInventory(page, "Moon poster")).toHaveCount(1);
  });

  test("a slow save never undoes a change made after it", async ({ page }) => {
    let first = true;
    await page.route(FURNITURE, async (route) => {
      if (route.request().method() === "PUT" && first) {
        first = false;
        await new Promise((done) => setTimeout(done, 1500));
      }
      await route.continue();
    });
    await buy(page, "Mountain poster");
    await buy(page, "Moon poster");
    await expect(inInventory(page, "Moon poster")).toHaveCount(1);
    // the slow first save has landed by now
    await page.waitForTimeout(2500);

    await page.unroute(FURNITURE);
    await reload(page);
    await fromMenu(page, "Inventory");
    await expect(inInventory(page, "Mountain poster")).toHaveCount(1);
    await expect(inInventory(page, "Moon poster")).toHaveCount(1);
  });

  test("a room that can't load its furniture says so, and Try again loads it", async ({ page }) => {
    await buy(page, "Mountain poster");
    await goToPlace(page, "Bed");
    await placeAt(page, "Mountain poster", { x: 1000, y: 220 });
    await expect(placed(page, "Mountain poster")).toHaveCount(1);

    await page.route(FURNITURE, (route) => route.fulfill({ status: 500, json: { error: "down" } }));
    await reload(page);
    const problem = page.getByRole("alert").filter({ hasText: "Couldn't load your furniture." });
    await expect(problem).toBeVisible();
    await expect(placed(page, "Mountain poster")).toHaveCount(0);

    await page.unroute(FURNITURE);
    await problem.getByRole("button", { name: "Try again" }).click();
    await expect(problem).toBeHidden();
    await expect(placed(page, "Mountain poster")).toHaveCount(1);
  });
});

// Visiting: Daniel is one of the sample readers with no demo furniture, and no other test visits
// him. Without Supabase the server takes the account id a token carries, so a token with his id
// furnishes his room.
test.describe("visiting another reader's room", () => {
  const DANIEL = { id: "00000000-0000-4000-8000-000000000207", handle: "daniel.dogears" };
  const part = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const asDaniel = { Authorization: `Bearer ${part({ alg: "none" })}.${part({ sub: DANIEL.id })}.` };
  const furnish = (request, pieces) => request.put(`/api/rooms/${DANIEL.handle}/furniture`, { headers: asDaniel, data: { pieces } });

  test.afterEach(async ({ request }) => {
    await furnish(request, []);
  });

  async function visitDaniel(page) {
    await page.goto(`/people/${DANIEL.handle}/room`);
    await expect(page.getByRole("region", { name: /^Daniel's room/ })).toBeVisible();
    await roomReady(page);
  }

  test("shows the furniture they placed, where they placed it", async ({ page, request }) => {
    const saved = await furnish(request, [{ uid: "d1", id: "poster-mountain", zone: "wall", x: 0.81, at: { x: 1000, y: 220 } }]);
    expect(saved.ok()).toBe(true);
    await visitDaniel(page);
    await expect(placed(page, "Mountain poster")).toHaveCount(1);
  });

  test("leaves my own room as it was", async ({ page, request }) => {
    await buy(page, "Moon poster");
    await goToPlace(page, "Bed");
    await placeAt(page, "Moon poster", { x: 1000, y: 220 });
    const mine = await whereIs(page, "Moon poster", "Bed");
    await furnish(request, [{ uid: "d1", id: "poster-mountain", zone: "wall", x: 0.81, at: { x: 1000, y: 220 } }]);

    await visitDaniel(page);
    await expect(placed(page, "Moon poster")).toHaveCount(0);
    await page.goto("/house");
    await roomReady(page);
    expect(await whereIs(page, "Moon poster", "Bed")).toEqual(mine);
    await expect(placed(page, "Mountain poster")).toHaveCount(0);
  });
});

test("a piece bought in the Shop is still in the inventory after a reload", async ({ page }) => {
  await buy(page, "Mountain poster");
  await expect(inInventory(page, "Mountain poster")).toHaveCount(1);
  await reload(page);
  await fromMenu(page, "Inventory");
  await expect(inInventory(page, "Mountain poster")).toHaveCount(1);
});

// --- Showing where a piece can go ------------------------------------------------------------------

test("placing a reading chair lights up the armchair it takes the place of", async ({ page }) => {
  await buy(page, "Wingback chair");
  await pickFromInventory(page, "Wingback chair");
  await expect(page.getByRole("status")).toContainText("Tap the armchair to put the Wingback chair there.");
  const target = page.locator('[data-target="chair"]');
  await expect(target).toBeVisible();
  await expect(target).toContainText("Put it on the armchair");
  // only the armchair is lit, not the wall or the floor
  await expect(page.locator("[data-target]")).toHaveCount(1);
  // the room menu is out of the way while placing
  await expect(page.getByRole("button", { name: "Room menu" })).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(target).toHaveCount(0);
});

// On a phone the prompt sits beside the Places button, not under it, and fits the screen.
test("the placing prompt stays clear of the Places button on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await buy(page, "Wingback chair");
  await pickFromInventory(page, "Wingback chair");
  const prompt = page.getByRole("status").filter({ hasText: "Tap the armchair" });
  await expect(prompt).toBeVisible();
  const places = await page.getByRole("button", { name: "Places", exact: true }).boundingBox();
  const box = await prompt.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(places.x + places.width);
  expect(box.x + box.width).toBeLessThanOrEqual(375);
});

test("placing wall art lights up the wall, and a shelf piece the small surfaces", async ({ page }) => {
  await buy(page, "Mountain poster");
  await pickFromInventory(page, "Mountain poster");
  await expect(page.locator('[data-target="wall"]')).toBeAttached();
  await expect(page.getByRole("status")).toContainText("Tap anywhere on the lit wall");
  await page.getByRole("button", { name: "Cancel" }).click();

  await buy(page, "Succulent trio");
  await pickFromInventory(page, "Succulent trio");
  for (const surface of ["seat", "side-table", "nightstand"]) await expect(page.locator(`[data-target="${surface}"]`)).toBeAttached();
  await expect(page.locator("[data-target]")).toHaveCount(3);
});

test("with the room menu or the inventory open, the pieces in the room show they can be tapped", async ({ page }) => {
  await buy(page, "Mountain poster");
  await placeAt(page, "Mountain poster", "by the reading chair");
  const poster = placed(page, "Mountain poster");
  await expect(poster).toHaveCount(1);
  // placing it shut the room menu; open again, every piece shows it can be tapped
  const menu = page.getByRole("button", { name: "Room menu" });
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(poster).not.toContainText("✎");
  await menu.click();
  await expect(poster).toContainText("✎");
  // shut, the room is back to normal
  await menu.click();
  await expect(poster).not.toContainText("✎");

  await fromMenu(page, "Inventory");
  await expect(inventory(page)).toContainText("Pieces with a ✎ are already in the room");
  await expect(poster).toContainText("✎");
});
