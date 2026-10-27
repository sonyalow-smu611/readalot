import { expect, goToPlace, test } from "./fixtures.js";

// Furnishing My Room: furniture drawn in the room's own pixel style, bought in the Shop and put
// on glowing spots in the room, the same way as the other decorations.
test.use({ viewport: { width: 480, height: 720 } });

test.beforeEach(async ({ page }) => {
  // today's mood check-in already answered, so it does not open over the room
  await page.addInitScript(() => {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    localStorage.setItem("readalot.moodCheckIn", `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  });
  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "sunny", temperature: 27, weatherCode: 0, isDay: true } })
  );
  await page.goto("/house");
  await expect(page.getByRole("button", { name: /^Bookshelf, \d+ books$/ })).toBeVisible();
  await expect(page.getByText("Opening your shelf")).toBeHidden();
});

// an item in the room menu, opening the menu first if it's shut
async function fromMenu(page, item) {
  const button = page.getByRole("button", { name: item, exact: true });
  if (!(await button.isVisible())) await page.getByRole("button", { name: "Room menu" }).click();
  await button.click();
}

async function openShop(page) {
  await fromMenu(page, "Shop");
  return page.getByRole("region", { name: "Decoration shop" });
}

const group = (shop, name) => shop.getByRole("group", { name });

test("the Shop sells wall art drawn in the room's pixel style", async ({ page }) => {
  const shop = await openShop(page);
  const poster = group(shop, "Wall art").getByRole("button", { name: /Mountain poster/ });
  await expect(poster).toContainText("$25");
  // its picture is the room's own sprite, kept crisp
  const art = poster.locator("img");
  await expect(art).toHaveAttribute("src", /\/room\/strip\/poster-mountain\.png$/);
  await expect(art).toHaveCSS("image-rendering", "pixelated");
  expect(await art.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
});

test("the Shop sells only pixel-art pieces: wall art, chairs, plants, cats, curtains and bedding", async ({ page }) => {
  const shop = await openShop(page);
  const groups = () => shop.getByRole("group").evaluateAll((all) => all.map((g) => g.getAttribute("aria-label")));
  await expect.poll(groups).toEqual(["Wall art", "Reading chairs", "Plants", "Cats", "Curtains", "Bedding"]);
  // the old drawings are gone
  for (const name of ["Clay vase", "Bust", "Low sofa", "Round bag", "Daybed", "Food dish", "Husky", "Cockatiel"]) {
    await expect(shop.getByRole("button", { name: new RegExp(name) })).toHaveCount(0);
  }
  // every card's picture is a room sprite
  await expect(shop.getByRole("button", { name: /\$\d+/ })).toHaveCount(25);
  await expect(shop.locator("img[src*='/room/strip/']")).toHaveCount(25);
});

// The room is wider than the screen: the Places menu slides along to something first.
async function turnTo(page, place) {
  await goToPlace(page, place);
  await page.waitForTimeout(900);
}

async function buy(page, name) {
  const shop = await openShop(page);
  await shop.getByRole("button", { name: new RegExp(name) }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
}

async function pickFromInventory(page, name) {
  await page.getByRole("region", { name: "Inventory" }).getByRole("button", { name: new RegExp(name) }).click();
}

test("wall art is bought, then hung on a glowing spot on the wall", async ({ page }) => {
  await expect(page.getByText("480").first()).toBeVisible();
  await buy(page, "Mountain poster");
  await expect(page.getByText("455").first()).toBeVisible();

  await pickFromInventory(page, "Mountain poster");
  await expect(page.getByRole("status")).toContainText("Tap a glowing spot for the Mountain poster");
  const spots = page.getByRole("button", { name: /^Put Mountain poster on the wall/ });
  await expect(spots).toHaveCount(5);
  // nowhere else: not on the floor, not on the furniture
  await expect(page.getByRole("button", { name: /^Put Mountain poster (on the floor|on the window seat)/ })).toHaveCount(0);

  await turnTo(page, "Chair");
  await page.getByRole("button", { name: "Put Mountain poster on the wall by the reading chair" }).click();
  await expect(page.getByRole("status")).toHaveText(/^Mountain poster is on the wall by the reading chair/);
  await expect(page.getByRole("button", { name: "Mountain poster", exact: true })).toHaveCount(1);
});

async function hang(page, name, spot) {
  await buy(page, name);
  await pickFromInventory(page, name);
  await page.getByRole("button", { name: `Put ${name} on the wall ${spot}` }).click();
  await expect(page.getByRole("status")).toHaveText(new RegExp(`^${name} is on the wall ${spot}`));
}

// The colour the room's canvas has under the middle of a placed piece's button: the piece is
// painted into the room itself, so it's lit (and darkened) with the rest of the room.
function colourUnder(page, name) {
  return page.getByRole("button", { name, exact: true }).evaluate((button) => {
    const canvas = document.querySelector(".strip canvas");
    const b = button.getBoundingClientRect();
    const c = canvas.getBoundingClientRect();
    const x = Math.floor(((b.left + b.width / 2 - c.left) / c.width) * canvas.width);
    const y = Math.floor(((b.top + b.height * 0.3 - c.top) / c.height) * canvas.height);
    const [r, g, bl] = canvas.getContext("2d").getImageData(x, y, 1, 1).data;
    return r + g + bl;
  });
}

test("wall art is painted into the room, darker after dark like the rest of it", async ({ page }) => {
  await turnTo(page, "Chair");
  const wallBefore = await page.locator(".strip canvas").first().evaluate((canvas) => {
    const [r, g, b] = canvas.getContext("2d").getImageData(10, canvas.height - 200, 1, 1).data;
    return r + g + b;
  });
  await hang(page, "Mountain poster", "by the reading chair");
  await page.waitForTimeout(300);
  const day = await colourUnder(page, "Mountain poster");
  // the poster's sky, not the bare wall
  expect(Math.abs(day - wallBefore)).toBeGreaterThan(20);

  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "sunny", temperature: 24, weatherCode: 0, isDay: false } })
  );
  // the room's furniture stays for the visit; the room asks for the weather again when it opens
  await page.getByRole("button", { name: /^Bookshelf, \d+ books$/ }).click({ position: { x: 8, y: 8 } });
  await page.getByRole("link", { name: "Back to room" }).click();
  await expect(page.getByRole("button", { name: "Mountain poster", exact: true })).toBeAttached();
  await expect(page.getByRole("img", { name: /night/ })).toBeAttached();
  await page.waitForTimeout(300);
  expect(await colourUnder(page, "Mountain poster")).toBeLessThan(day - 60);
});

test("wall art never covers the window, the clock, the corkboard or the bookshelf", async ({ page }) => {
  for (const spot of ["by the window", "by the reading chair", "above the corkboard", "over the nightstand", "by the mirror"]) {
    await hang(page, "Mountain poster", spot);
  }
  const posters = await page.getByRole("button", { name: "Mountain poster", exact: true }).evaluateAll((buttons) => buttons.map((b) => b.getBoundingClientRect().toJSON()));
  expect(posters).toHaveLength(5);
  const parts = await page
    .locator(".strip__stage")
    .getByRole("button", { name: /^(Window view|Quote of the day|Bookshelf, \d+ books|Singapore time)/ })
    .evaluateAll((buttons) => buttons.map((b) => ({ name: b.getAttribute("aria-label"), ...b.getBoundingClientRect().toJSON() })));
  expect(parts.length).toBeGreaterThanOrEqual(2);
  for (const poster of posters) {
    for (const part of parts) {
      const apart = poster.right <= part.left || part.right <= poster.left || poster.bottom <= part.top || part.bottom <= poster.top;
      expect(apart, `a poster covers ${part.name}`).toBe(true);
    }
  }
});

test("wall art can be taken down and hung somewhere else", async ({ page }) => {
  await turnTo(page, "Chair");
  await hang(page, "Mountain poster", "by the reading chair");
  const poster = page.getByRole("button", { name: "Mountain poster", exact: true });
  await poster.click();
  await poster.getByText("Remove").click();
  await expect(page.getByRole("status")).toHaveText("Mountain poster is back in your inventory");
  await expect(poster).toHaveCount(0);

  await fromMenu(page, "Inventory");
  await pickFromInventory(page, "Mountain poster");
  await turnTo(page, "Bed");
  await page.getByRole("button", { name: "Put Mountain poster on the wall by the mirror" }).click();
  await expect(page.getByRole("status")).toHaveText(/^Mountain poster is on the wall by the mirror/);
  await expect(poster).toHaveCount(1);
});

test("furniture in the room is still there after a look at My Shelf", async ({ page }) => {
  await turnTo(page, "Chair");
  await hang(page, "Mountain poster", "by the reading chair");
  await page.getByRole("button", { name: /^Bookshelf, \d+ books$/ }).click({ position: { x: 8, y: 8 } });
  await expect(page).toHaveURL(/\/house\/shelf$/);
  await page.getByRole("link", { name: "Back to room" }).click();
  await expect(page.getByRole("button", { name: "Mountain poster", exact: true })).toHaveCount(1);
});

// every card in a Shop group, as "name $price"
async function cards(shop, name) {
  return group(shop, name).getByRole("button").evaluateAll((buttons) =>
    buttons.map((b) => `${b.querySelector(".dock-card__name").textContent.trim()} ${b.querySelector(".dock-card__price").textContent.trim()}`)
  );
}

async function spritesLoaded(shop, name) {
  return group(shop, name).locator("img").evaluateAll((images) => images.map((img) => img.complete && img.naturalWidth > 0));
}

test("the Shop has five pieces of wall art: three posters and two picture frames", async ({ page }) => {
  const shop = await openShop(page);
  expect(await cards(shop, "Wall art")).toEqual([
    "Mountain poster $25",
    "Moon poster $25",
    "Book club poster $25",
    "Botanical print $40",
    "Gold photo frame $45",
  ]);
  await expect.poll(() => spritesLoaded(shop, "Wall art")).toEqual([true, true, true, true, true]);
});

test("two pieces of wall art hang at once, and a taken spot stops glowing", async ({ page }) => {
  await turnTo(page, "Chair");
  await hang(page, "Botanical print", "by the reading chair");
  await buy(page, "Gold photo frame");
  await pickFromInventory(page, "Gold photo frame");
  await expect(page.getByRole("button", { name: /^Put Gold photo frame on the wall/ })).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Put Gold photo frame on the wall by the reading chair" })).toHaveCount(0);
  await page.getByRole("button", { name: "Put Gold photo frame on the wall by the window" }).click();
  await expect(page.getByRole("button", { name: "Botanical print", exact: true })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Gold photo frame", exact: true })).toHaveCount(1);
});

// --- Plants -----------------------------------------------------------------------------------

test("the Shop has three plants", async ({ page }) => {
  const shop = await openShop(page);
  expect(await cards(shop, "Plants")).toEqual(["Monstera $60", "Fiddle-leaf fig $55", "Succulent trio $30"]);
  await expect.poll(() => spritesLoaded(shop, "Plants")).toEqual([true, true, true]);
});

test("a big plant stands on the floor, and the succulents on a small surface", async ({ page }) => {
  await buy(page, "Monstera");
  await pickFromInventory(page, "Monstera");
  const monsteraSpots = page.getByRole("button", { name: /^Put Monstera / });
  await expect(monsteraSpots.first()).toBeAttached();
  for (const name of await monsteraSpots.evaluateAll((spots) => spots.map((s) => s.getAttribute("aria-label")))) {
    expect(name).toBe("Put Monstera on the floor");
  }
  await turnTo(page, "Chair");
  await monsteraSpots.locator("visible=true").first().click();
  await expect(page.getByRole("status")).toHaveText(/^Monstera is on the floor/);
  await expect(page.getByRole("button", { name: "Monstera", exact: true })).toHaveCount(1);

  await buy(page, "Succulent trio");
  await pickFromInventory(page, "Succulent trio");
  const names = await page.getByRole("button", { name: /^Put Succulent trio / }).evaluateAll((spots) => spots.map((s) => s.getAttribute("aria-label")));
  expect(new Set(names)).toEqual(new Set(["Put Succulent trio on the window seat", "Put Succulent trio on the side table", "Put Succulent trio on the nightstand"]));
  await page.getByRole("button", { name: "Put Succulent trio on the side table" }).click();
  await expect(page.getByRole("status")).toHaveText(/^Succulent trio is on the side table/);
  await expect(page.getByRole("button", { name: "Succulent trio", exact: true })).toHaveCount(1);
});

// --- Reading chairs ---------------------------------------------------------------------------

// What the room has drawn in the reading nook, where the armchair stands: a few of the canvas's
// pixels across the chair's seat and back, so a different chair there reads differently.
function nook(page) {
  return page.locator(".strip canvas").first().evaluate((canvas) => {
    const ctx = canvas.getContext("2d");
    // where the room's floor is on the canvas, from the bookshelf, whose top is 272 art px above it
    const shelf = [...document.querySelectorAll("button")].find((b) => /^Bookshelf, \d+ books$/.test(b.getAttribute("aria-label") ?? ""));
    const c = canvas.getBoundingClientRect();
    const floor = Math.round(((shelf.getBoundingClientRect().top - c.top) / c.height) * canvas.height) + 272;
    const picks = [];
    for (const [x, up] of [[310, 30], [330, 60], [350, 45], [370, 70], [390, 30], [340, 95]]) {
      picks.push(...ctx.getImageData(x, floor - up, 1, 1).data.slice(0, 3));
    }
    return picks.join(",");
  });
}

test("the Shop has three reading chairs", async ({ page }) => {
  const shop = await openShop(page);
  expect(await cards(shop, "Reading chairs")).toEqual(["Wingback chair $140", "Rocking chair $120", "Papasan chair $160"]);
  await expect.poll(() => spritesLoaded(shop, "Reading chairs")).toEqual([true, true, true]);
});

test("a reading chair takes the armchair's place, and the book on the table still opens", async ({ page }) => {
  await turnTo(page, "Chair");
  const armchair = await nook(page);

  await buy(page, "Rocking chair");
  await pickFromInventory(page, "Rocking chair");
  // a chair goes in the reading nook and nowhere else
  const spots = page.getByRole("button", { name: /^Put Rocking chair / });
  await expect(spots).toHaveCount(1);
  await spots.click();
  await expect(page.getByRole("status")).toHaveText(/^Rocking chair is in the reading nook/);
  await expect(page.getByRole("button", { name: "Rocking chair", exact: true })).toHaveCount(1);
  await expect.poll(() => nook(page)).not.toBe(armchair);

  await page.getByRole("button", { name: /Currently reading Norwegian Wood/ }).click();
  await expect(page.getByRole("dialog", { name: "Currently reading" })).toBeVisible();
});

test("a second chair swaps the first back to the inventory; putting it away brings back the armchair", async ({ page }) => {
  await turnTo(page, "Chair");
  const armchair = await nook(page);
  await buy(page, "Rocking chair");
  await pickFromInventory(page, "Rocking chair");
  await page.getByRole("button", { name: "Put Rocking chair in the reading nook" }).click();
  await expect.poll(() => nook(page)).not.toBe(armchair);
  const rocking = await nook(page);

  await buy(page, "Wingback chair");
  await pickFromInventory(page, "Wingback chair");
  await page.getByRole("button", { name: "Put Wingback chair in the reading nook" }).click();
  await expect(page.getByRole("button", { name: "Wingback chair", exact: true })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Rocking chair", exact: true })).toHaveCount(0);
  await expect.poll(() => nook(page)).not.toBe(rocking);
  await fromMenu(page, "Inventory");
  await expect(page.getByRole("region", { name: "Inventory" }).getByRole("button", { name: /Rocking chair/ })).toHaveCount(1);
  await page.getByRole("region", { name: "Inventory" }).getByRole("button", { name: "Close" }).click();

  const wingback = page.getByRole("button", { name: "Wingback chair", exact: true });
  await wingback.click();
  await wingback.getByText("Remove").click();
  await expect.poll(() => nook(page)).toBe(armchair);
});

// --- Cats -------------------------------------------------------------------------------------

async function adopt(page, name) {
  await buy(page, name);
  await pickFromInventory(page, name);
  await page.getByRole("button", { name: `Put ${name} on the floor` }).locator("visible=true").first().click();
  await expect(page.getByRole("button", { name, exact: true })).toHaveCount(1);
}

// where a cat is along the room, in art pixels from the left wall
function whereIs(page, name) {
  return page.getByRole("button", { name, exact: true }).evaluate((button) => {
    const canvas = document.querySelector(".strip canvas").getBoundingClientRect();
    const box = button.getBoundingClientRect();
    return { x: ((box.left + box.width / 2 - canvas.left) / canvas.width) * 1240, bottom: box.bottom };
  });
}

test("the Shop's pets are the three pixel cats", async ({ page }) => {
  const shop = await openShop(page);
  expect(await cards(shop, "Cats")).toEqual(["Ginger tabby $80", "Black cat $85", "Calico $90"]);
  await expect.poll(() => spritesLoaded(shop, "Cats")).toEqual([true, true, true]);
  for (const gone of ["Siamese", "Maine Coon", "Persian", "Bengal", "British Shorthair"]) {
    await expect(shop.getByRole("button", { name: new RegExp(gone) })).toHaveCount(0);
  }
  await expect(group(shop, "Dogs")).toHaveCount(0);
  await expect(group(shop, "Birds")).toHaveCount(0);
});

test("cats wander about the room on their own, staying inside it", async ({ page }) => {
  await adopt(page, "Ginger tabby");
  await adopt(page, "Calico");
  const floor = (await whereIs(page, "Ginger tabby")).bottom;
  const start = { ginger: (await whereIs(page, "Ginger tabby")).x, calico: (await whereIs(page, "Calico")).x };

  await expect.poll(async () => Math.abs((await whereIs(page, "Ginger tabby")).x - start.ginger), { timeout: 15000 }).toBeGreaterThan(8);
  await expect.poll(async () => Math.abs((await whereIs(page, "Calico")).x - start.calico), { timeout: 15000 }).toBeGreaterThan(8);
  for (let n = 0; n < 6; n++) {
    for (const name of ["Ginger tabby", "Calico"]) {
      const { x, bottom } = await whereIs(page, name);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(1240);
      // on the floor, all the way along
      expect(Math.abs(bottom - floor)).toBeLessThan(2);
    }
    await page.waitForTimeout(400);
  }
});

test("with reduced motion, cats stay where they are", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await adopt(page, "Black cat");
  const start = (await whereIs(page, "Black cat")).x;
  await page.waitForTimeout(4000);
  expect((await whereIs(page, "Black cat")).x).toBe(start);
});

// how bright the cats are, on average over the pixels they cover
function catBrightness(page) {
  return page.locator(".strip__pets").evaluate((canvas) => {
    const { data } = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 200) continue;
      sum += data[i] + data[i + 1] + data[i + 2];
      count += 1;
    }
    return count ? sum / count : null;
  });
}

test("cats are drawn in the room's pixels, darker after dark", async ({ page }) => {
  await adopt(page, "Calico");
  await expect.poll(() => catBrightness(page)).not.toBeNull();
  const day = await catBrightness(page);

  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "sunny", temperature: 24, weatherCode: 0, isDay: false } })
  );
  await page.getByRole("button", { name: /^Bookshelf, \d+ books$/ }).click({ position: { x: 8, y: 8 } });
  await page.getByRole("link", { name: "Back to room" }).click();
  await expect(page.getByRole("img", { name: /night/ })).toBeAttached();
  await expect.poll(() => catBrightness(page)).toBeLessThan(day - 60);
});
