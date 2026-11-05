import { buy, expect, goToPlace, mockQuote, mockWeather, nextPaint, placeAt, roomCanvas, roomReady, roomRegion, skipMoodCheckIn, test, townReady } from "./fixtures.js";
import { randomUUID } from "node:crypto";
import { signInPage } from "./supabaseUser.js";
import { EMMA, mockFriends } from "./townFriends.js";

// Visiting another reader's room: from their profile in the Cafe into a room drawn from the same
// template as My Room, with their books and furniture. Visitors look around; they can't change it.
test.use({ viewport: { width: 480, height: 720 } });

test.beforeEach(async ({ page }) => {
  await skipMoodCheckIn(page);
  await mockWeather(page);
});

const roomOf = (page, name) => roomRegion(page, `${name}'s`);

// straight into a reader's room, once it has drawn
async function visit(page, id, name) {
  await page.goto(`/people/${id}/room`);
  await expect(roomOf(page, name)).toBeVisible();
  await roomReady(page);
}

test.describe("getting there", () => {
  test("a reader's profile in the Cafe has a button into their room", async ({ page }) => {
    await page.goto("/cafe");
    // tapping a reader in the café walks over to them; their card opens on arrival
    await page.getByRole("button", { name: /^Walk to Emma Tan/ }).press("Enter");
    const card = page.getByRole("dialog", { name: "Meet Emma Tan" });
    await expect(card).toBeVisible({ timeout: 15000 });
    await card.getByRole("link", { name: "Visit Emma's room" }).click();

    await expect(page).toHaveURL(/\/people\/emma\.reads\/room$/);
    await expect(page.getByRole("heading", { level: 1, name: "Emma's Room" })).toBeVisible();
    await expect(roomOf(page, "Emma")).toBeVisible();
    // her three books are on the bookshelf
    await expect(page.getByRole("button", { name: "Bookshelf, 3 books" })).toBeVisible();
    await expect(page.getByRole("button", { name: "The Hobbit by J. R. R. Tolkien" })).toBeAttached();

    // Back goes to the page it came from, the Cafe
    await page.getByRole("link", { name: "Back to the Cafe" }).click();
    await expect(page).toHaveURL(/\/cafe$/);
  });

  test("someone else's room has no room menu, credits or mood check-in", async ({ page }) => {
    // the mood check-in would open on a first visit of the day in My Room
    await page.addInitScript(() => localStorage.removeItem("readalot.moodCheckIn"));
    await visit(page, "ayaan.pages", "Ayaan");
    await expect(page.getByRole("button", { name: "Dune by Frank Herbert" })).toBeAttached();
    await expect(page.getByRole("button", { name: "Room menu" })).toHaveCount(0);
    // My Room shows the reader's 480 credits in the corner
    await expect(page.getByText("480")).toHaveCount(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("a room address for a reader who doesn't exist says so and links back to the Cafe", async ({ page }) => {
    await page.goto("/people/reader-nobody/room");
    await expect(page.getByText("We couldn't find that reader.")).toBeVisible();
    await page.getByRole("link", { name: "Back to the Cafe" }).click();
    await expect(page).toHaveURL(/\/cafe$/);
  });
});

test.describe("their furniture", () => {
  test("a sample reader's furniture comes from the server, like anyone's", async ({ page, reader }) => {
    const answer = await page.request.get("/api/rooms/emma.reads/furniture", {
      headers: { Authorization: `Bearer ${reader.session.access_token}` },
    });
    expect(answer.ok()).toBe(true);
    const { pieces } = await answer.json();
    expect(pieces.map((piece) => piece.id)).toEqual(["chair-wingback", "poster-moon", "frame-botanical", "plant-monstera", "cat-ginger"]);
    expect(pieces.every((piece) => piece.uid && piece.zone)).toBe(true);
  });

  const piece = (page, name) => page.getByRole("button", { name, exact: true });

  test("each reader's room has their own furniture, which a visitor can't take down", async ({ page }) => {
    await visit(page, "emma.reads", "Emma");
    for (const name of ["Wingback chair", "Moon poster", "Botanical print", "Monstera", "Ginger tabby"]) {
      await expect(piece(page, name)).toHaveCount(1);
    }
    await goToPlace(page, "Chair");
    await piece(page, "Moon poster").click();
    await expect(page.getByText("Remove", { exact: true })).toHaveCount(0);

    await visit(page, "ayaan.pages", "Ayaan");
    await expect(piece(page, "Papasan chair")).toHaveCount(1);
    await expect(piece(page, "Black cat")).toHaveCount(1);
    await expect(piece(page, "Wingback chair")).toHaveCount(0);
  });

  test("furniture placed in My Room stays in my room, and theirs in theirs", async ({ page }) => {
    await mockFriends(page, { friends: [EMMA] });
    await page.goto("/house");
    await roomReady(page);
    await buy(page, "Mountain poster");
    await placeAt(page, "Mountain poster", "by the reading chair");
    await expect(piece(page, "Mountain poster")).toHaveCount(1);

    // over to Emma's, through the town, so My Room keeps its furniture for the visit
    await page.getByRole("link", { name: "Back to town" }).click();
    await expect(page).toHaveURL(/\/$/);
    await townReady(page);
    await page.getByRole("navigation", { name: "Places in the room" }).waitFor({ state: "detached" });
    await page.getByRole("button", { name: "Places" }).click();
    await page.getByRole("navigation", { name: "Places in town" }).getByRole("button", { name: /^Emma's house/ }).click();
    // her front door leads straight into her room
    await page.getByRole("dialog", { name: "Emma's house" }).getByRole("button", { name: "Visit Emma" }).click();
    await expect(roomOf(page, "Emma")).toBeVisible({ timeout: 15000 });
    await expect(piece(page, "Moon poster")).toHaveCount(1);
    await expect(piece(page, "Mountain poster")).toHaveCount(0);

    // back out through the town
    for (let step = 0; step < 2; step += 1) await page.goBack();
    await expect(page).toHaveURL(/\/house$/);
    await expect(piece(page, "Mountain poster")).toHaveCount(1);
    await expect(piece(page, "Moon poster")).toHaveCount(0);
  });
});

test.describe("their books", () => {
  test("a book off their shelf shows its details, with nothing a visitor can change", async ({ page }) => {
    await visit(page, "emma.reads", "Emma");
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
    await visit(page, "emma.reads", "Emma");
    await page.getByRole("button", { name: /^Currently reading The Secret History/ }).click();
    const card = page.getByRole("dialog", { name: "Currently reading" });
    await expect(card.getByRole("heading", { name: "The Secret History" })).toBeVisible();
    await expect(card.getByText("Emma is reading this")).toBeVisible();
    // demo books have no book page to open
    await expect(card.getByRole("link")).toHaveCount(0);
  });

  test("their bookshelf opens their shelf page: every book, and nothing to add or search", async ({ page }) => {
    await visit(page, "sofia.shelves", "Sofia");
    await page.getByRole("button", { name: /^Bookshelf, \d+ books$/ }).click({ position: { x: 8, y: 8 } });

    await expect(page).toHaveURL(/\/people\/sofia\.shelves\/room\/shelf$/);
    await expect(page.getByRole("heading", { level: 1, name: "Sofia's Shelf" })).toBeAttached();
    // her bookcase, headed like mine: her name on the sign, and Spines / Covers
    await expect(page.getByRole("heading", { level: 2, name: "Sofia's Shelf" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Show the books by" }).getByRole("button", { name: "Covers" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Filter by genre" })).toBeVisible();
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
    await expect(page).toHaveURL(/\/people\/sofia\.shelves\/room$/);
  });

  test("a book on their shelf page opens the genre page's card, without the status buttons", async ({ page }) => {
    await page.goto("/people/sofia.shelves/room/shelf");
    const cover = page.getByRole("region", { name: "Currently reading, 1 book" }).getByRole("button", { name: /Pride and Prejudice/ });
    await cover.click();

    const card = page.getByRole("dialog", { name: "Book details" });
    await expect(card.getByRole("heading", { name: "Pride and Prejudice" })).toBeVisible();
    await expect(card.getByText("On Sofia's Currently reading shelf")).toBeVisible();
    // the genre card's synopsis, which the room's visitor card doesn't have
    await expect(card.getByText("No synopsis for this book yet.")).toBeVisible();
    await expect(card.getByText("Reading status")).toHaveCount(0);
    await expect(card.getByRole("button", { name: /^(Want to Read|Reading|Read)$/ })).toHaveCount(0);
    await expect(card.getByRole("slider")).toHaveCount(0);
    await expect(card.getByRole("button", { name: "Remove from shelf" })).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(card).toBeHidden();
    await expect(cover).toBeFocused();
  });
});

async function openBoard(page) {
  await goToPlace(page, "Corkboard");
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

// Notes live on the test server, which every test shares: each test takes down the notes its
// reader left, so the next one starts with empty boards. reader: the signed-in reader, or
// someoneElse() below.
const BOARDS = ["emma.reads", "noah.bookmarks", "mei.margins"];

async function takeDownMyNotes(request, reader, boards = BOARDS) {
  const headers = { Authorization: `Bearer ${reader.session.access_token}` };
  for (const board of boards) {
    const response = await request.get(`/api/rooms/${board}/notes`, { headers });
    if (!response.ok()) continue;
    const { notes } = await response.json();
    for (const note of notes.filter((item) => item.authorId === reader.id)) {
      await request.delete(`/api/rooms/${board}/notes/${note.id}`, { headers });
    }
  }
}

// Another reader, to leave notes the signed-in reader didn't write. The test server has no
// Supabase, so it can't check a sign-in and takes the account id a token carries: this one's is
// made up, and it isn't signed.
function someoneElse() {
  const id = randomUUID();
  const part = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return { id, session: { access_token: `${part({ alg: "none" })}.${part({ sub: id })}.` } };
}

async function pinNote(request, from, board, text, author) {
  const response = await request.post(`/api/rooms/${board}/notes`, {
    headers: { Authorization: `Bearer ${from.session.access_token}` },
    data: { text, author },
  });
  expect(response.ok()).toBe(true);
}

test.describe("notes on the notice board", () => {
  test.beforeEach(async ({ page }) => {
    await mockQuote(page);
  });

  test.afterEach(async ({ request, reader }) => {
    await takeDownMyNotes(request, reader);
  });

  test("a note is on their board on another device too", async ({ page, browser, reader }, testInfo) => {
    await visit(page, "emma.reads", "Emma");
    await leaveNote(page, "Emma", "Kept on the server");

    // the same reader on a second device: a fresh browser, with nothing saved from the first
    const device = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    const other = await device.newPage();
    await signInPage(other, reader.session);
    await skipMoodCheckIn(other);
    await mockWeather(other);
    await mockQuote(other);
    await visit(other, "emma.reads", "Emma");
    const board = await openBoard(other);
    const note = board.getByRole("listitem").filter({ hasText: "Kept on the server" });
    await expect(note).toBeVisible();
    await expect(note.getByText("From Reader")).toBeVisible();
    await device.close();
  });

  test("Leave a note pins a signed note on their notice board, under the Quote of the Day", async ({ page }) => {
    await visit(page, "emma.reads", "Emma");
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
  });

  test("notes stay on that reader's board, after a reload too, and can be taken down", async ({ page }) => {
    await visit(page, "emma.reads", "Emma");
    await leaveNote(page, "Emma", "See you at book club");
    await page.reload();
    await expect(roomOf(page, "Emma")).toBeVisible();
    let board = await openBoard(page);
    await expect(board.getByText("See you at book club")).toBeVisible();
    await board.getByRole("button", { name: "Close" }).click();

    await visit(page, "noah.bookmarks", "Noah");
    board = await openBoard(page);
    await expect(board.getByText("No notes yet. Be the first to leave one.")).toBeVisible();
    await expect(board.getByText("See you at book club")).toHaveCount(0);

    await visit(page, "emma.reads", "Emma");
    board = await openBoard(page);
    await board.getByRole("listitem").filter({ hasText: "See you at book club" }).getByRole("button", { name: "Take down" }).click();
    await expect(board.getByText("No notes yet. Be the first to leave one.")).toBeVisible();
  });

  test("their notice board has Leave a note, which pins the note on the board", async ({ page }) => {
    await visit(page, "noah.bookmarks", "Noah");
    let board = await openBoard(page);
    await board.getByRole("button", { name: "Leave a note" }).click();
    let card = page.getByRole("dialog", { name: "Leave a note for Noah" });
    await card.getByRole("button", { name: "Cancel" }).click();
    board = page.getByRole("dialog", { name: "Notice board" });
    await expect(board.getByText("No notes yet. Be the first to leave one.")).toBeVisible();

    await board.getByRole("button", { name: "Leave a note" }).click();
    card = page.getByRole("dialog", { name: "Leave a note for Noah" });
    await card.getByRole("textbox", { name: "Your note" }).fill("Your shelf is so tidy");
    await card.getByRole("button", { name: "Post note" }).click();
    await expect(card).toBeHidden();
    await expect(board.getByRole("listitem").filter({ hasText: "Your shelf is so tidy" })).toBeVisible();
    await expect(page.getByRole("status")).toHaveText("Your note is on Noah's board");
  });

  test("a board that can't load says so, and Try again loads it", async ({ page }) => {
    let down = true;
    await page.route("**/api/rooms/*/notes", (route) =>
      down && route.request().method() === "GET" ? route.fulfill({ status: 500, json: { error: "Server error" } }) : route.fallback(),
    );
    await visit(page, "emma.reads", "Emma");
    const board = await openBoard(page);
    await expect(board.getByText("Couldn't load the notes.")).toBeVisible();
    await expect(board.getByText("No notes yet. Be the first to leave one.")).toHaveCount(0);

    down = false;
    await board.getByRole("button", { name: "Retry" }).click();
    await expect(board.getByText("No notes yet. Be the first to leave one.")).toBeVisible();
  });

  test("Post note says Posting… and can't be pressed again while the note is on its way", async ({ page }) => {
    let send;
    const held = new Promise((resolve) => (send = resolve));
    await page.route("**/api/rooms/*/notes", async (route) => {
      if (route.request().method() === "POST") await held;
      await route.fallback();
    });
    await visit(page, "emma.reads", "Emma");
    await page.getByRole("button", { name: "Leave a note" }).click();
    const card = page.getByRole("dialog", { name: "Leave a note for Emma" });
    await card.getByRole("textbox", { name: "Your note" }).fill("Just once");
    await card.getByRole("button", { name: "Post note" }).click();
    await expect(card.getByRole("button", { name: "Posting…" })).toBeDisabled();

    send();
    await expect(card).toBeHidden();
    const board = await openBoard(page);
    await expect(board.getByRole("listitem").filter({ hasText: "Just once" })).toHaveCount(1);
  });

  test("a note that can't be pinned stays in the box, with a message", async ({ page }) => {
    await page.route("**/api/rooms/*/notes", (route) =>
      route.request().method() === "POST" ? route.fulfill({ status: 500, json: { error: "Server error" } }) : route.fallback(),
    );
    await visit(page, "emma.reads", "Emma");
    await page.getByRole("button", { name: "Leave a note" }).click();
    const card = page.getByRole("dialog", { name: "Leave a note for Emma" });
    await card.getByRole("textbox", { name: "Your note" }).fill("Will this stick?");
    await card.getByRole("button", { name: "Post note" }).click();
    await expect(card.getByRole("alert")).toHaveText("Your note couldn't be pinned. Try again.");
    await expect(card.getByRole("textbox", { name: "Your note" })).toHaveValue("Will this stick?");
  });

  test("a visitor can take down only the notes they left", async ({ page, request }) => {
    // a note someone else left on Emma's board earlier
    const maya = someoneElse();
    await pinNote(request, maya, "emma.reads", "Lend me Circe?", "Maya");
    try {
      await visit(page, "emma.reads", "Emma");
      await leaveNote(page, "Emma", "Mine to take down");

      const board = await openBoard(page);
      const theirs = board.getByRole("listitem").filter({ hasText: "Lend me Circe?" });
      const mine = board.getByRole("listitem").filter({ hasText: "Mine to take down" });
      await expect(theirs.getByText("From Maya")).toBeVisible();
      await expect(theirs.getByRole("button", { name: "Take down" })).toHaveCount(0);
      await mine.getByRole("button", { name: "Take down" }).click();
      await expect(mine).toHaveCount(0);
      await expect(theirs).toBeVisible();
    } finally {
      await takeDownMyNotes(request, maya, ["emma.reads"]);
    }
  });

  // the corkboard's pixels in the room's picture, as one number to compare
  async function corkboardPixels(page) {
    const picture = await roomCanvas(page).elementHandle();
    return page.getByRole("button", { name: "Notice board" }).evaluate((button, canvas) => {
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
    }, picture);
  }

  test("notes are pinned on the corkboard itself, three at most", async ({ page }) => {
    // Mei's board: no other test leaves notes there, so nothing changes it meanwhile
    await visit(page, "mei.margins", "Mei");
    const plain = await corkboardPixels(page);

    await leaveNote(page, "Mei", "First!");
    await expect.poll(() => corkboardPixels(page)).not.toBe(plain);
    await leaveNote(page, "Mei", "Second");
    await leaveNote(page, "Mei", "Third");
    await nextPaint(page);
    const three = await corkboardPixels(page);
    // a fourth note isn't drawn: the corkboard looks the same once it has repainted
    await leaveNote(page, "Mei", "Fourth");
    await nextPaint(page);
    expect(await corkboardPixels(page)).toBe(three);

    // all taken down: the plain corkboard again
    const board = await openBoard(page);
    for (let left = 4; left > 0; left -= 1) await board.getByRole("button", { name: "Take down" }).first().click();
    await board.getByRole("button", { name: "Close" }).click();
    await expect.poll(() => corkboardPixels(page)).toBe(plain);
  });

  test("My Room's notice board shows the notes others left, and I can take any of them down", async ({ page, request, reader }) => {
    // a note another reader left on my board
    const maya = someoneElse();
    await pinNote(request, maya, reader.id, "Your room is so cosy", "Maya");
    try {
      await page.goto("/house");
      await roomReady(page);
      await expect(page.getByRole("button", { name: "Leave a note" })).toHaveCount(0);

      const board = await openBoard(page);
      await expect(board.getByText("Your notice board")).toBeVisible();
      await expect(board.getByText("“So many books, so little time.”")).toBeVisible();
      await expect(board.getByRole("button", { name: "Leave a note" })).toHaveCount(0);
      const note = board.getByRole("listitem").filter({ hasText: "Your room is so cosy" });
      await expect(note.getByText("From Maya")).toBeVisible();
      await note.getByRole("button", { name: "Take down" }).click();
      await expect(board.getByText("No notes yet. When readers visit, their notes show up here.")).toBeVisible();

      await page.reload();
      await roomReady(page);
      await expect((await openBoard(page)).getByText("Your room is so cosy")).toHaveCount(0);
    } finally {
      await takeDownMyNotes(request, maya, [reader.id]);
    }
  });
});

test.describe("knocking on the door", () => {
  const door = (page, state) => page.getByRole("img", { name: `The door is ${state}` });

  // Holds back every request to `url` until the returned function is called.
  async function holdBack(page, url) {
    let release;
    const held = new Promise((resolve) => (release = resolve));
    await page.route(url, async (route) => {
      await held;
      await route.fallback();
    });
    return release;
  }

  // Remembers whether the door was ever open, however briefly.
  async function watchTheDoor(page) {
    await page.addInitScript(() => {
      new MutationObserver(() => {
        if (document.querySelector('[aria-label="The door is open"]')) window.doorOpened = true;
      }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-label"] });
    });
  }
  const doorOpened = (page) => page.evaluate(() => window.doorOpened === true);

  test("the door is shut and the words say so while the readers load", async ({ page }) => {
    await holdBack(page, "**/api/people");
    await page.goto("/people/emma.reads/room");
    await expect(door(page, "shut")).toBeVisible();
    await expect(page.getByRole("status")).toHaveText("Knocking on the door");
  });

  test("the words use the reader's name when it's already known", async ({ page }) => {
    await page.goto("/cafe");
    await page.getByRole("button", { name: /^Walk to Emma Tan/ }).press("Enter");
    const card = page.getByRole("dialog", { name: "Meet Emma Tan" });
    await expect(card).toBeVisible({ timeout: 15000 });
    await holdBack(page, "**/api/rooms/*/furniture");
    await card.getByRole("link", { name: "Visit Emma's room" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Knocking on" })).toHaveText("Knocking on Emma's door");
  });

  test("the door fits a narrow phone with no sideways scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await holdBack(page, "**/api/people");
    await page.goto("/people/emma.reads/room");
    await expect(door(page, "shut")).toBeInViewport({ ratio: 1 });
    const scrollsSideways = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(scrollsSideways).toBe(false);
  });

  test("the Daily button doesn't cover the way back while knocking", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await page.goto("/people/emma.reads");
    const visitRoom = page.getByRole("link", { name: "Visit Emma's room" });
    await expect(visitRoom).toBeVisible();
    await holdBack(page, "**/api/rooms/*/furniture");
    await visitRoom.click();

    // from the reader's profile, so Back says so
    const back = page.getByRole("link", { name: /^Back/ });
    const daily = page.getByRole("button", { name: /^Daily tasks/ });
    await expect(door(page, "shut")).toBeVisible();
    await expect.poll(async () => {
      const [left, chip] = [await back.boundingBox(), await daily.boundingBox()];
      return chip.y >= left.y + left.height;
    }).toBe(true);
  });

  test("the door opens only once the room is ready, then the room appears", async ({ page }) => {
    const release = await holdBack(page, "**/api/people");
    await page.goto("/people/emma.reads/room");
    await expect(door(page, "shut")).toBeVisible();
    await expect(door(page, "open")).toHaveCount(0);
    await expect(roomOf(page, "Emma")).toHaveCount(0);

    release();
    await expect(door(page, "open")).toBeVisible();
    await expect(roomOf(page, "Emma")).toBeVisible();
    await expect(door(page, "open")).toHaveCount(0);
  });

  test("going back while knocking stays on the Cafe, with no room appearing", async ({ page }) => {
    const release = await holdBack(page, "**/api/people");
    await page.goto("/people/emma.reads/room");
    await page.getByRole("link", { name: "Back to the Cafe" }).click();
    await expect(page).toHaveURL(/\/cafe$/);

    release();
    await expect(page.getByRole("button", { name: /^Walk to Emma Tan/ })).toBeAttached({ timeout: 15000 });
    await expect(roomOf(page, "Emma")).toHaveCount(0);
    await expect(page).toHaveURL(/\/cafe$/);
  });

  test("a room that can't be fetched keeps the door shut, and Try again knocks again", async ({ page }) => {
    await watchTheDoor(page);
    const fail = (route) => route.fulfill({ status: 500, json: { error: "The readers are out" } });
    await page.route("**/api/people", fail);
    await page.route("**/api/people/emma.reads", fail);
    await page.goto("/people/emma.reads/room");
    await expect(page.getByRole("alert")).toContainText("The readers are out");
    expect(await doorOpened(page)).toBe(false);

    await page.unroute("**/api/people", fail);
    await page.unroute("**/api/people/emma.reads", fail);
    const release = await holdBack(page, "**/api/people");
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(door(page, "shut")).toBeVisible();

    release();
    await expect(roomOf(page, "Emma")).toBeVisible();
    expect(await doorOpened(page)).toBe(true);
  });

  test("a reader who doesn't exist never opens the door", async ({ page }) => {
    await watchTheDoor(page);
    await page.goto("/people/reader-nobody/room");
    await expect(page.getByText("We couldn't find that reader.")).toBeVisible();
    expect(await doorOpened(page)).toBe(false);
  });

  test("with reduced motion the door stays still and the room comes straight in", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await watchTheDoor(page);
    const release = await holdBack(page, "**/api/people");
    await page.goto("/people/emma.reads/room");
    await expect(page.getByRole("status")).toHaveText("Knocking on the door");
    const moving = await door(page, "shut").evaluate((art) => art.parentElement.getAnimations({ subtree: true }).length);
    expect(moving).toBe(0);

    release();
    await expect(roomOf(page, "Emma")).toBeVisible();
    expect(await doorOpened(page)).toBe(false);
  });
});
