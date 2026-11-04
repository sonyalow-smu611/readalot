// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, skipMoodCheckIn, standsStill, test, townReady } from "./fixtures.js";
import { setDaily, signInPage, sgDay } from "./supabaseUser.js";

// Daily tasks on the map. The day is kept in Supabase (database/daily_tasks.sql), so each test
// sets the reader's day there before the town loads.
const EVERY_TASK = ["check-in", "reading", "visit-room", "send-message", "add-book", "leave-note"];
const dayKey = sgDay;

async function openTown(page) {
  await page.goto("/");
  await townReady(page);
  const panel = page.getByRole("region", { name: "Daily tasks" });
  await expect(panel).toBeVisible();
  return panel;
}

test("the first visit of the day opens the tasks, with the check-in already ticked", async ({ page }) => {
  const panel = await openTown(page);
  const tasks = panel.getByRole("list", { name: "Today’s tasks" }).getByRole("listitem");
  await expect(tasks).toHaveCount(3);
  await expect(tasks.first()).toContainText("Check in at town");
  await expect(tasks.first()).toContainText("Done");
  await expect(panel.getByRole("button", { name: "Finish 2 more to claim" })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Daily tasks, 1 of 3 finished, 0-day streak/ })).toBeVisible();

  // closed, it stays closed for the rest of the day
  await page.getByRole("button", { name: /Daily tasks/ }).click();
  await expect(panel).toBeHidden();
  await page.reload();
  await townReady(page);
  await expect(page.getByRole("region", { name: "Daily tasks" })).toBeHidden();
});

// The claim is saved in Supabase: the reward, the streak, and the day on any device.
test("a claimed reward is saved: the coins and streak are there after a reload", async ({ page, reader }) => {
  await setDaily(reader.id, { done: EVERY_TASK });
  const panel = await openTown(page);
  await panel.getByRole("button", { name: "Claim 50 coins" }).click();
  await page.getByRole("dialog", { name: "Daily reward" }).getByRole("button", { name: "Nice!" }).click();
  await expect(page.getByRole("link", { name: /^Your profile:/ })).toHaveAccessibleName(/530 coins/);

  await page.reload();
  await townReady(page);
  await expect(page.getByRole("button", { name: /Daily tasks, reward claimed, 1-day streak/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Your profile:/ })).toHaveAccessibleName(/530 coins/);
});

test("the streak is the same on another device", async ({ page, browser, reader }, testInfo) => {
  await setDaily(reader.id, { done: EVERY_TASK });
  const panel = await openTown(page);
  await panel.getByRole("button", { name: "Claim 50 coins" }).click();
  await expect(page.getByRole("dialog", { name: "Daily reward" })).toBeVisible();

  const device = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
  try {
    const other = await device.newPage();
    await signInPage(other, reader.session);
    await skipMoodCheckIn(other);
    await other.goto("/");
    await townReady(other);
    await expect(other.getByRole("button", { name: /Daily tasks, reward claimed, 1-day streak/ })).toBeVisible();
  } finally {
    await device.close();
  }
});

test("with the daily tasks unreachable the town still opens, without the Daily button", async ({ page }) => {
  await page.route("**/rest/v1/rpc/daily_today", (route) => route.fulfill({ status: 500, json: { message: "down" } }));
  await page.goto("/");
  await townReady(page);
  await expect(page.getByRole("button", { name: "Places" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Daily tasks/ })).toHaveCount(0);
});

test("a task's Go takes you to its building", async ({ page }) => {
  const panel = await openTown(page);
  await panel.getByRole("button", { name: "Go: Update your reading progress" }).click();
  await expect(panel).toBeHidden();
  await expect(page.getByRole("dialog", { name: "Your house" })).toBeVisible();
});

test("all three done: claim the reward and the streak starts", async ({ page, reader }) => {
  await setDaily(reader.id, { done: EVERY_TASK });
  const panel = await openTown(page);
  await panel.getByRole("button", { name: "Claim 50 coins" }).click();

  const reward = page.getByRole("dialog", { name: "Daily reward" });
  await expect(reward).toContainText("Day 1 streak!");
  await expect(reward).toContainText("+50 coins");
  await reward.getByRole("button", { name: "Nice!" }).click();
  await expect(reward).toBeHidden();

  await page.getByRole("button", { name: /Daily tasks, reward claimed, 1-day streak/ }).click();
  await expect(panel.getByRole("button", { name: "Claimed. New tasks tomorrow" })).toBeDisabled();
  await expect(panel.getByRole("listitem", { name: "Day 1: 50 coins, claimed" })).toBeVisible();
  await expect(panel.getByRole("listitem", { name: "Day 7: 300 coins and a streak freeze" })).toBeVisible();
});

test("a missed day uses a streak freeze and keeps the streak", async ({ page, reader }) => {
  await setDaily(reader.id, { day: dayKey(-2), streak: 4, lastClaim: dayKey(-2), freezes: 2 });
  const panel = await openTown(page);
  await expect(panel).toContainText("a streak freeze kept your 4-day streak safe");
  await expect(panel).toContainText("4-day streak");
  await expect(panel.getByLabel("1 of 2 streak freezes")).toBeVisible();
});

test("with no freezes left, a missed day ends the streak", async ({ page, reader }) => {
  await setDaily(reader.id, { day: dayKey(-3), streak: 5, lastClaim: dayKey(-3), freezes: 1 });
  const panel = await openTown(page);
  await expect(panel).toContainText("Your 5-day streak ended");
  await expect(panel).toContainText("0-day streak");
});

// The same tasks from anywhere else in the app, on a tab on the edge of the page.
test.describe("on other pages", () => {
  const tab = (page) => page.getByRole("button", { name: /^Daily tasks/ });

  test("the tab opens today's tasks, with what's left", async ({ page, reader }) => {
    await setDaily(reader.id, { done: ["check-in"] });
    await page.goto("/library");
    await expect(tab(page)).toHaveAccessibleName(/1 of 3 finished/);
    await expect(page.getByRole("region", { name: "Daily tasks" })).toBeHidden();

    await tab(page).click();
    const panel = page.getByRole("region", { name: "Daily tasks" });
    const tasks = panel.getByRole("list", { name: "Today’s tasks" }).getByRole("listitem");
    await expect(tasks).toHaveCount(3);
    await expect(tasks.first()).toContainText("Done");
    await expect(panel.getByRole("button", { name: "Finish 2 more to claim" })).toBeDisabled();
  });

  test("it closes with Escape or a tap outside, even beside the phone column", async ({ page, reader }) => {
    await setDaily(reader.id, { done: ["check-in"], shown: dayKey() });
    // a page in the phone column (search now fills the window, in the library's look)
    await page.goto("/mood");
    const panel = page.getByRole("region", { name: "Daily tasks" });

    await tab(page).click();
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(tab(page)).toBeFocused();

    await tab(page).click();
    await expect(panel).toBeVisible();
    await page.mouse.click(10, 300);
    await expect(panel).toBeHidden();
  });

  test("a page's own dialog sits over the tab", async ({ page }) => {
    await page.goto("/house");
    await expect(page.getByRole("dialog", { name: "How are you feeling today?" })).toBeVisible();
    await expect(tab(page).click({ trial: true, timeout: 2000 })).rejects.toThrow();
  });

  test("Go takes you to the task's building", async ({ page, reader }) => {
    await setDaily(reader.id, { done: ["check-in"], shown: dayKey() });
    await page.goto("/search");
    await tab(page).click();
    await page.getByRole("button", { name: "Go: Update your reading progress" }).click();
    await expect(page).toHaveURL(/\/house$/);
    await expect(page.getByRole("region", { name: "Daily tasks" })).toBeHidden();
  });

  test("the reward can be claimed there too", async ({ page, reader }) => {
    await setDaily(reader.id, { done: EVERY_TASK, shown: dayKey() });
    await page.goto("/search");
    await expect(tab(page)).toHaveAccessibleName(/reward ready to claim/);
    await tab(page).click();
    await page.getByRole("button", { name: /^Claim \d+ coins/ }).click();
    await page.getByRole("button", { name: "Nice!" }).click();
    await expect(tab(page)).toHaveAccessibleName(/reward claimed/);
  });

  test("each page has it, the town has just its own, and signing in has none", async ({ page }) => {
    for (const url of ["/house", "/house/shelf", "/cafe", "/salon", "/search"]) {
      await page.goto(url);
      await expect(tab(page)).toContainText("Daily task");
    }
    await page.goto("/");
    await townReady(page);
    await expect(page.getByRole("button", { name: /Daily tasks, / })).toHaveCount(1);
  });
});

// The button is a small flame; pointing at it opens out "Daily task".
test("the Daily button stays small until you point at it", async ({ page, reader }) => {
  await setDaily(reader.id, { shown: dayKey() });
  await page.goto("/");
  await townReady(page);
  const button = page.getByRole("button", { name: /^Daily tasks/ });
  const shut = (await button.boundingBox()).width;
  expect(shut).toBeLessThan(90);
  await button.hover();
  await expect.poll(async () => (await button.boundingBox()).width).toBeGreaterThan(shut + 40);
  await page.mouse.move(600, 500);
  await expect.poll(async () => (await button.boundingBox()).width).toBeLessThan(90);
});

// On every page it lines up with the buttons already there, and covers none of them.
test.describe("where the Daily button sits", () => {
  const button = (page) => page.getByRole("button", { name: /^Daily tasks/ });
  const clear = (a, b) => a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
  const box = (locator) => locator.boundingBox();

  test.beforeEach(async ({ page }) => {
    await skipMoodCheckIn(page);
  });

  test("in a building it stacks under the back button", async ({ page }) => {
    await page.goto("/library");
    await expect(button(page)).toBeVisible({ timeout: 20_000 });
    const back = await standsStill(page.getByRole("link", { name: "Back to town" }));
    await expect.poll(async () => (await box(button(page))).y).toBeGreaterThanOrEqual(back.y + back.height);
    expect((await box(button(page))).x).toBeCloseTo(back.x, 0);
  });

  // it stays out of sight until it's in its place, so it never shows jumping there
  test("going from page to page it only ever shows in the right spot", async ({ page, reader }) => {
    await setDaily(reader.id, { shown: dayKey() });
    await page.goto("/library");
    await expect(button(page)).toBeVisible({ timeout: 20_000 });
    await expect(button(page)).toHaveCSS("opacity", "1");
    await page.evaluate(() => {
      window.__dailySpots = [];
      const watch = () => {
        const tab = document.querySelector(".daily-dock__tab");
        if (tab && getComputedStyle(tab).opacity === "1") window.__dailySpots.push(`${tab.style.top} ${tab.style.left} ${tab.style.right}`);
        requestAnimationFrame(watch);
      };
      watch();
    });
    await page.getByRole("link", { name: "Back to town" }).click();
    await expect(page).toHaveURL(/\/$/);
    await townReady(page);
    await page.getByRole("button", { name: "Places" }).click();
    await page.getByRole("navigation", { name: "Places in town" }).getByRole("button", { name: /^Your house/ }).click();
    await page.getByRole("dialog", { name: "Your house" }).getByRole("button", { name: "Go inside" }).click();
    await expect(page).toHaveURL(/\/house$/, { timeout: 10_000 });
    await expect(page.locator(".daily-dock__tab")).toHaveCSS("opacity", "1", { timeout: 5000 });
    await page.waitForTimeout(600);
    const spots = await page.evaluate(() => [...new Set(window.__dailySpots.slice(-30))]);
    expect(spots).toHaveLength(1);
  });

  test("in My Room it stacks under Places, not on top of it", async ({ page }) => {
    await page.goto("/house");
    const places = page.getByRole("button", { name: "Places" });
    await expect(places).toBeVisible({ timeout: 20_000 });
    const under = await standsStill(places);
    await expect.poll(async () => (await box(button(page))).y).toBeGreaterThanOrEqual(under.y + under.height);
    expect((await box(button(page))).x).toBeCloseTo(under.x, 0);
  });

  test("in the cafe it stacks under the reader count", async ({ page }) => {
    await page.goto("/cafe");
    const count = page.locator(".cafe__count");
    await expect(count).toBeVisible({ timeout: 20_000 });
    const under = await box(count);
    await expect.poll(async () => clear(await box(button(page)), under)).toBe(true);
  });

  for (const [label, viewport] of [
    ["a phone", { width: 390, height: 844 }],
    ["a laptop", { width: 1440, height: 900 }],
  ]) {
    test.describe(`on ${label}`, () => {
      test.use({ viewport });

      const shelves = [["My Shelf", "/house/shelf", "Back to room"]];
      // a friend's long back button only gets in the way on a phone
      if (viewport.width < 600) shelves.push(["a friend's shelf", "/people/emma.reads/room/shelf", "Back to Emma's room"]);
      for (const [shelf, path, name] of shelves) {
        test(`on ${shelf} it stacks under the back button, clear of the shelf's own controls`, async ({ page }) => {
          await page.goto(path);
          const back = page.getByRole("link", { name });
          await expect(back).toBeVisible({ timeout: 20_000 });
          const under = await standsStill(back);
          await expect.poll(async () => (await box(button(page))).y).toBeGreaterThanOrEqual(under.y + under.height);
          expect((await box(button(page))).x).toBeCloseTo(under.x, 0);

          await expect(button(page)).toHaveCSS("opacity", "1");
          const daily = await box(button(page));
          const controls = [page.getByRole("button", { name: "Spines" }), page.getByRole("button", { name: "Covers" }), page.getByRole("heading", { level: 2 }).first()];
          for (const control of controls) expect(clear(daily, await box(control))).toBe(true);
          if (await page.getByRole("search").count()) expect(clear(daily, await box(page.getByRole("search")))).toBe(true);
        });
      }
    });
  }

  test("on search it sits beside the Back button, which can still be pressed", async ({ page }) => {
    await page.goto("/search");
    const back = page.getByRole("button", { name: "Back", exact: true });
    await expect(button(page)).toBeVisible({ timeout: 20_000 });
    await expect(back).toBeVisible();
    await expect.poll(async () => clear(await box(button(page)), await box(back))).toBe(true);
    await back.click({ trial: true, timeout: 5000 });
  });

  test("under a title bar it sits in the bar, beside the search button", async ({ page }) => {
    await page.goto("/discover/fantasy");
    const search = page.getByRole("link", { name: "Search books" });
    await expect(search).toBeVisible({ timeout: 20_000 });
    const beside = await box(search);
    await expect.poll(async () => {
      const daily = await box(button(page));
      return daily.x + daily.width <= beside.x && daily.y < beside.y + beside.height;
    }).toBe(true);
    expect(clear(await box(button(page)), await box(page.getByRole("button", { name: "Back" })))).toBe(true);
  });
});
