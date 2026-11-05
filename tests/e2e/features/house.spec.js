// Scaffolded with AI assistance — see AI_USAGE.md
import { test, expect, BOOK, fitsScreen } from "./fixtures.js";
import { buy, fromMenu, goToPlace, inventory, openShop, placeAt, roomReady, useRealApi } from "../fixtures.js";
import { readProfile, readXp, seedReaderBook } from "../supabaseUser.js";

async function openRoom(page) {
  await page.goto("/house");
  await roomReady(page);
}

test("HOUSE-01 bookshelf → genre filters → both cover modes → book details", async ({ page }, testInfo) => {
  const { books } = await (await page.request.get("/api/user-books")).json();
  await openRoom(page);
  await goToPlace(page, "Bookshelf");
  await page.getByRole("button", { name: /^Bookshelf, \d+ books?$/ }).click({ position: { x: 8, y: 8 } });
  await expect(page).toHaveURL(/\/house\/shelf$/);
  const filters = page.getByRole("group", { name: "Filter by genre" });
  const labels = await filters.getByRole("button").allTextContents();
  for (const label of labels) {
    const button = filters.getByRole("button", { name: label.trim(), exact: true });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    const expected = label.trim() === "All" ? books : books.filter((book) => book.genres.includes(label.trim()));
    const shown = page.getByRole("region", { name: /^(To be read|Currently reading|Finished reading),/ }).getByRole("button", { name: / by / });
    await expect(shown).toHaveCount(expected.length);
    const names = await shown.evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label")));
    for (const book of expected) expect(names.some((name) => name.startsWith(`${book.title} by `))).toBe(true);
  }
  await filters.getByRole("button").first().click();
  const modes = page.getByRole("group", { name: "Show the books by" });
  for (const choice of ["Spines", "Covers"]) {
    await modes.getByRole("button", { name: choice }).click();
    await expect(modes.getByRole("button", { name: choice })).toHaveAttribute("aria-pressed", "true");
    await testInfo.attach(`own-shelf-${choice}`, { body: await page.screenshot(), contentType: "image/png" });
  }
  await page.getByRole("region", { name: /^To be read,/ }).getByRole("button", { name: /The Hobbit/ }).click();
  await expect(page.getByRole("dialog", { name: "Book details" })).toBeVisible();
  await fitsScreen(page);
});

test("HOUSE-02 move a book across all shelves, save reading progress and earn XP", async ({ page, reader }) => {
  const seeded = await seedReaderBook(reader.id, BOOK);
  try {
    await useRealApi(page);
    await page.goto("/house/shelf");
    const row = (name) => page.getByRole("region", { name: new RegExp(`^${name},`) });
    await row("To be read").getByRole("button", { name: new RegExp(BOOK.title) }).click();
    const card = page.getByRole("dialog", { name: "Book details" });
    await card.getByRole("button", { name: "Start reading" }).click();
    await card.getByRole("slider").fill("40");
    await expect(card.getByText("40% read")).toBeVisible();
    await card.getByRole("button", { name: "Close book" }).click();
    await expect(row("Currently reading").getByRole("button", { name: new RegExp(BOOK.title) })).toBeVisible();
    await page.reload();
    await row("Currently reading").getByRole("button", { name: new RegExp(BOOK.title) }).click();
    await expect(card.getByText("40% read")).toBeVisible();
    await card.getByRole("button", { name: "Mark as finished" }).click();
    await card.getByRole("button", { name: "Close book" }).click();
    await expect(row("Finished reading").getByRole("button", { name: new RegExp(BOOK.title) })).toBeVisible();
    await expect.poll(async () => (await readXp(reader.id)).some((event) => event.action === "finish_book" && event.xp === 100)).toBe(true);
    await expect.poll(async () => (await readProfile(reader.id)).coins).toBe(530);
    await page.getByRole("button", { name: /^Daily tasks/ }).click();
    const task = page.getByRole("region", { name: "Daily tasks" }).getByRole("listitem").filter({ hasText: "Update your reading progress" });
    await expect(task.getByText("Done", { exact: true })).toBeVisible();
  } finally {
    await seeded.remove();
  }
});

test("HOUSE-03 both room lamps turn off and back on", async ({ page }) => {
  await openRoom(page);
  for (const [place, name] of [["Chair", "Floor lamp"], ["Bed", "Table lamp"]]) {
    await goToPlace(page, place);
    const lamp = page.getByRole("button", { name, exact: true });
    await expect(lamp).toHaveAttribute("aria-pressed", "true");
    await lamp.click();
    await expect(lamp).toHaveAttribute("aria-pressed", "false");
    await lamp.click();
    await expect(lamp).toHaveAttribute("aria-pressed", "true");
  }
});

test("HOUSE-04 buy a poster, place it, move it and put it back into inventory", async ({ page, reader }) => {
  await openRoom(page);
  await goToPlace(page, "Chair");
  await buy(page, "Mountain poster");
  await expect(inventory(page).getByRole("button", { name: /Mountain poster/ })).toBeVisible();
  await expect.poll(async () => (await readProfile(reader.id)).coins).toBe(455);
  await placeAt(page, "Mountain poster", { x: 470, y: 188 });
  const poster = page.getByRole("button", { name: "Mountain poster", exact: true });
  await expect(poster).toBeVisible();
  const before = await poster.boundingBox();
  await poster.click();
  await poster.getByRole("button", { name: "Move Mountain poster", exact: true }).click();
  await page.getByRole("button", { name: "Move left", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  expect((await poster.boundingBox()).x).toBeLessThan(before.x);
  await poster.click();
  await poster.getByRole("button", { name: "Remove Mountain poster", exact: true }).click();
  const removal = page.getByRole("alertdialog", { name: "Remove “Mountain poster” from your room?", exact: true });
  await removal.getByRole("button", { name: "No, keep it", exact: true }).click();
  await expect(poster).toBeVisible();
  await poster.getByRole("button", { name: "Remove Mountain poster", exact: true }).click();
  await removal.getByRole("button", { name: "Yes, remove", exact: true }).click();
  await expect(poster).toHaveCount(0);
  await fromMenu(page, "Inventory");
  await expect(inventory(page).getByRole("button", { name: /Mountain poster/ })).toBeVisible();
  await page.reload();
  await roomReady(page);
  await fromMenu(page, "Inventory");
  await expect(inventory(page).getByRole("button", { name: /Mountain poster/ })).toBeVisible();
});

for (const [kind, first, second, place, spot] of [
  ["chair", "Wingback chair", "Rocking chair", "Chair", "in the reading nook"],
  ["curtains", "Rose curtains", "Lavender curtains", "Window", "at the window"],
  ["bedding", "Gingham bedding", "Tartan bedding", "Bed", "on the bed"],
]) {
  test(`HOUSE-05 ${kind}: fixed replacement, swap and restore inventory`, async ({ page }) => {
    await openRoom(page);
    await goToPlace(page, place);
    await buy(page, first);
    await placeAt(page, first, spot);
    await expect(page.getByRole("button", { name: first, exact: true })).toBeVisible();
    await buy(page, second);
    await placeAt(page, second, spot);
    const replacement = page.getByRole("button", { name: second, exact: true });
    await expect(replacement).toBeVisible();
    await expect(page.getByRole("button", { name: first, exact: true })).toHaveCount(0);
    await replacement.click();
    await expect(replacement.getByRole("button", { name: `Move ${second}`, exact: true })).toHaveCount(0);
    await replacement.getByRole("button", { name: `Remove ${second}`, exact: true }).click();
    await page.getByRole("alertdialog", { name: `Remove “${second}” from your room?`, exact: true }).getByRole("button", { name: "Yes, remove", exact: true }).click();
    await fromMenu(page, "Inventory");
    await expect(inventory(page).getByRole("button", { name: new RegExp(first) })).toBeVisible();
    await expect(inventory(page).getByRole("button", { name: new RegExp(second) })).toBeVisible();
  });
}

test("HOUSE-06 spend exactly 480 coins; a zero balance blocks another purchase", async ({ page, reader }) => {
  await openRoom(page);
  // 160 + 140 + 120 + 60 = the new reader's 480 coins.
  for (const name of ["Papasan chair", "Wingback chair", "Rocking chair", "Monstera"]) {
    await buy(page, name);
    // Confirm closes before the asynchronous coin write adds the piece to inventory.
    await expect(inventory(page).getByRole("button", { name: new RegExp(name) })).toBeVisible();
  }
  await expect.poll(async () => (await readProfile(reader.id)).coins).toBe(0);
  const shop = await openShop(page);
  await shop.getByRole("button", { name: /Mountain poster/ }).click();
  const confirm = page.getByRole("dialog", { name: "Buy Mountain poster?" });
  await expect(confirm).toContainText("Not enough credits.");
  await expect(confirm.getByRole("button", { name: "Confirm" })).toBeDisabled();
  await confirm.getByRole("button", { name: "Cancel" }).click();
  expect((await readProfile(reader.id)).coins).toBe(0);
  await page.reload();
  await roomReady(page);
  await expect(page.locator(".home__credits")).toContainText("0");
});

test("HOUSE-07 daily quote from the noticeboard saves to the salon and can be removed", async ({ page }) => {
  await openRoom(page);
  await goToPlace(page, "Corkboard");
  await page.getByRole("button", { name: "Notice board", exact: true }).click();
  const board = page.getByRole("dialog", { name: "Notice board" });
  await expect(board).toContainText("So many books, so little time.");
  await board.getByRole("button", { name: "Save quote", exact: true }).click();
  await expect(board.getByRole("button", { name: "Unsave", exact: true })).toBeVisible();
  await board.getByRole("link", { name: "See saved quotes" }).click();
  await page.getByRole("tab", { name: "Profile", exact: true }).click();
  const quotes = page.getByRole("list", { name: "Your saved quotes" });
  const quote = quotes.getByRole("listitem").filter({ hasText: "So many books, so little time." });
  await expect(quote).toBeVisible();
  await quote.getByRole("button", { name: /^Remove quote/ }).click();
  await expect(quote).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("So many books, so little time.", { exact: false })).toHaveCount(0);
});

test("HOUSE-08 mood check-in recommends a book; save and unsave its quote", async ({ page }) => {
  await page.route("**/api/recommendations*", (route) => route.fulfill({ json: {
    mood: "calm", category: "nature", workId: BOOK.id, book: BOOK,
    quote: { quoteText: "A library opens a thousand doors.", author: "Test Author", work: BOOK.title },
  } }));
  await openRoom(page);
  await fromMenu(page, "Mood check-in");
  const checkIn = page.getByRole("dialog", { name: "How are you feeling today?" });
  await expect(checkIn.getByRole("button", { name: "Continue" })).toBeDisabled();
  await checkIn.getByRole("button", { name: /^Calm/ }).click();
  await checkIn.getByRole("button", { name: "Continue" }).click();
  const result = page.getByRole("dialog", { name: "A book for your mood" });
  await expect(result.getByRole("heading", { name: BOOK.title })).toBeVisible();
  await result.getByRole("button", { name: "Save quote", exact: true }).click();
  await expect(result.getByRole("button", { name: "Unsave", exact: true })).toBeVisible();
  await result.getByRole("button", { name: "Unsave", exact: true }).click();
  await expect(result.getByRole("button", { name: "Save quote", exact: true })).toBeVisible();
});
