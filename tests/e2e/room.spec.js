import {
  artColour, buy, expect, goToPlace, mockQuote, mockTime, mockWeather, pickFromInventory, roomCanvas, roomReady,
  roomRegion, scrollSettled, skipMoodCheckIn, test,
} from "./fixtures.js";

// My Room on a phone: the room is one wide picture, wider than the screen, that the reader looks
// around and taps. (The laptop layout has its own journey, house-desktop.spec.js.)
test.use({ viewport: { width: 480, height: 720 } });

// The room reads live weather and time; fixed answers keep these checks the same every run.
test.beforeEach(async ({ page }) => {
  await skipMoodCheckIn(page);
  await mockWeather(page, { scene: "rain", temperature: 27, weatherCode: 61 });
  await mockTime(page);
  await page.goto("/house");
});

const scrolled = (page) => roomRegion(page).evaluate((el) => ({ left: el.scrollLeft, most: el.scrollWidth - el.clientWidth }));

test.describe("looking around the room", () => {
  test("the room moves sideways with the wheel, a drag and the arrow keys, and stops at both ends", async ({ page }) => {
    await roomReady(page);
    const box = await roomRegion(page).boundingBox();
    // high on the wall, clear of anything that can be tapped
    const x = box.x + box.width / 2;
    const y = box.y + 60;
    expect((await scrolled(page)).left).toBe(0);

    await page.mouse.move(x, y);
    await page.mouse.wheel(0, 300);
    await expect.poll(async () => (await scrolled(page)).left).toBeGreaterThan(0);

    await scrollSettled(roomRegion(page));
    const afterWheel = (await scrolled(page)).left;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 150, y, { steps: 6 });
    await page.mouse.up();
    await expect.poll(async () => (await scrolled(page)).left).toBeGreaterThan(afterWheel + 100);

    // the wheel and the drag can leave the room near its right end, so the keys go left first
    await scrollSettled(roomRegion(page));
    const afterDrag = (await scrolled(page)).left;
    await roomRegion(page).focus();
    await page.keyboard.press("ArrowLeft");
    await expect.poll(async () => (await scrolled(page)).left).toBeLessThan(afterDrag - 20);
    await scrollSettled(roomRegion(page));
    const afterLeft = (await scrolled(page)).left;
    await page.keyboard.press("ArrowRight");
    await expect.poll(async () => (await scrolled(page)).left).toBeGreaterThan(afterLeft + 20);

    // as far right as it goes, then as far left
    await page.mouse.move(x, y);
    await page.mouse.wheel(0, 50000);
    await expect.poll(async () => { const { left, most } = await scrolled(page); return Math.abs(left - most); }).toBeLessThan(1);
    await page.mouse.wheel(0, -50000);
    await expect.poll(async () => (await scrolled(page)).left).toBe(0);
  });

  test("the Places menu sits top left, opens the list of places and closes once one is picked", async ({ page }) => {
    await roomReady(page);
    const menu = page.getByRole("button", { name: "Places", exact: true });
    const list = page.getByRole("navigation", { name: "Places in the room" });
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(list).toBeHidden();
    // the top left corner of the room
    const box = await menu.boundingBox();
    const area = await roomRegion(page).boundingBox();
    expect(box.x - area.x).toBeLessThan(30);
    expect(box.y - area.y).toBeLessThan(30);

    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(list.getByRole("button")).toHaveText(["Window", "Chair", "Bookshelf", "Clock", "Corkboard", "Bed"]);
    await list.getByRole("button", { name: "Bed" }).click();
    await expect(list).toBeHidden();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect.poll(async () => (await scrolled(page)).left).toBeGreaterThan(0);

    // Esc closes it, back on the button
    await menu.click();
    await page.keyboard.press("Escape");
    await expect(list).toBeHidden();
    await expect(menu).toBeFocused();

    // so does a tap anywhere else
    await menu.click();
    await page.mouse.click(area.x + area.width / 2, area.y + 60);
    await expect(list).toBeHidden();
  });

  test("the places go along the room in order, from the bay window to the bed", async ({ page }) => {
    await roomReady(page);
    let last = -1;
    for (const place of ["Window", "Chair", "Bookshelf", "Clock", "Corkboard", "Bed"]) {
      await goToPlace(page, place);
      const { left } = await scrolled(page);
      if (place === "Window") expect(left).toBe(0);
      else expect(left).toBeGreaterThan(last);
      last = left;
    }
  });

  test("a first visit says how to look around, until the room is moved, and not again", async ({ page }) => {
    // the room opened in beforeEach was the first visit
    const hint = page.getByText(/^(Swipe|Drag or scroll) to look around$/);
    await expect(hint).toBeVisible();
    await goToPlace(page, "Bookshelf");
    await expect(hint).toBeHidden();

    // the hint shows as soon as the room is ready, so once it's painted it would be there
    await page.reload();
    await roomReady(page);
    await expect(hint).toBeHidden();
  });

  test("the room starts bare, with plain wall where the gallery of frames was", async ({ page }) => {
    // the wall above the reading chair (art x 300–400, y 175–235) is the same colour as the bare
    // wall by the window (art 280, 205): no pictures, shelves or knick-knacks there
    await roomReady(page);
    await goToPlace(page, "Chair");
    const wall = await artColour(page, 280, 205);
    const differ = [];
    for (let x = 300; x <= 400; x += 10) {
      for (let y = 175; y <= 235; y += 10) if ((await artColour(page, x, y)) !== wall) differ.push([x, y]);
    }
    expect(differ).toEqual([]);
  });
});

test.describe("the window and the clock", () => {
  test("the room shows the window's weather, the wall clock and the shelf", async ({ page }) => {
    await goToPlace(page, "Window");
    const view = page.getByRole("img", { name: "Window view: Rain, 27 degrees" });
    await expect(view).toBeVisible();
    await expect(view.getByText("27°")).toBeVisible();
    await goToPlace(page, "Clock");
    await expect(page.getByRole("img", { name: "Singapore time 12:00" })).toBeVisible();
    await goToPlace(page, "Bookshelf");
    await expect(page.getByRole("button", { name: /^Bookshelf, \d+ books$/ })).toBeVisible();
  });

  test("the weather chip floats just above the window and moves with the room", async ({ page }) => {
    await goToPlace(page, "Window");
    const chip = page.getByRole("img", { name: "Window view: Rain, 27 degrees" });
    const glass = await page.getByTestId("window-view").boundingBox();
    const box = await chip.boundingBox();
    // above the glass, not far above it, and within the window's width
    expect(box.y + box.height).toBeLessThanOrEqual(glass.y);
    expect(glass.y - (box.y + box.height)).toBeLessThan(90);
    expect(box.x).toBeGreaterThanOrEqual(glass.x);
    expect(box.x + box.width).toBeLessThanOrEqual(glass.x + glass.width);

    await goToPlace(page, "Bed");
    const moved = await chip.boundingBox();
    expect(box.x - moved.x).toBeGreaterThan(200);
  });

  test("rain falls past the bay window when it rains", async ({ page }) => {
    await goToPlace(page, "Window");
    const view = page.getByTestId("window-view");
    await expect(view).toBeVisible();
    await expect(view.getByTestId("raindrop").first()).toBeAttached();
    await expect(view.getByTestId("bird")).toHaveCount(0);
  });

  test("birds fly past the bay window on a clear day", async ({ page }) => {
    await mockWeather(page, { scene: "sunny", temperature: 31 });
    await page.reload();
    await goToPlace(page, "Window");
    const view = page.getByTestId("window-view");
    await expect(view).toBeVisible();
    await expect(view.getByTestId("bird")).toHaveCount(3);
    await expect(view.getByTestId("bird").first()).toBeVisible();
  });

  test("at night the window looks out on the town with its windows lit", async ({ page }) => {
    await mockWeather(page, { scene: "sunny", temperature: 26, isDay: false });
    await page.reload();
    await goToPlace(page, "Window");
    await expect(page.getByRole("img", { name: "Window view: Clear night, 26 degrees" })).toBeVisible();
    const view = page.getByTestId("window-view");
    await expect(view.getByTestId("town-lights")).toBeVisible();
    await expect(view.getByTestId("bird")).toHaveCount(0);
  });
});

test.describe("tapping the room", () => {
  test("tapping the bookshelf opens My Shelf, and a book on it still opens that book", async ({ page }) => {
    // a book first: it comes off the shelf and opens
    await page.getByRole("button", { name: "Norwegian Wood by Haruki Murakami" }).click();
    await expect(page.getByRole("dialog", { name: "Book details" })).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: "Close book" }).click();
    await expect(page.getByRole("dialog", { name: "Book details" })).toBeHidden();

    // the bookshelf itself, away from its books (its top left corner)
    await page.getByRole("button", { name: /^Bookshelf, \d+ books$/ }).click({ position: { x: 8, y: 8 } });
    await expect(page).toHaveURL(/\/house\/shelf$/);
    await expect(page.getByRole("link", { name: "Back to room" })).toBeVisible();
  });

  test("the book on the chair opens the Currently Reading card", async ({ page }) => {
    await page.getByRole("button", { name: /Currently reading Norwegian Wood/ }).click();
    const card = page.getByRole("dialog", { name: "Currently reading" });
    await expect(card.getByRole("heading", { name: "Norwegian Wood" })).toBeVisible();
    await expect(card.getByRole("link")).toHaveAttribute("href", "/books/demo-shelf-1");

    // a tap anywhere else puts it away
    await goToPlace(page, "Window");
    await expect(card).toBeHidden();
  });

  test("the corkboard opens my notice board, with the Quote of the Day on top", async ({ page }) => {
    await mockQuote(page);
    await goToPlace(page, "Corkboard");
    await page.getByRole("button", { name: "Notice board" }).click();

    const board = page.getByRole("dialog", { name: "Notice board" });
    const quote = board.getByRole("region", { name: "Quote of the Day" });
    await expect(quote.getByText("“So many books, so little time.”")).toBeVisible();
    await expect(quote.getByText("On books")).toBeVisible();
    await board.getByRole("button", { name: "Close" }).click();
    await expect(board).toBeHidden();
  });
});

test.describe("decorating", () => {
  test("buying a decoration spends credits, and it can be placed in the room", async ({ page }) => {
    await expect(page.getByText("480").first()).toBeVisible();
    await buy(page, "Succulent trio");
    await expect(page.getByText("450").first()).toBeVisible();

    // pick the succulents, then tap one of the glowing spots they can stand on
    await pickFromInventory(page, "Succulent trio");
    await expect(page.getByRole("status")).toContainText("Tap a glowing spot for the Succulent trio");
    await goToPlace(page, "Window");
    await page.getByRole("button", { name: /^Put Succulent trio on the window seat/ }).locator("visible=true").first().click();

    await expect(page.getByRole("status")).toHaveText(/^Succulent trio is on the window seat/);
    await expect(page.getByRole("button", { name: "Succulent trio", exact: true })).toHaveCount(1);
  });
});

// The picture is stretched a whole number of times in device pixels, so it is never blurred.
for (const [device, viewport, deviceScaleFactor] of [
  ["a phone", { width: 390, height: 844 }, 3],
  ["a laptop", { width: 1280, height: 800 }, 2],
]) {
  test.describe(`drawn crisp on ${device}`, () => {
    test.use({ viewport, deviceScaleFactor });

    test("the room is drawn at a whole number of device pixels per pixel of art", async ({ page }) => {
      await roomReady(page);
      const { across, down, crisp } = await roomCanvas(page).evaluate((canvas) => {
        const { width, height } = canvas.getBoundingClientRect();
        return {
          across: (width * devicePixelRatio) / canvas.width,
          down: (height * devicePixelRatio) / canvas.height,
          crisp: getComputedStyle(canvas).imageRendering,
        };
      });
      expect(across).toBeGreaterThanOrEqual(1);
      expect(Math.abs(across - Math.round(across))).toBeLessThan(0.001);
      expect(Math.abs(down - across)).toBeLessThan(0.001);
      expect(crisp).toBe("pixelated");
    });
  });
}
