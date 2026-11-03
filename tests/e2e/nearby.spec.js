import { expect, REAL_API, test, townReady, useRealApi } from "./fixtures.js";
import { skipDailyPanel } from "./townFriends.js";
import { createReader, markActive, notAskedYet, setAge, setDiscoverable, signInPage, storedArea } from "./supabaseUser.js";

// Going public, finding readers near you and adding them. The location is faked, and the demo
// readers' areas near SMU come from `npm run seed:readers -w server`.
const SMU = { latitude: 1.2966, longitude: 103.8502 };
const FAR_AWAY = { latitude: 51.5, longitude: -0.12 };
const PROFILE = { name: "Reader", favouriteGenres: ["Fantasy"] };

async function openTown(page, reader) {
  await useRealApi(page);
  await skipDailyPanel(reader.id);
  await page.goto("/");
  await townReady(page);
}

async function allowLocation(page, position = SMU) {
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation(position);
}

const chip = (page) => page.getByRole("switch", { name: "Public profile and location" });

// Turns public and waits for the readers near you, which the Friends list shows.
async function goPublic(page) {
  const answer = page.waitForResponse((response) => response.url().endsWith("/api/nearby") && response.ok());
  await chip(page).click();
  await answer;
}
const prompt = (page) => page.getByRole("dialog", { name: "Find readers near you?" });

test.describe("the public or private question", () => {
  test("closing it means private, and it isn't asked again", async ({ page, reader }) => {
    await notAskedYet(reader.id);
    await openTown(page, reader);
    await expect(prompt(page)).toContainText("even when the app is closed");
    await prompt(page).getByRole("button", { name: "Stay private" }).click();

    // saved in Supabase first, which can take a while when every test is running
    await expect(prompt(page)).toBeHidden({ timeout: 10_000 });
    await expect(chip(page)).toHaveAttribute("aria-checked", "false");
    await page.reload();
    await townReady(page);
    await expect(prompt(page)).toHaveCount(0);
  });

  test("going public saves only a rough area", async ({ page, reader }) => {
    await notAskedYet(reader.id);
    await allowLocation(page, { latitude: 1.296612, longitude: 103.850234 });
    await openTown(page, reader);
    await prompt(page).getByRole("button", { name: "Go public" }).click();

    await expect(chip(page)).toHaveAttribute("aria-checked", "true");
    await expect.poll(() => storedArea(reader.id)).toMatchObject({ lat_cell: 130, lng_cell: 10385 });
  });

  test("a blocked browser leaves you private and says how to fix it", async ({ page, reader }) => {
    await notAskedYet(reader.id);
    await page.context().clearPermissions();
    await openTown(page, reader);
    await prompt(page).getByRole("button", { name: "Go public" }).click();

    await expect(prompt(page).getByRole("alert")).toContainText("Allow it in your browser settings");
    await expect(chip(page)).toHaveAttribute("aria-checked", "false");
  });

  test("going private deletes your area", async ({ page, reader }) => {
    await allowLocation(page);
    await openTown(page, reader);
    await chip(page).click();
    await expect(chip(page)).toHaveAttribute("aria-checked", "true");
    await expect.poll(() => storedArea(reader.id)).not.toBeNull();

    await chip(page).click();
    await expect(chip(page)).toHaveAttribute("aria-checked", "false");
    await expect.poll(() => storedArea(reader.id)).toBeNull();
  });
});

test.describe("under-18s", () => {
  test("are never asked, can't go public, and the database refuses it too", async ({ page, reader }) => {
    await notAskedYet(reader.id);
    await setAge(reader.id, 16);
    await openTown(page, reader);

    await expect(prompt(page)).toHaveCount(0);
    await expect(chip(page)).toBeDisabled();
    expect(await setDiscoverable(reader.id, true)).toBe(false);
  });
});

test.describe("readers near you", () => {
  test("nobody shows while you're private", async ({ page, reader }) => {
    await openTown(page, reader);
    await page.getByRole("button", { name: /^Friends/ }).click();
    await expect(page.getByRole("heading", { name: "Readers nearby" })).toHaveCount(0);
  });

  test("nobody shows when you're far from everyone", async ({ page, reader }) => {
    await allowLocation(page, FAR_AWAY);
    await openTown(page, reader);
    await chip(page).click();
    await expect(chip(page)).toHaveAttribute("aria-checked", "true");
    await page.getByRole("button", { name: /^Friends/ }).click();
    await expect(page.getByRole("heading", { name: "Readers nearby" })).toHaveCount(0);
  });

  test("adding a demo reader gives them a house straight away", async ({ page, reader }) => {
    // ahead of the readers the other tests make near SMU at the same time
    await markActive(["emma.reads"]);
    await allowLocation(page);
    await openTown(page, reader);
    await goPublic(page);
    await page.getByRole("button", { name: /^Friends/ }).click();
    const list = page.getByRole("navigation", { name: "Friends in town" });
    await expect(list.getByRole("heading", { name: "Readers nearby" })).toBeVisible();
    await list.getByRole("button", { name: /Emma Tan/ }).click();

    const card = page.getByRole("dialog", { name: "Emma Tan" });
    await expect(card).toContainText("Reader nearby");
    await card.getByRole("button", { name: "Add friend" }).click();

    await page.getByRole("button", { name: "Places" }).click();
    await expect(page.getByRole("navigation", { name: "Places in town" }).getByRole("button", { name: /^Emma's house/ })).toBeVisible();
  });

  test("two real readers find each other, ask, and accept", async ({ page, reader, browser }) => {
    const other = await createReader({ profile: { ...PROFILE, name: "Robin Lee" } });
    await notAskedYet(other.id);
    const theirContext = await browser.newContext();
    const theirPage = await theirContext.newPage();
    try {
      await allowLocation(theirPage);
      await signInPage(theirPage, other.session);
      await openTown(theirPage, other);
      await prompt(theirPage).getByRole("button", { name: "Go public" }).click();
      await expect(chip(theirPage)).toHaveAttribute("aria-checked", "true");

      await allowLocation(page);
      await openTown(page, reader);
      await goPublic(page);
      await page.getByRole("button", { name: /^Friends/ }).click();
      await page.getByRole("navigation", { name: "Friends in town" }).getByRole("button", { name: /Robin Lee/ }).click();
      const card = page.getByRole("dialog", { name: "Robin Lee" });
      await card.getByRole("button", { name: "Add friend" }).click();
      await expect(card.getByRole("button", { name: "Requested" })).toBeDisabled();

      await theirPage.reload();
      await townReady(theirPage);
      await theirPage.getByRole("button", { name: /1 friend request/ }).click();
      await theirPage.getByRole("button", { name: "Accept Reader" }).click();
      await theirPage.getByRole("button", { name: "Places" }).click();
      await expect(theirPage.getByRole("navigation", { name: "Places in town" }).getByRole("button", { name: /^Reader's house/ })).toBeVisible();
    } finally {
      await theirContext.close();
      await other.remove();
    }
  });
});

test.describe("what the server gives away", () => {
  test("nearby needs a sign-in and sends no location", async ({ page, reader, playwright }) => {
    const signedOut = await playwright.request.newContext({ baseURL: REAL_API });
    expect((await signedOut.post("/api/nearby", { data: {} })).status()).toBe(401);
    await signedOut.dispose();

    await allowLocation(page);
    await openTown(page, reader);
    const answer = page.waitForResponse((response) => response.url().endsWith("/api/nearby") && response.ok());
    await chip(page).click();
    const { readers } = await (await answer).json();
    expect(readers.length).toBeGreaterThan(0);
    for (const nearby of readers) {
      expect(Object.keys(nearby).sort()).toEqual(["character", "displayName", "id", "lastSeenAt", "requested", "userId"]);
    }
  });
});
