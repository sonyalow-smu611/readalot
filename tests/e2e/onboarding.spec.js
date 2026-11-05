// Scaffolded with AI assistance — see AI_USAGE.md
// New readers fill in Welcome and get the town tour once; returning readers go straight to the
// town. Readers are real Supabase users (see supabaseUser.js), deleted after each test.
import { expect, test as base } from "@playwright/test";
import { createReader, emailCode, hasSupabase, NEEDS_SUPABASE, readProfile, signInPage } from "./supabaseUser.js";

const test = base.extend({
  // override per describe block with test.use({ readerOptions: { … } })
  readerOptions: [{ profile: null }, { option: true }],
  reader: async ({ readerOptions }, use, testInfo) => {
    testInfo.skip(!hasSupabase, NEEDS_SUPABASE);
    const reader = await createReader(readerOptions);
    await use(reader);
    await reader.remove();
  },
  page: async ({ page, reader }, use) => {
    await signInPage(page, reader.session);
    await use(page);
  },
});

// the walkthrough's speech bubble, and its "n of 52 · Part" line
const bubble = (page) => page.locator(".guide__bubble");
const stepLine = (page) => page.locator(".guide__count");
// the bar's own buttons (the app has Next and Back buttons of its own)
const tour = (page) => page.locator(".guide__bubble");
const overlaps = (a, b) => !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);

// Slides across a thing with the pointer, the way a reader swipes a room or a hall.
async function slideAcross(page, selector) {
  const box = await page.locator(selector).first().boundingBox();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, y, { steps: 12 });
  await page.mouse.up();
}

// Next through the explaining steps until the words show (a step that asks the reader to do
// something has no Next, so it stops there)
async function nextUntil(page, words) {
  for (let tries = 0; tries < 30 && !(await bubble(page).textContent()).includes(words); tries++) {
    await tour(page).getByRole("button", { name: "Next" }).click();
  }
  await expect(bubble(page)).toContainText(words);
}

async function fillWelcome(page, name) {
  const next = page.getByRole("button", { name: "Next" });
  await page.getByLabel("Name").fill(name);
  await next.click();
  await page.getByRole("button", { name: "Prefer not to say" }).click();
  await next.click();
  await page.getByLabel("Age").fill("21");
  await next.click();
  await page.getByRole("button", { name: "Prefer not to say" }).click();
  await next.click();
  await page.getByRole("button", { name: "Fantasy" }).click();
  await next.click();
  await expect(page.getByRole("heading", { name: "Pick your character" })).toBeVisible();
  await page.getByRole("radio", { name: "Maya" }).check();
  await page.getByRole("button", { name: "Finish" }).click();
}

test.describe("a new reader", () => {
  test("fills in Welcome, then their character walks them through the app", async ({ page, reader }) => {
    test.slow();
    await page.goto("/");
    // no profile yet, so the town sends them to Welcome
    await expect(page.getByRole("heading", { name: "Your name" })).toBeVisible();
    await fillWelcome(page, "Alex");

    await expect(page).toHaveURL(/\/$/);
    await expect(bubble(page)).toContainText("Let me show you round");
    await expect(stepLine(page)).toHaveText(/^1 of \d+ · Town$/);
    // their own character floats beside the bubble
    await expect(page.locator(".guide__me canvas, .guide__me img").first()).toBeVisible();

    await tour(page).getByRole("button", { name: "Next" }).click();
    await expect(stepLine(page)).toHaveText(/^2 of /);

    // the weather chip is shown first: it follows the live sky, so there's nothing to tap
    await expect(bubble(page)).toContainText("The weather: the town's sky follows the real weather");
    const bar = await bubble(page).boundingBox();
    await tour(page).getByRole("button", { name: "Next" }).click();
    await expect(bubble(page)).toContainText("You! The number is your level");
    // the text bar never moves, and the character floats clear of the thing it is showing
    expect(await bubble(page).boundingBox()).toEqual(bar);
    await expect
      .poll(async () => overlaps(await page.locator(".guide__me").boundingBox(), await page.locator('[data-tour="town-badge"]').boundingBox()))
      .toBe(false);

    // a step that asks the reader to try something: the pointer shows how, there is no Next, and
    // nothing is done for them
    await nextUntil(page, "Tap your house, then go in.");
    await expect(page.locator(".guide__hand-art")).toBeVisible();
    await expect(tour(page).getByRole("button", { name: "Next" })).toHaveCount(0);
    const step = await stepLine(page).textContent();
    await page.waitForTimeout(1500);
    await expect(stepLine(page)).toHaveText(step);

    await tour(page).getByRole("button", { name: "Back" }).click();
    await expect(bubble(page)).toContainText("Drag the map to look around");
    await tour(page).getByRole("button", { name: "Next" }).click();
    await expect(bubble(page)).toContainText("Tap your house, then go in.");

    // Skip this part: on to the house, which the walkthrough opens
    await tour(page).getByRole("button", { name: "Skip this part" }).click();
    await expect(page).toHaveURL(/\/house$/);
    await expect(stepLine(page)).toHaveText(/· Your house$/);
    // the mood check-in waits, so it doesn't cover the walkthrough
    await expect(page.getByRole("heading", { name: "How are you feeling today?" })).toHaveCount(0);

    await tour(page).getByRole("button", { name: "Skip tour" }).click();
    await expect(bubble(page)).toHaveCount(0);
    const saved = await readProfile(reader.id);
    expect(saved).toMatchObject({ display_name: "Alex", favorite_genres: ["Fantasy"] });
    expect(saved.character).toMatchObject({ base: "maya", hair: "bun" });
    await expect.poll(async () => (await readProfile(reader.id)).tour_seen_at).not.toBeNull();

    // it never plays again by itself
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Places" })).toBeVisible();
    await expect(bubble(page)).toHaveCount(0);
  });

  test("can skip the walkthrough, and it stays skipped", async ({ page, reader }) => {
    await page.goto("/welcome");
    await fillWelcome(page, "Sam");
    await expect(bubble(page)).toContainText("Let me show you round");
    await page.getByRole("button", { name: "Next" }).click();
    await tour(page).getByRole("button", { name: "Skip tour" }).click();
    await expect(bubble(page)).toHaveCount(0);
    await expect.poll(async () => (await readProfile(reader.id)).tour_seen_at).not.toBeNull();

    await page.reload();
    await expect(page.getByRole("button", { name: "Places" })).toBeVisible();
    await expect(bubble(page)).toHaveCount(0);
  });
});

test.describe("the walkthrough, done by the reader", () => {
  test.use({ readerOptions: { profile: { name: "Robin", favouriteGenres: ["Fantasy"] }, tourSeen: false } });

  // Past everything on the way (a step that asks for something is skipped, not done) to the words
  async function skipTo(page, words) {
    for (let tries = 0; tries < 80 && !(await bubble(page).textContent()).includes(words); tries++) {
      await tour(page).getByRole("button", { name: /^(Next|Skip this step)$/ }).click();
      await page.waitForTimeout(120);
    }
    await expect(bubble(page)).toContainText(words);
  }

  test("tapping, and sliding, takes the walkthrough on with them", async ({ page }) => {
    test.slow();
    await page.goto("/");
    await nextUntil(page, "Tap your house, then go in.");

    const house = await page.locator('[data-tour-spot="house"]').boundingBox({ timeout: 15000 });
    await page.mouse.click(house.x + house.width / 2, house.y + house.height / 2);
    await page.getByRole("button", { name: /^(Enter|Go inside)/ }).click();
    // their character walks to the door: the walkthrough's own character steps aside meanwhile
    await expect(page.locator(".guide__me")).toBeHidden();
    await expect(page).toHaveURL(/\/house$/, { timeout: 20000 });

    await expect(bubble(page)).toContainText("Slide all the way along to look round the room.");
    await page.waitForTimeout(1200);
    await slideAcross(page, '[data-tour="room"]');
    await expect(bubble(page)).toContainText("The window shows the live weather");
  });

  test("the walkthrough never moves on by itself while the reader reads", async ({ page }) => {
    await page.goto("/");
    // a group: each thing is lit in turn, and stays until Next is pressed
    await nextUntil(page, "You! The number is your level");
    await page.waitForTimeout(6000);
    await expect(bubble(page)).toContainText("You! The number is your level");
    await tour(page).getByRole("button", { name: "Next" }).click();
    await expect(bubble(page)).toContainText("Daily tasks");
  });

  test("the search bar works while the walkthrough asks for a search", async ({ page }) => {
    test.slow();
    await page.goto("/");
    await skipTo(page, "Type it in and press Search.");
    // the bar can be clicked and typed in, and Search finishes the step
    await page.locator("input.library__input").click({ timeout: 5000 });
    await page.locator("input.library__input").fill("The Hobbit");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=/);
    await expect(bubble(page)).toContainText("Here are the books that match.");
  });

  test("sliding means the whole hall, with a meter showing how far", async ({ page }) => {
    test.slow();
    await page.goto("/");
    await skipTo(page, "Slide all the way along to see the whole collection.");
    await expect(page.getByRole("progressbar", { name: "How far you have slid" })).toBeVisible();
    await page.waitForTimeout(800);
    await slideAcross(page, '[data-tour="library-hall"]');
    // one swipe isn't the whole section
    await page.waitForTimeout(1200);
    await expect(bubble(page)).toContainText("Slide all the way along to see the whole collection.");
    for (let swipes = 0; swipes < 25 && (await bubble(page).textContent()).includes("Slide all the way along"); swipes++) {
      await slideAcross(page, '[data-tour="library-hall"]');
      await page.waitForTimeout(500);
    }
    await expect(bubble(page)).toContainText("Every bookcase is a genre");
  });

  test("the shelves show their three sections, and a book dragged between them is the reader's own move", async ({ page }) => {
    test.slow();
    // the test server keeps the shelf in memory for every test: the move is undone at the end
    let moved = null;
    page.on("request", (request) => {
      if (request.method() === "PATCH" && request.url().includes("/api/user-books/")) {
        moved = { url: request.url(), authorization: request.headers().authorization };
      }
    });
    try {
    await page.goto("/");
    await skipTo(page, "Your shelf at home.");
    await expect(page).toHaveURL(/\/house\/shelf$/);
    await tour(page).getByRole("button", { name: "Next" }).click();
    await expect(bubble(page)).toContainText("Currently reading");
    await tour(page).getByRole("button", { name: "Next" }).click();
    await expect(bubble(page)).toContainText("Finished reading");
    await tour(page).getByRole("button", { name: "Next" }).click();
    await expect(bubble(page)).toContainText("Drag your new book onto Currently reading.");

    // nothing is done for them
    await page.waitForTimeout(1500);
    await expect(bubble(page)).toContainText("Drag your new book onto Currently reading.");
    const book = page.locator('[data-shelf="want_to_read"] button').first();
    const from = await book.boundingBox();
    const to = await page.locator('[data-shelf="reading"]').boundingBox();
    const x = from.x + from.width / 2;
    const y = from.y + from.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 30, { steps: 4 });
    // the middle of the part of the Reading shelf that shows above the text bar
    const bar = await tour(page).boundingBox();
    const top = Math.max(to.y, 0);
    const bottom = Math.min(to.y + to.height, bar.y);
    await page.mouse.move(to.x + to.width / 2, (top + bottom) / 2, { steps: 12 });
    await page.mouse.up();
    await expect(bubble(page)).toContainText("It's on your Reading shelf now!");
    } finally {
      if (moved) {
        await page.request.patch(moved.url, {
          headers: { authorization: moved.authorization, "content-type": "application/json" },
          data: { status: "want_to_read" },
        });
      }
    }
  });
});

test.describe("a returning reader", () => {
  test.use({ readerOptions: { profile: { name: "Jo", favouriteGenres: ["Mystery"] }, tourSeen: true } });

  test("goes straight to the town, with no Welcome and no tour", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: "Places" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your name" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Welcome to IKDA Town" })).toHaveCount(0);
    // and Welcome itself sends them back to town
    await page.goto("/welcome");
    await expect(page).toHaveURL(/\/$/);
  });
});

// The code from the email, typed into Verify. The code is made without sending an email.
for (const purpose of ["signup", "login"]) {
  base(`the ${purpose} code from the email signs the reader in`, async ({ page }) => {
    base.skip(!hasSupabase, NEEDS_SUPABASE);
    const sent = await emailCode(purpose);
    try {
      await page.addInitScript(([email, why]) => {
        sessionStorage.setItem("readalot-pending-auth", JSON.stringify({ email, purpose: why }));
      }, [sent.email, purpose]);
      await page.goto("/verify");
      await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
      for (const [index, digit] of [...sent.code].entries()) {
        await page.getByLabel(`Digit ${index + 1}`).fill(digit);
      }
      await page.getByRole("button", { name: "Confirm code" }).click();
      // signed in, with no profile yet, so Welcome comes next, with no error shown
      await expect(page.getByRole("heading", { name: "Your name" })).toBeVisible();
      await expect(page.getByText(/expired|invalid/i)).toHaveCount(0);
    } finally {
      await sent.remove();
    }
  });
}
