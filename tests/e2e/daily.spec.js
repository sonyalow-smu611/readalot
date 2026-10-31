// Scaffolded with AI assistance — see AI_USAGE.md
import { expect, test } from "./fixtures.js";

// Daily tasks on the map. For now the day is kept in the browser (town/daily.js), so each test
// sets it up in localStorage before the town loads.
const DAY = 24 * 60 * 60 * 1000;
const EVERY_TASK = ["check-in", "reading", "visit-room", "send-message", "add-book", "leave-note"];

function dayKey(offset = 0) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(new Date(Date.now() + offset * DAY));
}

async function setDaily(page, readerId, state) {
  const saved = { day: dayKey(), done: [], streak: 0, lastClaim: null, freezes: 2, notice: null, shown: null, offset: 0, ...state };
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [`readalot-daily:${readerId}`, JSON.stringify(saved)]);
}

async function openTown(page) {
  await page.goto("/");
  await expect(page.getByText("Loading the town…")).toBeHidden();
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
  await expect(page.getByText("Loading the town…")).toBeHidden();
  await expect(page.getByRole("region", { name: "Daily tasks" })).toBeHidden();
});

test("a task's Go takes you to its building", async ({ page }) => {
  const panel = await openTown(page);
  await panel.getByRole("button", { name: "Go: Update your reading progress" }).click();
  await expect(panel).toBeHidden();
  await expect(page.getByRole("dialog", { name: "Your house" })).toBeVisible();
});

test("all three done: claim the reward and the streak starts", async ({ page, reader }) => {
  await setDaily(page, reader.id, { done: EVERY_TASK });
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
  await setDaily(page, reader.id, { day: dayKey(-2), streak: 4, lastClaim: dayKey(-2), freezes: 2 });
  const panel = await openTown(page);
  await expect(panel).toContainText("a streak freeze kept your 4-day streak safe");
  await expect(panel).toContainText("4-day streak");
  await expect(panel.getByLabel("1 of 2 streak freezes")).toBeVisible();
});

test("with no freezes left, a missed day ends the streak", async ({ page, reader }) => {
  await setDaily(page, reader.id, { day: dayKey(-3), streak: 5, lastClaim: dayKey(-3), freezes: 1 });
  const panel = await openTown(page);
  await expect(panel).toContainText("Your 5-day streak ended");
  await expect(panel).toContainText("0-day streak");
});

// The same tasks from anywhere else in the app, on a tab on the edge of the page.
test.describe("on other pages", () => {
  const tab = (page) => page.getByRole("button", { name: /^Daily tasks/ });

  test("the tab opens today's tasks, with what's left", async ({ page, reader }) => {
    await setDaily(page, reader.id, { done: ["check-in"] });
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
    await setDaily(page, reader.id, { done: ["check-in"], shown: dayKey() });
    await page.goto("/search");
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
    await setDaily(page, reader.id, { done: ["check-in"], shown: dayKey() });
    await page.goto("/search");
    await tab(page).click();
    await page.getByRole("button", { name: "Go: Update your reading progress" }).click();
    await expect(page).toHaveURL(/\/house$/);
    await expect(page.getByRole("region", { name: "Daily tasks" })).toBeHidden();
  });

  test("the reward can be claimed there too", async ({ page, reader }) => {
    await setDaily(page, reader.id, { done: EVERY_TASK, shown: dayKey() });
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
    await expect(page.getByText("Loading the town…")).toBeHidden();
    await expect(page.getByRole("button", { name: /Daily tasks, / })).toHaveCount(1);
  });
});
