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

const TOUR = ["Your house", "The library", "The cafe", "The hair salon", "Friends’ houses"];

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
  test("fills in Welcome, then the tour visits every building once", async ({ page, reader }) => {
    // six camera glides across the town map, each waited for
    test.slow();
    await page.goto("/");
    // no profile yet, so the town sends them to Welcome
    await expect(page.getByRole("heading", { name: "Your name" })).toBeVisible();
    await fillWelcome(page, "Alex");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Welcome to Readalot Town" })).toBeVisible();
    for (const stop of TOUR) {
      await page.getByRole("button", { name: "Next" }).click();
      // the card waits for the camera to arrive, which runs on the map's frames: slower on a busy machine
      await expect(page.getByRole("heading", { name: stop })).toBeVisible({ timeout: 15000 });
      // the building's own card stays closed so it doesn't cover the tour
      await expect(page.getByRole("button", { name: /^Enter|^Go inside|^Visit/ })).toHaveCount(0);
      // the tour's card sits below the building, never over it
      const building = await page.locator("[data-tour-spot]").boundingBox();
      const card = await page.locator(".guide__card").boundingBox();
      expect(card.y).toBeGreaterThanOrEqual(building.y + building.height);
    }
    await expect(page.getByText(`${TOUR.length + 1} of ${TOUR.length + 1}`)).toBeVisible();
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("heading", { name: "Friends’ houses" })).toBeHidden();

    const saved = await readProfile(reader.id);
    expect(saved).toMatchObject({ display_name: "Alex", favorite_genres: ["Fantasy"] });
    expect(saved.character).toMatchObject({ base: "maya", hair: "bun" });
    await expect.poll(async () => (await readProfile(reader.id)).tour_seen_at).not.toBeNull();

    // the tour never plays again
    await page.reload();
    await expect(page.getByRole("button", { name: "Places" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Welcome to Readalot Town" })).toHaveCount(0);
  });

  test("can skip the tour, and it stays skipped", async ({ page, reader }) => {
    await page.goto("/welcome");
    await fillWelcome(page, "Sam");
    await expect(page.getByRole("heading", { name: "Welcome to Readalot Town" })).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Skip" }).click();
    await expect(page.getByRole("heading", { name: "Your house" })).toBeHidden();
    await expect.poll(async () => (await readProfile(reader.id)).tour_seen_at).not.toBeNull();

    await page.reload();
    await expect(page.getByRole("button", { name: "Places" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Welcome to Readalot Town" })).toHaveCount(0);
  });
});

test.describe("a returning reader", () => {
  test.use({ readerOptions: { profile: { name: "Jo", favouriteGenres: ["Mystery"] }, tourSeen: true } });

  test("goes straight to the town, with no Welcome and no tour", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: "Places" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your name" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Welcome to Readalot Town" })).toHaveCount(0);
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
      // signed in, with no profile yet, so Welcome comes next, with no error shown
      await expect(page.getByRole("heading", { name: "Your name" })).toBeVisible();
      await expect(page.getByText(/expired|invalid/i)).toHaveCount(0);
    } finally {
      await sent.remove();
    }
  });
}
