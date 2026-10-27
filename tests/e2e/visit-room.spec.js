import { expect, test } from "./fixtures.js";

// Visiting another reader's room: from their profile in the Cafe into a room drawn from the same
// template as My Room, with their books and furniture. Visitors look around; they can't change it.
test.use({ viewport: { width: 480, height: 720 } });

test.beforeEach(async ({ page }) => {
  // today's mood check-in already answered, so it does not open over My Room
  await page.addInitScript(() => {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    localStorage.setItem("readalot.moodCheckIn", `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  });
  await page.route("**/api/weather*", (route) =>
    route.fulfill({ json: { scene: "sunny", temperature: 27, weatherCode: 0, isDay: true } })
  );
});

const roomOf = (page, name) => page.getByRole("region", { name: new RegExp(`^${name}'s room`) });

// straight into a reader's room, once it has drawn
async function visit(page, id, name) {
  await page.goto(`/people/${id}/room`);
  await expect(roomOf(page, name)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Bookshelf, \d+ books?$/ })).toBeVisible();
}

test("a reader's profile in the Cafe has a button into their room", async ({ page }) => {
  await page.goto("/cafe");
  await page.getByRole("button", { name: /^Walk to Emma Tan/ }).click();
  await page.getByRole("dialog", { name: "Meet Emma Tan" }).getByRole("button", { name: "Visit Room →" }).click();

  await expect(page).toHaveURL(/\/people\/reader-emma$/);
  await expect(page.getByRole("heading", { level: 1, name: "Emma Tan" })).toBeVisible();
  await page.getByRole("link", { name: "Visit Emma's room" }).click();

  await expect(page).toHaveURL(/\/people\/reader-emma\/room$/);
  await expect(page.getByRole("heading", { level: 1, name: "Emma's Room" })).toBeVisible();
  await expect(roomOf(page, "Emma")).toBeVisible();
  // her three books are on the bookshelf
  await expect(page.getByRole("button", { name: "Bookshelf, 3 books" })).toBeVisible();
  await expect(page.getByRole("button", { name: "The Hobbit by J. R. R. Tolkien" })).toBeAttached();

  await page.getByRole("link", { name: "Back to Emma's profile" }).click();
  await expect(page).toHaveURL(/\/people\/reader-emma$/);
});

test("someone else's room has no room menu, credits or mood check-in", async ({ page }) => {
  // the mood check-in would open on a first visit of the day in My Room
  await page.addInitScript(() => localStorage.removeItem("readalot.moodCheckIn"));
  await visit(page, "reader-ayaan", "Ayaan");
  await expect(page.getByRole("button", { name: "Dune by Frank Herbert" })).toBeAttached();
  await expect(page.getByRole("button", { name: "Room menu" })).toHaveCount(0);
  // My Room shows the reader's 480 credits in the corner
  await expect(page.getByText("480")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

// --- Their furniture ------------------------------------------------------------------------

const piece = (page, name) => page.getByRole("button", { name, exact: true });

test("each reader's room has their own furniture, which a visitor can't take down", async ({ page }) => {
  await visit(page, "reader-emma", "Emma");
  for (const name of ["Wingback chair", "Moon poster", "Botanical print", "Monstera", "Ginger tabby"]) {
    await expect(piece(page, name)).toHaveCount(1);
  }
  await page.getByRole("navigation", { name: "Places in the room" }).getByRole("button", { name: "Chair" }).click();
  await page.waitForTimeout(900);
  await piece(page, "Moon poster").click();
  await expect(page.getByText("Remove", { exact: true })).toHaveCount(0);

  await visit(page, "reader-ayaan", "Ayaan");
  await expect(piece(page, "Papasan chair")).toHaveCount(1);
  await expect(piece(page, "Black cat")).toHaveCount(1);
  await expect(piece(page, "Wingback chair")).toHaveCount(0);
});

test("furniture placed in My Room stays in my room, and theirs in theirs", async ({ page }) => {
  await page.goto("/house");
  await expect(page.getByText("Opening your shelf")).toBeHidden();
  await page.getByRole("button", { name: "Room menu" }).click();
  await page.getByRole("button", { name: "Shop", exact: true }).click();
  await page.getByRole("region", { name: "Decoration shop" }).getByRole("button", { name: /Mountain poster/ }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await page.getByRole("region", { name: "Inventory" }).getByRole("button", { name: /Mountain poster/ }).click();
  await page.getByRole("button", { name: "Put Mountain poster on the wall by the reading chair" }).click();
  await expect(piece(page, "Mountain poster")).toHaveCount(1);

  // over to Emma's, through the town, so My Room keeps its furniture for the visit
  await page.getByRole("link", { name: "Back to town" }).click();
  await page.getByRole("button", { name: "Places" }).click();
  await page.getByRole("navigation", { name: "Places in town" }).getByRole("button", { name: /^Emma's house/ }).click();
  await page.getByRole("dialog", { name: "Emma's house" }).getByRole("button", { name: "Visit Emma" }).click();
  await page.getByRole("link", { name: "Visit Emma's room" }).click();
  await expect(roomOf(page, "Emma")).toBeVisible();
  await expect(piece(page, "Moon poster")).toHaveCount(1);
  await expect(piece(page, "Mountain poster")).toHaveCount(0);

  // back through her profile and the town
  for (let step = 0; step < 3; step += 1) await page.goBack();
  await expect(page).toHaveURL(/\/house$/);
  await expect(piece(page, "Mountain poster")).toHaveCount(1);
  await expect(piece(page, "Moon poster")).toHaveCount(0);
});

// --- Their books ----------------------------------------------------------------------------

test("a book off their shelf shows its details, with nothing a visitor can change", async ({ page }) => {
  await visit(page, "reader-emma", "Emma");
  await page.getByRole("button", { name: "The Hobbit by J. R. R. Tolkien" }).click();

  const card = page.getByRole("dialog", { name: "Book details" });
  await expect(card).toBeVisible({ timeout: 8000 });
  await expect(card.getByRole("heading", { name: "The Hobbit" })).toBeVisible();
  await expect(card.getByText("J. R. R. Tolkien")).toBeVisible();
  await expect(card.getByText("Fantasy")).toBeVisible();
  await expect(card.getByText("On Emma's Finished reading shelf")).toBeVisible();
  await expect(card.getByRole("group", { name: "Reading status" })).toHaveCount(0);
  await expect(card.getByRole("button", { name: "Remove from shelf" })).toHaveCount(0);
  await expect(card.getByRole("slider")).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(card).toBeHidden();
  await expect(page.getByRole("button", { name: "The Hobbit by J. R. R. Tolkien" })).toBeAttached();
});

test("the book on their coffee table is the one they're reading", async ({ page }) => {
  await visit(page, "reader-emma", "Emma");
  await page.getByRole("button", { name: /^Currently reading The Secret History/ }).click();
  const card = page.getByRole("dialog", { name: "Currently reading" });
  await expect(card.getByRole("heading", { name: "The Secret History" })).toBeVisible();
  await expect(card.getByText("Emma is reading this")).toBeVisible();
  // demo books have no book page to open
  await expect(card.getByRole("link")).toHaveCount(0);
});

test("their bookshelf opens their shelf page: every book, and nothing to add or search", async ({ page }) => {
  await visit(page, "reader-sofia", "Sofia");
  await page.getByRole("button", { name: /^Bookshelf, \d+ books$/ }).click({ position: { x: 8, y: 8 } });

  await expect(page).toHaveURL(/\/people\/reader-sofia\/room\/shelf$/);
  await expect(page.getByRole("heading", { level: 1, name: "Sofia's Shelf" })).toBeVisible();
  for (const shelf of ["To be read", "Currently reading", "Finished reading"]) {
    await expect(page.getByRole("region", { name: `${shelf}, 1 book` })).toBeVisible();
  }
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Discover books" })).toHaveCount(0);

  // a cover opens the same read-only card as in the room
  await page.getByRole("region", { name: "Currently reading, 1 book" }).getByRole("button", { name: /Pride and Prejudice/ }).click();
  const card = page.getByRole("dialog", { name: "Book details" });
  await expect(card.getByText("On Sofia's Currently reading shelf")).toBeVisible();
  await expect(card.getByRole("button", { name: "Remove from shelf" })).toHaveCount(0);
  await card.getByRole("button", { name: "Close book" }).click();

  await page.getByRole("link", { name: "Back to Sofia's room" }).click();
  await expect(page).toHaveURL(/\/people\/reader-sofia\/room$/);
});

// --- Leaving a note -------------------------------------------------------------------------

async function openBoard(page) {
  await page.getByRole("navigation", { name: "Places in the room" }).getByRole("button", { name: "Corkboard" }).click();
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: "Notice board" }).click();
  return page.getByRole("dialog", { name: "Notice board" });
}

async function leaveNote(page, name, text) {
  await page.getByRole("button", { name: "Leave a note" }).click();
  const card = page.getByRole("dialog", { name: `Leave a note for ${name}` });
  await card.getByRole("textbox", { name: "Your note" }).fill(text);
  await card.getByRole("button", { name: "Post note" }).click();
  await expect(card).toBeHidden();
}

test.describe("notes on the notice board", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/quote/today", (route) =>
      route.fulfill({ json: { quoteText: "So many books, so little time.", author: "", topic: "books" } })
    );
  });

  test("Leave a note pins a signed note on their notice board, under the Quote of the Day", async ({ page }) => {
    await visit(page, "reader-emma", "Emma");
    await page.getByRole("button", { name: "Leave a note" }).click();
    const card = page.getByRole("dialog", { name: "Leave a note for Emma" });
    const post = card.getByRole("button", { name: "Post note" });
    await expect(card.getByText("0/140")).toBeVisible();
    await expect(post).toBeDisabled();
    await card.getByRole("textbox", { name: "Your note" }).fill("   ");
    await expect(post).toBeDisabled();
    await card.getByRole("textbox", { name: "Your note" }).fill("Loved your shelf!");
    await expect(card.getByText("17/140")).toBeVisible();
    await post.click();

    await expect(page.getByRole("status")).toHaveText("Your note is on Emma's board");
    const board = await openBoard(page);
    await expect(board.getByText("“So many books, so little time.”")).toBeVisible();
    const note = board.getByRole("listitem").filter({ hasText: "Loved your shelf!" });
    await expect(note).toBeVisible();
    await expect(note.getByText("From Reader")).toBeVisible();
    await expect(board.getByText("Saved on this browser only")).toBeVisible();
  });

  test("notes stay on that reader's board, after a reload too, and can be taken down", async ({ page }) => {
    await visit(page, "reader-emma", "Emma");
    await leaveNote(page, "Emma", "See you at book club");
    await page.reload();
    await expect(roomOf(page, "Emma")).toBeVisible();
    let board = await openBoard(page);
    await expect(board.getByText("See you at book club")).toBeVisible();
    await board.getByRole("button", { name: "Close" }).click();

    await visit(page, "reader-noah", "Noah");
    board = await openBoard(page);
    await expect(board.getByText("No notes yet. Be the first to leave one.")).toBeVisible();
    await expect(board.getByText("See you at book club")).toHaveCount(0);

    await visit(page, "reader-emma", "Emma");
    board = await openBoard(page);
    await board.getByRole("listitem").filter({ hasText: "See you at book club" }).getByRole("button", { name: "Take down" }).click();
    await expect(board.getByText("No notes yet. Be the first to leave one.")).toBeVisible();
  });

  // the corkboard's pixels in the room's canvas, as one string to compare
  function corkboardPixels(page) {
    return page.getByRole("button", { name: "Notice board" }).evaluate((button) => {
      const canvas = document.querySelector(".strip canvas");
      const b = button.getBoundingClientRect();
      const c = canvas.getBoundingClientRect();
      const sx = canvas.width / c.width;
      const sy = canvas.height / c.height;
      const x = Math.floor((b.left - c.left) * sx);
      const y = Math.floor((b.top - c.top) * sy);
      const data = canvas.getContext("2d").getImageData(x, y, Math.floor(b.width * sx), Math.floor(b.height * sy)).data;
      let hash = 0;
      for (let i = 0; i < data.length; i += 1) hash = (hash * 31 + data[i]) >>> 0;
      return hash;
    });
  }

  test("notes are pinned on the corkboard itself, three at most", async ({ page }) => {
    await visit(page, "reader-emma", "Emma");
    await page.waitForTimeout(400);
    const plain = await corkboardPixels(page);

    await leaveNote(page, "Emma", "First!");
    await expect.poll(() => corkboardPixels(page)).not.toBe(plain);
    await leaveNote(page, "Emma", "Second");
    await leaveNote(page, "Emma", "Third");
    await page.waitForTimeout(400);
    const three = await corkboardPixels(page);
    await leaveNote(page, "Emma", "Fourth");
    await page.waitForTimeout(400);
    expect(await corkboardPixels(page)).toBe(three);

    // all taken down: the plain corkboard again
    const board = await openBoard(page);
    for (let left = 4; left > 0; left -= 1) await board.getByRole("button", { name: "Take down" }).first().click();
    await board.getByRole("button", { name: "Close" }).click();
    await expect.poll(() => corkboardPixels(page)).toBe(plain);
  });

  test("My Room has no Leave a note, and its corkboard opens the plain Quote of the Day", async ({ page }) => {
    await page.goto("/house");
    await expect(page.getByRole("button", { name: /^Bookshelf, \d+ books$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Leave a note" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Notice board" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Quote of the day" })).toBeAttached();
  });
});

test("a room address for a reader who doesn't exist says so and links back to the Cafe", async ({ page }) => {
  await page.goto("/people/reader-nobody/room");
  await expect(page.getByText("We couldn't find that reader.")).toBeVisible();
  await page.getByRole("link", { name: "Back to the Cafe" }).click();
  await expect(page).toHaveURL(/\/cafe$/);
});
