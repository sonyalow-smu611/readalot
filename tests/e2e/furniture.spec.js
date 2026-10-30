import {
  buy, expect, fromMenu, goToPlace, inventory, mockWeather, nextPaint, openShop, pickFromInventory, roomCanvas,
  roomReady, skipMoodCheckIn, test,
} from "./fixtures.js";

// Furnishing My Room: pieces drawn in the room's own pixel style, bought in the Shop and put on
// glowing spots in the room. Placed pieces are painted into the room's picture, so some checks
// read its pixels; everything else goes through labelled buttons.
test.use({ viewport: { width: 480, height: 720 } });

test.beforeEach(async ({ page }) => {
  await skipMoodCheckIn(page);
  await mockWeather(page);
  await page.goto("/house");
  await roomReady(page);
});

const group = (shop, name) => shop.getByRole("group", { name });
const placed = (page, name) => page.getByRole("button", { name, exact: true });

// every card in a Shop group, as "name $price"
async function cards(shop, name) {
  const all = group(shop, name).getByRole("button");
  const names = await all.getByTestId("card-name").allTextContents();
  const prices = await all.getByTestId("card-price").allTextContents();
  return names.map((text, k) => `${text.trim()} ${prices[k].trim()}`);
}

// whether each picture in a Shop group has loaded
function spritesLoaded(shop, name) {
  return group(shop, name).locator("img").evaluateAll((images) => images.map((img) => img.complete && img.naturalWidth > 0));
}

// Leaving the room and coming back at night: the room's furniture stays for the visit, and the room
// asks for the weather again when it opens.
async function backAtNight(page) {
  await mockWeather(page, { temperature: 24, isDay: false });
  await page.getByRole("button", { name: /^Bookshelf, \d+ books$/ }).click({ position: { x: 8, y: 8 } });
  await page.getByRole("link", { name: "Back to room" }).click();
  await expect(page.getByRole("img", { name: /night/ })).toBeAttached();
  await roomReady(page);
}

test.describe("the Shop", () => {
  test("sells only pixel-art pieces: wall art, chairs, plants, cats, curtains and bedding", async ({ page }) => {
    const shop = await openShop(page);
    const groups = () => shop.getByRole("group").evaluateAll((all) => all.map((g) => g.getAttribute("aria-label")));
    await expect.poll(groups).toEqual(["Wall art", "Reading chairs", "Plants", "Cats", "Curtains", "Bedding"]);
    // the old vector drawings are gone
    for (const name of ["Clay vase", "Bust", "Low sofa", "Round bag", "Daybed", "Food dish", "Husky", "Cockatiel"]) {
      await expect(shop.getByRole("button", { name: new RegExp(name) })).toHaveCount(0);
    }
    // every card's picture is one of the room's sprites
    await expect(shop.getByRole("button", { name: /\$\d+/ })).toHaveCount(25);
    await expect(shop.locator("img[src*='/room/strip/']")).toHaveCount(25);
  });

  test("shows each piece as the room's own sprite, kept crisp", async ({ page }) => {
    const shop = await openShop(page);
    const poster = group(shop, "Wall art").getByRole("button", { name: /Mountain poster/ });
    await expect(poster).toContainText("$25");
    const art = poster.locator("img");
    await expect(art).toHaveAttribute("src", /\/room\/strip\/poster-mountain\.png$/);
    await expect(art).toHaveCSS("image-rendering", "pixelated");
    await expect.poll(() => art.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  });

  for (const [name, pieces] of [
    ["Wall art", ["Mountain poster $25", "Moon poster $25", "Book club poster $25", "Botanical print $40", "Gold photo frame $45"]],
    ["Plants", ["Monstera $60", "Fiddle-leaf fig $55", "Succulent trio $30"]],
    ["Reading chairs", ["Wingback chair $140", "Rocking chair $120", "Papasan chair $160"]],
    ["Cats", ["Ginger tabby $80", "Black cat $85", "Calico $90"]],
  ]) {
    test(`lists its ${name.toLowerCase()} with their prices and pictures`, async ({ page }) => {
      const shop = await openShop(page);
      await expect.poll(() => cards(shop, name)).toEqual(pieces);
      await expect.poll(() => spritesLoaded(shop, name)).toEqual(pieces.map(() => true));
    });
  }
});

test.describe("wall art", () => {
  async function hang(page, name, spot) {
    await buy(page, name);
    await pickFromInventory(page, name);
    await page.getByRole("button", { name: `Put ${name} on the wall ${spot}` }).click();
    await expect(page.getByRole("status")).toHaveText(new RegExp(`^${name} is on the wall ${spot}`));
  }

  // The brightness of the room's picture under the upper middle of a placed piece's button: the
  // piece is painted into the room, so it's lit (and darkened) with the rest of it.
  async function brightnessUnder(page, name) {
    const canvas = await roomCanvas(page).elementHandle();
    return placed(page, name).evaluate((button, picture) => {
      const b = button.getBoundingClientRect();
      const c = picture.getBoundingClientRect();
      const x = Math.floor(((b.left + b.width / 2 - c.left) / c.width) * picture.width);
      const y = Math.floor(((b.top + b.height * 0.3 - c.top) / c.height) * picture.height);
      const [r, g, bl] = picture.getContext("2d").getImageData(x, y, 1, 1).data;
      return r + g + bl;
    }, canvas);
  }

  test("is bought, then hung on a glowing spot on the wall and nowhere else", async ({ page }) => {
    await expect(page.getByText("480").first()).toBeVisible();
    await buy(page, "Mountain poster");
    await expect(page.getByText("455").first()).toBeVisible();

    await pickFromInventory(page, "Mountain poster");
    await expect(page.getByRole("status")).toContainText("Tap a glowing spot for the Mountain poster");
    await expect(page.getByRole("button", { name: /^Put Mountain poster on the wall/ })).toHaveCount(5);
    await expect(page.getByRole("button", { name: /^Put Mountain poster (on the floor|on the window seat)/ })).toHaveCount(0);

    await goToPlace(page, "Chair");
    await page.getByRole("button", { name: "Put Mountain poster on the wall by the reading chair" }).click();
    await expect(page.getByRole("status")).toHaveText(/^Mountain poster is on the wall by the reading chair/);
    await expect(placed(page, "Mountain poster")).toHaveCount(1);
  });

  test("is painted into the room, darker after dark like the rest of it", async ({ page }) => {
    await goToPlace(page, "Chair");
    await hang(page, "Mountain poster", "by the reading chair");
    await nextPaint(page);
    const day = await brightnessUnder(page, "Mountain poster");

    await backAtNight(page);
    await expect.poll(() => brightnessUnder(page, "Mountain poster")).toBeLessThan(day - 60);
  });

  test("never covers the window, the clock, the corkboard or the bookshelf", async ({ page }) => {
    for (const spot of ["by the window", "by the reading chair", "above the corkboard", "over the nightstand", "by the mirror"]) {
      await hang(page, "Mountain poster", spot);
    }
    const boxes = (locator) => locator.evaluateAll((buttons) => buttons.map((b) => ({ name: b.getAttribute("aria-label"), ...b.getBoundingClientRect().toJSON() })));
    const posters = await boxes(placed(page, "Mountain poster"));
    expect(posters).toHaveLength(5);
    const parts = await boxes(page.getByRole("button", { name: /^(Quote of the day|Bookshelf, \d+ books)/ }));
    parts.push(...(await boxes(page.getByRole("img", { name: /^(Window view|Singapore time)/ }))));
    expect(parts.length).toBeGreaterThanOrEqual(4);
    for (const poster of posters) {
      for (const part of parts) {
        const apart = poster.right <= part.left || part.right <= poster.left || poster.bottom <= part.top || part.bottom <= poster.top;
        expect(apart, `a poster covers ${part.name}`).toBe(true);
      }
    }
  });

  test("can be taken down and hung somewhere else", async ({ page }) => {
    await goToPlace(page, "Chair");
    await hang(page, "Mountain poster", "by the reading chair");
    const poster = placed(page, "Mountain poster");
    await poster.click();
    await poster.getByText("Remove").click();
    await expect(page.getByRole("status")).toHaveText("Mountain poster is back in your inventory");
    await expect(poster).toHaveCount(0);

    await fromMenu(page, "Inventory");
    await pickFromInventory(page, "Mountain poster");
    await goToPlace(page, "Bed");
    await page.getByRole("button", { name: "Put Mountain poster on the wall by the mirror" }).click();
    await expect(page.getByRole("status")).toHaveText(/^Mountain poster is on the wall by the mirror/);
    await expect(poster).toHaveCount(1);
  });

  test("two pieces hang at once, and a taken spot stops glowing", async ({ page }) => {
    await goToPlace(page, "Chair");
    await hang(page, "Botanical print", "by the reading chair");
    await buy(page, "Gold photo frame");
    await pickFromInventory(page, "Gold photo frame");
    await expect(page.getByRole("button", { name: /^Put Gold photo frame on the wall/ })).toHaveCount(4);
    await expect(page.getByRole("button", { name: "Put Gold photo frame on the wall by the reading chair" })).toHaveCount(0);
    await page.getByRole("button", { name: "Put Gold photo frame on the wall by the window" }).click();
    await expect(placed(page, "Botanical print")).toHaveCount(1);
    await expect(placed(page, "Gold photo frame")).toHaveCount(1);
  });

  test("stays in the room after a look at My Shelf", async ({ page }) => {
    await goToPlace(page, "Chair");
    await hang(page, "Mountain poster", "by the reading chair");
    await page.getByRole("button", { name: /^Bookshelf, \d+ books$/ }).click({ position: { x: 8, y: 8 } });
    await expect(page).toHaveURL(/\/house\/shelf$/);
    await page.getByRole("link", { name: "Back to room" }).click();
    await expect(placed(page, "Mountain poster")).toHaveCount(1);
  });
});

test.describe("plants", () => {
  test("a big plant stands on the floor, and the succulents on a small surface", async ({ page }) => {
    await buy(page, "Monstera");
    await pickFromInventory(page, "Monstera");
    const monsteraSpots = page.getByRole("button", { name: /^Put Monstera / });
    await expect(monsteraSpots.first()).toBeAttached();
    const where = await monsteraSpots.evaluateAll((spots) => [...new Set(spots.map((s) => s.getAttribute("aria-label")))]);
    expect(where).toEqual(["Put Monstera on the floor"]);
    await goToPlace(page, "Chair");
    await monsteraSpots.locator("visible=true").first().click();
    await expect(page.getByRole("status")).toHaveText(/^Monstera is on the floor/);
    await expect(placed(page, "Monstera")).toHaveCount(1);

    await buy(page, "Succulent trio");
    await pickFromInventory(page, "Succulent trio");
    const names = await page.getByRole("button", { name: /^Put Succulent trio / }).evaluateAll((spots) => spots.map((s) => s.getAttribute("aria-label")));
    expect(new Set(names)).toEqual(new Set(["Put Succulent trio on the window seat", "Put Succulent trio on the side table", "Put Succulent trio on the nightstand"]));
    await page.getByRole("button", { name: "Put Succulent trio on the side table" }).click();
    await expect(page.getByRole("status")).toHaveText(/^Succulent trio is on the side table/);
    await expect(placed(page, "Succulent trio")).toHaveCount(1);
  });
});

test.describe("reading chairs", () => {
  // What the room has drawn in the reading nook: a few pixels across the chair's seat and back, so
  // a different chair there reads differently. The bookshelf's top is 272 art px above the floor.
  async function nook(page) {
    const canvas = await roomCanvas(page).elementHandle();
    return page.getByRole("button", { name: /^Bookshelf, \d+ books$/ }).evaluate((shelf, picture) => {
      const c = picture.getBoundingClientRect();
      const floor = Math.round(((shelf.getBoundingClientRect().top - c.top) / c.height) * picture.height) + 272;
      const ctx = picture.getContext("2d");
      const picks = [];
      for (const [x, up] of [[310, 30], [330, 60], [350, 45], [370, 70], [390, 30], [340, 95]]) {
        picks.push(...ctx.getImageData(x, floor - up, 1, 1).data.slice(0, 3));
      }
      return picks.join(",");
    }, canvas);
  }

  test("a reading chair takes the armchair's place, and the book on the table still opens", async ({ page }) => {
    await goToPlace(page, "Chair");
    const armchair = await nook(page);

    await buy(page, "Rocking chair");
    await pickFromInventory(page, "Rocking chair");
    // a chair goes in the reading nook and nowhere else
    const spots = page.getByRole("button", { name: /^Put Rocking chair / });
    await expect(spots).toHaveCount(1);
    await spots.click();
    await expect(page.getByRole("status")).toHaveText(/^Rocking chair is in the reading nook/);
    await expect(placed(page, "Rocking chair")).toHaveCount(1);
    await expect.poll(() => nook(page)).not.toBe(armchair);

    await page.getByRole("button", { name: /Currently reading Norwegian Wood/ }).click();
    await expect(page.getByRole("dialog", { name: "Currently reading" })).toBeVisible();
  });

  test("a second chair swaps the first back to the inventory; putting it away brings back the armchair", async ({ page }) => {
    await goToPlace(page, "Chair");
    const armchair = await nook(page);
    await buy(page, "Rocking chair");
    await pickFromInventory(page, "Rocking chair");
    await page.getByRole("button", { name: "Put Rocking chair in the reading nook" }).click();
    await expect.poll(() => nook(page)).not.toBe(armchair);
    const rocking = await nook(page);

    await buy(page, "Wingback chair");
    await pickFromInventory(page, "Wingback chair");
    await page.getByRole("button", { name: "Put Wingback chair in the reading nook" }).click();
    await expect(placed(page, "Wingback chair")).toHaveCount(1);
    await expect(placed(page, "Rocking chair")).toHaveCount(0);
    await expect.poll(() => nook(page)).not.toBe(rocking);
    await fromMenu(page, "Inventory");
    await expect(inventory(page).getByRole("button", { name: /Rocking chair/ })).toHaveCount(1);
    await inventory(page).getByRole("button", { name: "Close" }).click();

    const wingback = placed(page, "Wingback chair");
    await wingback.click();
    await wingback.getByText("Remove").click();
    await expect.poll(() => nook(page)).toBe(armchair);
  });
});

test.describe("cats", () => {
  async function adopt(page, name) {
    await buy(page, name);
    await pickFromInventory(page, name);
    await page.getByRole("button", { name: `Put ${name} on the floor` }).locator("visible=true").first().click();
    await expect(placed(page, name)).toHaveCount(1);
  }

  // where a cat is along the room (art pixels from the left wall), and how low its button sits
  async function whereIs(page, name) {
    const canvas = await roomCanvas(page).elementHandle();
    return placed(page, name).evaluate((button, picture) => {
      const c = picture.getBoundingClientRect();
      const box = button.getBoundingClientRect();
      return { x: ((box.left + box.width / 2 - c.left) / c.width) * picture.width, bottom: box.bottom };
    }, canvas);
  }

  // how bright the cats are, on average over the pixels they cover on their own canvas
  function catBrightness(page) {
    return page.getByTestId("room-cats").evaluate((canvas) => {
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

  test("cats wander about the room on their own, staying on its floor", async ({ page }) => {
    await adopt(page, "Ginger tabby");
    await adopt(page, "Calico");
    const floor = (await whereIs(page, "Ginger tabby")).bottom;
    const start = { ginger: (await whereIs(page, "Ginger tabby")).x, calico: (await whereIs(page, "Calico")).x };

    await expect.poll(async () => Math.abs((await whereIs(page, "Ginger tabby")).x - start.ginger), { timeout: 15000 }).toBeGreaterThan(8);
    await expect.poll(async () => Math.abs((await whereIs(page, "Calico")).x - start.calico), { timeout: 15000 }).toBeGreaterThan(8);
    // watched over a couple of seconds as they walk: never out of the room, always on the floor
    for (let look = 0; look < 6; look++) {
      for (const name of ["Ginger tabby", "Calico"]) {
        const { x, bottom } = await whereIs(page, name);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(1240);
        expect(Math.abs(bottom - floor)).toBeLessThan(2);
      }
      await page.waitForTimeout(400);
    }
  });

  test("with reduced motion, cats stay where they are", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await adopt(page, "Black cat");
    const start = (await whereIs(page, "Black cat")).x;
    // a cat waits up to 2 s before it first sets off; 4 s is long enough to see it hasn't
    await page.waitForTimeout(4000);
    expect((await whereIs(page, "Black cat")).x).toBe(start);
  });

  test("cats are drawn in the room's light, darker after dark", async ({ page }) => {
    await adopt(page, "Calico");
    await expect.poll(() => catBrightness(page)).not.toBeNull();
    const day = await catBrightness(page);

    await backAtNight(page);
    await expect.poll(() => catBrightness(page)).toBeLessThan(day - 60);
  });
});

// --- Putting pieces anywhere they fit --------------------------------------------------------------
// Pieces dragged out of the inventory land where they're let go, if they fit there (see
// buildings/house/strip/placement.js). Points are art pixels: x from the room's left wall, y down
// from the top of the room as designed. The bookshelf's top is at art y 132.

// where art point (x, y) is on the screen
function screenOf(page, x, y) {
  return page.getByRole("button", { name: /^Bookshelf, \d+ books$/ }).evaluate((shelf, [ax, ay]) => {
    const picture = document.querySelector("[data-testid='room-canvas']");
    const c = picture.getBoundingClientRect();
    const unit = c.width / picture.width;
    return { x: c.left + ax * unit, y: shelf.getBoundingClientRect().top + (ay - 132) * unit };
  }, [x, y]);
}

// the box a placed piece (or a part of the room) fills, in art pixels
function artBox(locator) {
  return locator.evaluate((el) => {
    const picture = document.querySelector("[data-testid='room-canvas']");
    const shelf = [...document.querySelectorAll("button")].find((b) => /^Bookshelf, \d+ books$/.test(b.getAttribute("aria-label") || ""));
    const c = picture.getBoundingClientRect();
    const unit = c.width / picture.width;
    const b = el.getBoundingClientRect();
    const top = shelf.getBoundingClientRect().top;
    return { x: Math.round((b.left - c.left) / unit), y: Math.round((b.top - top) / unit + 132), w: Math.round(b.width / unit), h: Math.round(b.height / unit) };
  });
}

const middleOf = (box) => ({ x: box.x + box.w / 2, y: box.y + box.h / 2 });
const apart = (a, b) => Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), b.y - (a.y + a.h), a.y - (b.y + b.h));

// Buys a piece and drags it from the inventory to art point (x, y).
async function dragIn(page, name, x, y) {
  await buy(page, name);
  const card = inventory(page).getByRole("button", { name: new RegExp(name) });
  const from = await card.boundingBox();
  const to = await screenOf(page, x, y);
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.mouse.up();
}

const bookshelf = (page) => page.getByRole("button", { name: /^Bookshelf, \d+ books$/ });

test.describe("putting pieces anywhere they fit", () => {
  test("wall art hangs where it's let go on open wall, not only on a glowing spot", async ({ page }) => {
    await goToPlace(page, "Bed");
    await dragIn(page, "Mountain poster", 1000, 220);
    await expect(page.getByRole("status")).toHaveText(/^Mountain poster is on the wall/);
    const box = await artBox(placed(page, "Mountain poster"));
    expect(Math.abs(middleOf(box).x - 1000)).toBeLessThanOrEqual(1);
    expect(Math.abs(middleOf(box).y - 220)).toBeLessThanOrEqual(1);
  });

  test("wall art let go just over the bookshelf moves clear of it, 8 px at least", async ({ page }) => {
    await goToPlace(page, "Chair");
    await dragIn(page, "Mountain poster", 480, 188);
    await expect(page.getByRole("status")).toHaveText(/^Mountain poster is on the wall/);
    const box = await artBox(placed(page, "Mountain poster"));
    expect(apart(box, await artBox(bookshelf(page)))).toBeGreaterThanOrEqual(8);
    expect(Math.abs(middleOf(box).x - 480)).toBeLessThanOrEqual(40);
  });

  test("wall art let go in the middle of the corkboard goes back to the inventory", async ({ page }) => {
    await goToPlace(page, "Corkboard");
    await dragIn(page, "Mountain poster", 747, 255);
    await expect(page.getByRole("status")).toHaveText("Not enough room there");
    await expect(placed(page, "Mountain poster")).toHaveCount(0);
    await fromMenu(page, "Inventory");
    await expect(inventory(page).getByRole("button", { name: /Mountain poster/ })).toHaveCount(1);
  });

  test("wall art stays on the wall, below the bunting", async ({ page }) => {
    await goToPlace(page, "Bed");
    await dragIn(page, "Gold photo frame", 1000, 40);
    await expect(page.getByRole("status")).toHaveText(/^Gold photo frame is on the wall/);
    const box = await artBox(placed(page, "Gold photo frame"));
    expect(box.y).toBeGreaterThanOrEqual(44);
  });

  test("a plant stands on the floor wherever along it it's let go", async ({ page }) => {
    await goToPlace(page, "Corkboard");
    await dragIn(page, "Monstera", 760, 380);
    await expect(page.getByRole("status")).toHaveText(/^Monstera is on the floor/);
    const box = await artBox(placed(page, "Monstera"));
    expect(Math.abs(middleOf(box).x - 760)).toBeLessThanOrEqual(1);
    expect(box.y + box.h).toBe(416);
  });

  test("two plants keep 8 px apart", async ({ page }) => {
    await goToPlace(page, "Corkboard");
    await dragIn(page, "Monstera", 760, 380);
    await expect(placed(page, "Monstera")).toHaveCount(1);
    await dragIn(page, "Fiddle-leaf fig", 770, 380);
    await expect(page.getByRole("status")).toHaveText(/^Fiddle-leaf fig is on the floor/);
    expect(apart(await artBox(placed(page, "Monstera")), await artBox(placed(page, "Fiddle-leaf fig")))).toBeGreaterThanOrEqual(8);
  });

  test("the succulents sit wherever they're let go along the window seat", async ({ page }) => {
    await goToPlace(page, "Window");
    await dragIn(page, "Succulent trio", 120, 340);
    await expect(page.getByRole("status")).toHaveText(/^Succulent trio is on the window seat/);
    const box = await artBox(placed(page, "Succulent trio"));
    expect(Math.abs(middleOf(box).x - 120)).toBeLessThanOrEqual(1);
    expect(box.y + box.h).toBe(350);
  });
});

// --- Moving a placed piece -------------------------------------------------------------------------

// Presses a placed piece, holds it (or not), and drags it to art point (x, y).
async function carry(page, name, x, y, { hold = 450 } = {}) {
  const from = await placed(page, name).boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  if (hold) await page.waitForTimeout(hold);
  const to = await screenOf(page, x, y);
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.mouse.up();
}

const scrolled = (page) => page.getByRole("region", { name: /room\. Swipe/ }).evaluate((el) => el.scrollLeft);

test.describe("moving a placed piece by pressing and holding it", () => {
  test("a poster pressed and held moves along the wall to where it's let go", async ({ page }) => {
    await goToPlace(page, "Bed");
    await dragIn(page, "Mountain poster", 1000, 220);
    await expect(placed(page, "Mountain poster")).toHaveCount(1);
    await carry(page, "Mountain poster", 1050, 190);
    await expect(page.getByRole("status")).toHaveText(/^Mountain poster is on the wall/);
    const box = await artBox(placed(page, "Mountain poster"));
    expect(Math.abs(middleOf(box).x - 1050)).toBeLessThanOrEqual(1);
    expect(Math.abs(middleOf(box).y - 190)).toBeLessThanOrEqual(1);
  });

  test("a quick drag over a piece looks around the room and leaves the piece where it was", async ({ page }) => {
    await goToPlace(page, "Bed");
    await dragIn(page, "Mountain poster", 1000, 220);
    await expect(placed(page, "Mountain poster")).toHaveCount(1);
    const before = await artBox(placed(page, "Mountain poster"));
    const left = await scrolled(page);
    await carry(page, "Mountain poster", 1100, 220, { hold: 0 });
    await expect.poll(() => scrolled(page)).not.toBe(left);
    expect(await artBox(placed(page, "Mountain poster"))).toEqual(before);
  });

  test("a piece let go where it doesn't fit goes back where it was", async ({ page }) => {
    await goToPlace(page, "Corkboard");
    await dragIn(page, "Mountain poster", 745, 110);
    await expect(placed(page, "Mountain poster")).toHaveCount(1);
    const before = await artBox(placed(page, "Mountain poster"));
    await carry(page, "Mountain poster", 747, 255);
    await expect(page.getByRole("status")).toHaveText("Not enough room there");
    expect(await artBox(placed(page, "Mountain poster"))).toEqual(before);
  });

  test("nothing in someone else's room can be picked up", async ({ page }) => {
    await page.goto("/people/emma.reads/room");
    await roomReady(page);
    await goToPlace(page, "Chair");
    const before = await artBox(placed(page, "Moon poster"));
    await carry(page, "Moon poster", 441, 260);
    expect(await artBox(placed(page, "Moon poster"))).toEqual(before);
  });
});

test.describe("moving a placed piece from its card", () => {
  const moving = (page) => page.getByRole("group", { name: /^Moving / });

  test("Move nudges a poster with the arrow buttons, never into the bookshelf, and Done keeps it there", async ({ page }) => {
    await goToPlace(page, "Chair");
    await dragIn(page, "Mountain poster", 470, 188);
    const poster = placed(page, "Mountain poster");
    await expect(poster).toHaveCount(1);
    const start = middleOf(await artBox(poster));

    await poster.click();
    await poster.getByText("Move", { exact: true }).click();
    const bar = moving(page);
    await expect(bar).toBeVisible();
    // it's as close to the bookshelf as it may be: right doesn't move it
    await bar.getByRole("button", { name: "Move right" }).click();
    expect(apart(await artBox(poster), await artBox(bookshelf(page)))).toBeGreaterThanOrEqual(8);
    await bar.getByRole("button", { name: "Move left" }).click();
    await bar.getByRole("button", { name: "Move left" }).click();
    await bar.getByRole("button", { name: "Move up" }).click();
    await bar.getByRole("button", { name: "Done" }).click();
    await expect(bar).toBeHidden();
    const end = middleOf(await artBox(poster));
    expect(end.x).toBeLessThan(start.x - 4);
    expect(end.y).toBeLessThan(start.y);
  });

  test("the arrow keys move it too, and Escape puts it back where it was", async ({ page }) => {
    await goToPlace(page, "Bed");
    await dragIn(page, "Mountain poster", 1000, 220);
    const poster = placed(page, "Mountain poster");
    await expect(poster).toHaveCount(1);
    const before = await artBox(poster);

    await poster.click();
    await poster.getByText("Move", { exact: true }).click();
    await expect(moving(page)).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowDown");
    await expect.poll(async () => (await artBox(poster)).x).toBeLessThan(before.x);
    await page.keyboard.press("Escape");
    await expect(moving(page)).toBeHidden();
    expect(await artBox(poster)).toEqual(before);
  });

  test("a plant moves only along the floor", async ({ page }) => {
    await goToPlace(page, "Corkboard");
    await dragIn(page, "Monstera", 760, 380);
    const plant = placed(page, "Monstera");
    await expect(plant).toHaveCount(1);
    await plant.click();
    await plant.getByText("Move", { exact: true }).click();
    await expect(moving(page).getByRole("button", { name: "Move up" })).toHaveCount(0);
    await moving(page).getByRole("button", { name: "Move right" }).click();
    await moving(page).getByRole("button", { name: "Done" }).click();
    const box = await artBox(plant);
    expect(middleOf(box).x).toBeGreaterThan(760);
    expect(box.y + box.h).toBe(416);
  });

  test("a reading chair has no Move", async ({ page }) => {
    await goToPlace(page, "Chair");
    await buy(page, "Rocking chair");
    await pickFromInventory(page, "Rocking chair");
    await page.getByRole("button", { name: "Put Rocking chair in the reading nook" }).click();
    const chair = placed(page, "Rocking chair");
    await chair.click();
    await expect(chair.getByText("Remove")).toBeVisible();
    await expect(chair.getByText("Move", { exact: true })).toHaveCount(0);
  });
});
