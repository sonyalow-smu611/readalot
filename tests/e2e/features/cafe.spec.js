// Scaffolded with AI assistance — see AI_USAGE.md
import { test as base, expect, fitsScreen } from "./fixtures.js";
import { createPrivateReader, setDiscoverable } from "../supabaseUser.js";
import { goToPlace, REAL_API, roomReady } from "../fixtures.js";

// Real disposable recipients keep friend requests and messages away from teammates' accounts.
// The cafe seating/reading data is fixed; friendship writes and chat use real Supabase accounts.
const test = base.extend({
  guests: async ({ page }, use) => {
    const guests = [];
    try {
      guests.push(await createPrivateReader("Emma Test"));
      guests.push(await createPrivateReader("Ayaan Test"));
      for (const guest of guests) await setDiscoverable(guest.id, true);
      const response = await page.request.get("/api/people");
      expect(response.ok()).toBe(true);
      const { readers } = await response.json();
      const people = guests.map((guest, index) => ({
        ...readers[index], id: guest.username, userId: guest.id, username: guest.username,
        displayName: index === 0 ? "Emma Test" : "Ayaan Test",
      }));
      await page.route("**/api/people", (route) => route.fulfill({ json: { readers: people } }));
      for (const person of people) {
        await page.route(`**/api/people/${person.id}`, (route) => route.fulfill({ json: { reader: person } }));
        await page.route(`**/api/rooms/${person.id}/notes**`, (route) => {
          const { pathname, search } = new URL(route.request().url());
          return route.continue({ url: `${REAL_API}${pathname}${search}` });
        });
      }
      await page.route(/\/api\/friends(?:\/.*)?$/, (route) => {
        const { pathname, search } = new URL(route.request().url());
        return route.continue({ url: `${REAL_API}${pathname}${search}` });
      });
      await use(people);
    } finally {
      for (const guest of guests) await guest.remove();
    }
  },
});

for (const index of [0, 1]) {
  test(`CAFE-0${index + 1} reader ${index + 1}: profile, friend request, message, room and note`, async ({ page, guests }) => {
    test.setTimeout(120_000);
    const person = guests[index];
    const firstName = person.displayName.split(" ")[0];
    await test.step("Walk to the reader and inspect their profile", async () => {
      await page.goto("/cafe");
      await page.getByRole("button", { name: new RegExp(`^Walk to ${person.displayName}`) }).press("Enter");
      await expect(page.getByRole("dialog", { name: `Meet ${person.displayName}` })).toBeVisible({ timeout: 20_000 });
    });
    const profile = page.getByRole("dialog", { name: `Meet ${person.displayName}` });
    await test.step("Send a real friend request, then a real message", async () => {
      await profile.getByRole("button", { name: "Add friend" }).click();
      await expect(profile.getByRole("button", { name: /Request sent/ })).toBeVisible();
      await profile.getByRole("button", { name: "Message", exact: true }).click();
      const chat = page.getByRole("dialog", { name: `Message ${firstName}` });
      await chat.getByRole("textbox", { name: "Your message", exact: true }).fill("Your bookshelf looks great!");
      await chat.getByRole("button", { name: /^SEND/i }).click();
      await expect(chat.getByText("Your bookshelf looks great!", { exact: true })).toBeVisible();
      await chat.getByRole("button", { name: "Close", exact: true }).click();
      await profile.getByRole("button", { name: "Message", exact: true }).click();
      await expect(chat.getByText("Your bookshelf looks great!", { exact: true })).toBeVisible();
      await chat.getByRole("button", { name: "Close", exact: true }).click();
    });
    await test.step("Visit their room: there is no shop, inventory, or furniture editor", async () => {
      await profile.getByRole("link", { name: `Visit ${firstName}'s room` }).click();
      await roomReady(page);
      await expect(page.getByRole("button", { name: "Room menu" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: /^(Shop|Inventory|Move(?: .*)?|Remove(?: .*)?)$/ })).toHaveCount(0);
      await fitsScreen(page);
    });
    await test.step("Open their shelf and book; their reading state cannot be edited", async () => {
      await goToPlace(page, "Bookshelf");
      await page.getByRole("button", { name: /^Bookshelf, \d+ books?$/ }).click({ position: { x: 8, y: 8 } });
      const book = page.getByRole("region", { name: /^(To be read|Currently reading|Finished reading),/ }).getByRole("button").first();
      await expect(book).toBeVisible();
      await book.click();
      const card = page.getByRole("dialog", { name: /^Quick preview:/ });
      await expect(card).toBeVisible();
      await expect(card.getByRole("button", { name: /^(Start reading|Mark as finished|Remove from shelf)$/ })).toHaveCount(0);
      await expect(card.getByRole("slider")).toHaveCount(0);
      await card.getByRole("button", { name: "Where to get" }).click();
      await expect(card.getByRole("region", { name: "Where to get this book" })).toBeVisible();
      await card.getByRole("button", { name: /^Leave\/Read Reviews/ }).click();
      await expect(card.getByRole("region", { name: "Reviews" })).toBeVisible();
      await expect(card.getByRole("link", { name: "Open full book page" })).toHaveAttribute("href", /\/books\//);
      await card.getByRole("button", { name: "Close", exact: true }).click();
      await page.getByRole("link", { name: `Back to ${firstName}'s room` }).click();
    });
    await test.step("Leave a note on their noticeboard and check it after reload", async () => {
      await goToPlace(page, "Corkboard");
      await page.getByRole("button", { name: "Notice board", exact: true }).click();
      const board = page.getByRole("dialog", { name: "Notice board" });
      await board.getByRole("button", { name: "Leave a note" }).click();
      const note = page.getByRole("dialog", { name: `Leave a note for ${firstName}` });
      await expect(note.getByRole("button", { name: "Post note" })).toBeDisabled();
      await note.getByRole("textbox", { name: "Your note" }).fill("Thanks for the book recommendations!");
      await note.getByRole("button", { name: "Post note" }).click();
      await expect(note).toBeHidden();
      await page.reload();
      await roomReady(page);
      await goToPlace(page, "Corkboard");
      await page.getByRole("button", { name: "Notice board", exact: true }).click();
      const mine = board.getByRole("listitem").filter({ hasText: "Thanks for the book recommendations!" });
      await expect(mine).toBeVisible();
      await mine.getByRole("button", { name: "Take down" }).click();
      await expect(mine).toHaveCount(0);
    });
  });
}

base("CAFE-03 visiting: dragging furniture or books cannot change the owner's room", async ({ page }) => {
  const mutations = [];
  page.on("request", (request) => {
    if (/\/api\/(rooms\/emma\.reads\/furniture|user-books)/.test(request.url()) && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) mutations.push(request.method());
  });
  await page.goto("/people/emma.reads/room");
  await roomReady(page);
  await goToPlace(page, "Chair");
  const poster = page.getByRole("button", { name: "Moon poster", exact: true });
  await poster.click();
  await expect(page.getByRole("button", { name: /^(Move|Remove)(?: .*)?$/ })).toHaveCount(0);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  const box = await poster.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // A long press is the owner's pickup gesture; visitors must not acquire an editor.
  await page.waitForTimeout(550);
  await page.mouse.move(box.x + box.width / 2 + 35, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole("button", { name: "Move left" })).toHaveCount(0);
  await goToPlace(page, "Bookshelf");
  await page.getByRole("button", { name: /^Bookshelf, \d+ books?$/ }).click({ position: { x: 8, y: 8 } });
  const shelf = page.getByRole("region", { name: /^Finished reading,/ });
  const book = shelf.getByRole("button", { name: /The Hobbit/ });
  const before = await shelf.getAttribute("aria-label");
  const start = await book.boundingBox();
  const destination = await page.getByRole("region", { name: /^To be read,/ }).boundingBox();
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(destination.x + 30, destination.y + 30, { steps: 10 });
  await page.mouse.up();
  await expect(shelf).toHaveAttribute("aria-label", before);
  expect(mutations).toEqual([]);
});
