// Scaffolded with AI assistance — see AI_USAGE.md
// Friends for the town's tests, answered here so they don't depend on who is in the database.
// playwright.config.js runs the API without Supabase, where nobody has friends.
const MINUTE = 60 * 1000;

export const friend = (id, displayName, spot, { away = 0, reading = null } = {}) => ({
  id,
  userId: `account-${id}`,
  username: id,
  displayName,
  character: { base: "maya" },
  books: reading ? [{ id: `book-${id}`, title: reading, author: "Someone", genre: "Fantasy", status: "reading" }] : [],
  lastSeenAt: new Date(Date.now() - away * MINUTE).toISOString(),
  spot,
});

export const EMMA = friend("emma.reads", "Emma Tan", 0, { reading: "The Hobbit" });
export const NOAH = friend("noah.bookmarks", "Noah Lim", 1, { away: 600 });

// Answers the town's calls from `town`: { friends, incoming, outgoing, visits }, which a test can
// change as it goes. `town.asked` collects every username a friend request was sent to, and
// `town.removed` every friend removed.
export async function mockFriends(page, start = {}) {
  const town = { friends: [], incoming: [], outgoing: [], visits: [], asked: [], removed: [], ...start };
  await page.route("**/api/nearby", (route) => route.fulfill({ json: { readers: [] } }));
  await page.route("**/api/friends", (route) =>
    route.fulfill({ json: { friends: town.friends, incoming: town.incoming, outgoing: town.outgoing } })
  );
  await page.route("**/api/notifications/visits*", (route) => route.fulfill({ json: { visits: town.visits } }));
  await page.route("**/api/friends/requests", (route) => {
    const { readerId } = route.request().postDataJSON();
    town.asked.push(readerId);
    if (readerId === "nobody.here") return route.fulfill({ status: 404, json: { error: "Reader not found" } });
    town.outgoing.push(readerId);
    return route.fulfill({ status: 201, json: { requested: true } });
  });
  await page.route("**/api/friends/*", (route) => {
    if (route.request().method() !== "DELETE") return route.fallback();
    const id = decodeURIComponent(route.request().url().split("/").pop());
    town.removed.push(id);
    town.friends = town.friends.filter((one) => one.id !== id);
    return route.fulfill({ json: { removed: true } });
  });
  return town;
}

// The day's tasks already seen, so they don't open over the town.
export async function skipDailyPanel(page, readerId) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(new Date());
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [`readalot-daily:${readerId}`, JSON.stringify({ day: today, shown: today })]);
}
