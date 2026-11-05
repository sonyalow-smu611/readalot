// Scaffolded with AI assistance — see AI_USAGE.md
// The demo account for grading and live demos: demo@demo.ikda.app, signed in with the code 111111
// (see routes/demoAuth.js). It has a finished profile and a decorated room, a full bookshelf with
// reviews, 4 friends (2 online, 1 away a while, 1 dusty), 1 friend request to answer, a chat history,
// notes on the corkboard, saved quotes, room visits and a level worth of XP.
//
// It only ever writes the demo reader's own rows (plus the two friends' "last online" time and
// a few notes, messages, visits and reviews that mention the demo reader), so it is safe to re-run
// on the team's shared project. Re-run it before each demo: it puts the demo reader and two friends
// back "online", resets the shelf and XP, and puts the room back.
//
// Needs the demo readers first: pnpm --filter readalot-server seed:readers
// Usage: pnpm --filter readalot-server seed:demo
import { DEMO_READERS } from "../data/demoReaders.js";
import { findGoogleBook, searchGoogleBooks } from "../src/services/books.js";
import { env } from "../src/services/env.js";
import { supabase } from "../src/services/supabase.js";

if (!env.HAS_SUPABASE) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first.");
  process.exit(1);
}

const DEMO = {
  id: "00000000-0000-4000-8000-000000000301",
  email: "demo@demo.ikda.app",
  username: "demo.reader",
  name: "Jordan Lee",
};
const PASSWORD = process.env.DEMO_PASSWORD || "Ikda-Demo-2026";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const now = Date.now();
const ago = (ms) => new Date(now - ms).toISOString();
// a date in Singapore, as xp_events counts days
const sgDay = (ms) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });

const reader = (username) => {
  const found = DEMO_READERS.find((one) => one.username === username);
  if (!found) throw new Error(`Run pnpm --filter readalot-server seed:readers first: ${username} is missing.`);
  return found.id;
};
const EMMA = reader("emma.reads");
const AYAAN = reader("ayaan.pages");
const SOFIA = reader("sofia.shelves");
const NOAH = reader("noah.bookmarks");
const MEI = reader("mei.margins");

async function ok(label, promise) {
  const { error, data } = await promise;
  if (error) {
    console.error(`✗ ${label} failed:`, error.message);
    process.exit(1);
  }
  console.log(`✓ ${label}`);
  return data;
}

// --- The shelf -----------------------------------------------------------------------------
// Titles match the demo readers' own shelves, so "Books You Both Have" shows (books match by title).
const SHELF = [
  { title: "The Hobbit", author: "J. R. R. Tolkien", status: "read", rating: 5, review: "Cosy, funny and full of heart. I reread it every autumn.", days: 30 },
  { title: "Pride and Prejudice", author: "Jane Austen", status: "read", rating: 4, review: "Witty from the first line. Elizabeth is the best.", days: 24 },
  { title: "Project Hail Mary", author: "Andy Weir", status: "read", rating: 5, review: "I could not put it down. Rocky is the best friend in sci-fi.", days: 12 },
  { title: "Dune", author: "Frank Herbert", hint: "1965", status: "reading", progress: 45, days: 2 },
  { title: "The Secret History", author: "Donna Tartt", status: "reading", progress: 20, days: 1 },
  { title: "Fourth Wing", author: "Rebecca Yarros", status: "want_to_read", days: 5 },
  { title: "Piranesi", author: "Susanna Clarke", status: "want_to_read", days: 6 },
  { title: "The Night Circus", author: "Erin Morgenstern", status: "want_to_read", days: 7 },
  { title: "Circe", author: "Madeline Miller", status: "want_to_read", days: 8 },
  { title: "Gone Girl", author: "Gillian Flynn", status: "want_to_read", days: 9 },
];

async function resolveBooks() {
  const books = [];
  for (const wanted of SHELF) {
    let match = null;
    for (let attempt = 0; attempt < 4 && !match; attempt += 1) {
      match = await findGoogleBook(wanted.title, wanted.author);
      if (!match) await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    if (!match) {
      console.error(`Could not find "${wanted.title}" on Google Books (offline or rate limited?). Run it again in a minute.`);
      process.exit(1);
    }
    // the best match can lack a cover, or a description: borrow them from another edition of the same book
    if (!match.coverUrl || !match.description) {
      const words = (text) => String(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
      const surname = words(wanted.author).split(" ").at(-1);
      const same = (book) => words(book.title) === words(wanted.title) && book.authors.some((name) => words(name).includes(surname));
      const pool = [];
      for (const query of [`${wanted.title} ${wanted.author}`, `${wanted.title} ${surname} ${wanted.hint || "novel"}`, `${wanted.title} ${surname} summary`]) {
        pool.push(...(await searchGoogleBooks(query, { maxResults: 20 }).catch(() => [])).filter(same));
      }
      const withBoth = pool.find((book) => book.coverUrl && book.description);
      const withCover = pool.find((book) => book.coverUrl);
      const withText = pool.find((book) => book.description);
      if (withBoth) match = { ...withBoth };
      else {
        if (!match.coverUrl && withCover) match = { ...match, coverUrl: withCover.coverUrl };
        if (!match.description && withText) match = { ...match, description: withText.description };
      }
    }
    books.push({ ...wanted, book: match });
  }
  return books;
}

// --- The room ------------------------------------------------------------------------------
// Positions are ones the app itself accepts (checked against buildings/house/strip/placement.js):
// wall art on the wall, plants and cats on the floor, a plant on each small surface, and the
// reading chair, curtains and bedding in their own places.
const spot = (zone, x, y) => ({ zone, x: Math.round((x / 1240) * 100) / 100, at: { x, y } });
const PIECES = [
  { uid: "demo-poster-mountain", id: "poster-mountain", ...spot("wall", 278, 192) },
  { uid: "demo-frame-botanical", id: "frame-botanical", ...spot("wall", 441, 188) },
  { uid: "demo-poster-book-club", id: "poster-book-club", ...spot("wall", 858, 240) },
  { uid: "demo-frame-gold", id: "frame-gold", ...spot("wall", 1125, 182) },
  { uid: "demo-plant-monstera", id: "plant-monstera", ...spot("room", 632, 416) },
  { uid: "demo-plant-fig", id: "plant-fig", ...spot("room", 760, 416) },
  { uid: "demo-cat-ginger", id: "cat-ginger", ...spot("room", 409, 416) },
  { uid: "demo-cat-black", id: "cat-black", ...spot("room", 186, 416) },
  { uid: "demo-succulents-table", id: "plant-succulents", ...spot("side-table", 440, 357) },
  { uid: "demo-succulents-bed", id: "plant-succulents", ...spot("nightstand", 898, 359) },
  { uid: "demo-chair-wingback", id: "chair-wingback", zone: "chair", x: 0.28, at: { x: 350, y: 350 } },
  { uid: "demo-curtains-sage", id: "curtains-sage", zone: "curtains", x: 0.12, at: { x: 146, y: 230 } },
  { uid: "demo-bedding-stars", id: "bedding-stars", zone: "bed", x: 0.82, at: { x: 1030, y: 360 } },
  // owned but not placed yet, so the Inventory has something to place and swap
  { uid: "demo-inv-poster-moon", id: "poster-moon" },
  { uid: "demo-inv-chair-rocking", id: "chair-rocking" },
  { uid: "demo-inv-cat-calico", id: "cat-calico" },
  { uid: "demo-inv-curtains-navy", id: "curtains-navy" },
  { uid: "demo-inv-bedding-tartan", id: "bedding-tartan" },
];

// the same preset the landing page starts from (client/src/lib/avatar/catalogue.js, "rosie")
const CHARACTER = {
  v: 1, base: "rosie", hair: "long", hairColour: "pink", skin: "tone-2", top: "pinafore", topColour: "pink",
  bottom: "skirt", bottomColour: "cream", shoes: "trainers", shoeColour: "pink",
  eyes: null, head: null, hairAccessory: null, neck: null, ears: null, bag: null,
};

// --- 1. The account ------------------------------------------------------------------------
const existing = await supabase.auth.admin.getUserById(DEMO.id);
const account = { email: DEMO.email, password: PASSWORD, email_confirm: true, user_metadata: { username: DEMO.username, demo: true } };
if (existing.data?.user) {
  await ok("account (updated)", supabase.auth.admin.updateUserById(DEMO.id, account));
} else {
  await ok("account (created)", supabase.auth.admin.createUser({ id: DEMO.id, ...account }));
}

const books = await resolveBooks();

// --- 2. Profile ----------------------------------------------------------------------------
await ok(
  "profile",
  supabase.from("profiles").upsert({
    id: DEMO.id,
    username: DEMO.username,
    display_name: DEMO.name,
    bio: "Fantasy, sci-fi and a good cup of tea. Demo account.",
    avatar: "🦊",
    favorite_genres: ["Fantasy", "Sci-Fi", "Mystery & Thriller", "Memoir"],
    location_name: "Tampines, Singapore",
    location_lat: 1.354,
    location_lng: 103.945,
    discoverable: true,
    character: CHARACTER,
    coins: 600,
    tour_seen_at: ago(DAY),
    location_asked_at: ago(DAY),
    last_active_at: ago(0),
    // the bell starts with its notifications unread and uncleared
    notifications_read_at: null,
    notifications_cleared_at: null,
  })
);
await ok("private details", supabase.from("profile_private").upsert({ id: DEMO.id, gender: "Woman", age: 22, religion: "Prefer not to say" }));
await ok("rough area", supabase.from("reader_areas").upsert({ reader: DEMO.id, lat_cell: 130, lng_cell: 10385, updated_at: ago(0) }));

// --- 3. Shelf and reviews ------------------------------------------------------------------
await ok(
  "books",
  supabase.from("books").upsert(
    books.map(({ title, author, book }) => ({
      id: book.id,
      google_books_id: book.googleBooksId || book.id,
      isbn: book.isbn,
      title,
      authors: book.authors?.length ? book.authors : [author],
      cover_url: book.coverUrl,
      genres: book.genres,
      description: book.description,
      publisher: book.publisher,
      published_date: book.publishedDate,
    }))
  )
);
// the books the demo shelf held before: if a re-run picks another edition, the old row would be left over
const oldShelf = (await supabase.from("user_books").select("book_id").eq("user_id", DEMO.id)).data?.map((row) => row.book_id) ?? [];
await ok("clear old shelf", supabase.from("user_books").delete().eq("user_id", DEMO.id));
await ok(
  "shelf",
  supabase.from("user_books").insert(
    books.map(({ book, status, progress, days }) => ({
      user_id: DEMO.id,
      book_id: book.id,
      status,
      progress: status === "read" ? 100 : progress ?? 0,
      created_at: ago(days * DAY + DAY),
      updated_at: ago(days * DAY),
    }))
  )
);

// drop a book row only if this re-run no longer uses it and no other reader's shelf or review does
const unused = oldShelf.filter((id) => !books.some((one) => one.book.id === id));
for (const id of unused) {
  const [shelved, reviewed] = await Promise.all([
    supabase.from("user_books").select("user_id", { count: "exact", head: true }).eq("book_id", id),
    supabase.from("reviews").select("user_id", { count: "exact", head: true }).eq("book_id", id).neq("user_id", DEMO.id),
  ]);
  if (!shelved.count && !reviewed.count) await ok(`remove unused book row ${id}`, supabase.from("books").delete().eq("id", id));
}

const bookOf = (title) => books.find((one) => one.title === title).book.id;
await ok("clear old reviews", supabase.from("reviews").delete().eq("user_id", DEMO.id));
await ok(
  "reviews",
  supabase.from("reviews").upsert(
    [
      ...books.filter((one) => one.rating).map((one) => ({ user_id: DEMO.id, book_id: one.book.id, rating: one.rating, review_text: one.review })),
      { user_id: EMMA, book_id: bookOf("The Hobbit"), rating: 5, review_text: "A perfect first fantasy. Cosy, clever and kind." },
      { user_id: AYAAN, book_id: bookOf("The Hobbit"), rating: 4, review_text: "Riddles in the Dark is still the best chapter." },
      { user_id: SOFIA, book_id: bookOf("Pride and Prejudice"), rating: 5, review_text: "Reread it every year with a pot of tea." },
    ],
    { onConflict: "user_id,book_id" }
  )
);

// --- 4. XP and coins -----------------------------------------------------------------------
// 620 XP is level 4 (450) with the next level at 700. A visit (+15), a note (+10) and a message (+5)
// leave Jordan below 700, and finishing Dune (+100) is what levels the reader up. The coins are set
// above (600).
const reviewed = books.filter((one) => one.rating);
const started = books.filter((one) => one.status !== "want_to_read");
const events = [
  ...books.map((one) => ({ action: "add_book", target: one.book.id, xp: 10, ms: (one.days + 1) * DAY })),
  ...started.map((one) => ({ action: "start_book", target: one.book.id, xp: 20, ms: (one.days + 1) * DAY - HOUR })),
  ...books.filter((one) => one.status === "read").map((one) => ({ action: "finish_book", target: one.book.id, xp: 100, ms: one.days * DAY })),
  ...reviewed.map((one) => ({ action: "write_review", target: one.book.id, xp: 40, ms: one.days * DAY - HOUR })),
];
await ok("clear old xp", supabase.from("xp_events").delete().eq("reader", DEMO.id));
// the day's tasks and streak start fresh (the row is made again when the town opens)
await ok("reset daily tasks", supabase.from("daily_state").delete().eq("reader", DEMO.id));
await ok(
  "xp",
  supabase.from("xp_events").insert(
    events.map((event) => ({ reader: DEMO.id, action: event.action, target: event.target, xp: event.xp, day: sgDay(now - event.ms), created_at: ago(event.ms) }))
  )
);
const totalXp = events.reduce((sum, event) => sum + event.xp, 0);

// --- 5. Friends ----------------------------------------------------------------------------
// Emma and Ayaan are online (so they walk the town), Sofia was last on 12 days ago, Mei 35 days
// ago (her house is dusty). Noah has asked to be a friend: the demo answers it.
await ok("friends' online time", Promise.all([
  supabase.from("profiles").update({ last_active_at: ago(MINUTE) }).in("id", [EMMA, AYAAN]),
  supabase.from("profiles").update({ last_active_at: ago(12 * DAY) }).eq("id", SOFIA),
  supabase.from("profiles").update({ last_active_at: ago(35 * DAY) }).eq("id", MEI),
]).then((results) => results.find((result) => result.error) ?? { error: null }));
await ok("clear old friendships", supabase.from("friendships").delete().or(`requester.eq.${DEMO.id},addressee.eq.${DEMO.id}`));
await ok(
  "friendships",
  supabase.from("friendships").insert([
    { requester: DEMO.id, addressee: EMMA, status: "accepted", created_at: ago(40 * DAY), accepted_at: ago(39 * DAY) },
    { requester: AYAAN, addressee: DEMO.id, status: "accepted", created_at: ago(30 * DAY), accepted_at: ago(29 * DAY) },
    { requester: DEMO.id, addressee: SOFIA, status: "accepted", created_at: ago(20 * DAY), accepted_at: ago(19 * DAY) },
    { requester: MEI, addressee: DEMO.id, status: "accepted", created_at: ago(10 * DAY), accepted_at: ago(9 * DAY) },
    { requester: NOAH, addressee: DEMO.id, status: "pending", created_at: ago(2 * HOUR) },
  ])
);

// --- 6. Messages, notes, visits, quotes ---------------------------------------------------
await ok("clear old messages", supabase.from("reader_messages").delete().or(`sender_id.eq.${DEMO.id},receiver_id.eq.${DEMO.id}`));
await ok(
  "messages",
  supabase.from("reader_messages").insert([
    { sender_id: EMMA, receiver_id: DEMO.id, content: "Hi Jordan! I saw you just finished Project Hail Mary. Thoughts?", created_at: ago(2 * DAY + 3 * HOUR) },
    { sender_id: DEMO.id, receiver_id: EMMA, content: "Loved it! Rocky is the best character. Have you read it?", created_at: ago(2 * DAY + 2 * HOUR) },
    { sender_id: EMMA, receiver_id: DEMO.id, content: "It's on my list. I'm halfway through The Secret History now.", created_at: ago(2 * DAY + HOUR) },
    { sender_id: DEMO.id, receiver_id: EMMA, content: "Ooh, no spoilers. Tell me what you think of the ending!", created_at: ago(2 * DAY) },
    { sender_id: AYAAN, receiver_id: DEMO.id, content: "Dune club tonight? I'm on the sandworms chapter.", created_at: ago(DAY + 2 * HOUR) },
    { sender_id: DEMO.id, receiver_id: AYAAN, content: "Yes! I'm 45% in. Give me an hour.", created_at: ago(DAY) },
  ])
);

await ok("clear old notes", supabase.from("room_notes").delete().or(`owner_id.eq.${DEMO.id},author_id.eq.${DEMO.id}`));
await ok(
  "notes",
  supabase.from("room_notes").insert([
    { owner_id: DEMO.id, author_id: EMMA, content: "Love your shelf! Is The Night Circus as good as everyone says?", created_at: ago(5 * HOUR) },
    { owner_id: DEMO.id, author_id: AYAAN, content: "Saw Dune on your Reading shelf. No spoilers, I promise.", created_at: ago(DAY) },
    { owner_id: EMMA, author_id: DEMO.id, content: "Great taste in books! Come visit my room too.", created_at: ago(3 * DAY) },
  ])
);

// Visits to the room: a visit is the visitor's visit_room XP row, aimed at this reader.
await ok(
  "clear old visits",
  supabase.from("xp_events").delete().eq("action", "visit_room").in("target", [DEMO.id, DEMO.username]).in("reader", [EMMA, AYAAN])
);
await ok(
  "visits",
  supabase.from("xp_events").insert([
    { reader: EMMA, action: "visit_room", target: DEMO.username, xp: 15, day: sgDay(now - 40 * MINUTE), created_at: ago(40 * MINUTE) },
    { reader: AYAAN, action: "visit_room", target: DEMO.username, xp: 15, day: sgDay(now - 3 * HOUR), created_at: ago(3 * HOUR) },
  ])
);

await ok("clear old saved quotes", supabase.from("saved_mood_quotes").delete().eq("user_id", DEMO.id));
await ok(
  "saved quotes",
  supabase.from("saved_mood_quotes").insert([
    { user_id: DEMO.id, quote_text: "Fear is the mind-killer.", author: "Frank Herbert", work: "Dune", book_id: bookOf("Dune"), mood: "stressed", created_at: ago(2 * DAY) },
    { user_id: DEMO.id, quote_text: "I declare after all there is no enjoyment like reading!", author: "Jane Austen", work: "Pride and Prejudice", book_id: bookOf("Pride and Prejudice"), mood: "calm", created_at: ago(5 * DAY) },
    { user_id: DEMO.id, quote_text: "Not all those who wander are lost.", author: "J. R. R. Tolkien", work: "The Fellowship of the Ring", book_id: "", mood: "excited", created_at: ago(9 * DAY) },
  ])
);

// --- 7. The room ---------------------------------------------------------------------------
await ok("room", supabase.from("room_furniture").upsert({ owner_id: DEMO.id, pieces: PIECES, updated_at: ago(0) }));

console.log(`
Done. The demo account:
  email     ${DEMO.email}
  password  ${process.env.DEMO_PASSWORD ? "(set by DEMO_PASSWORD)" : PASSWORD}
  code      111111 (no email is sent)
  reader    ${DEMO.name} (@${DEMO.username}), ${totalXp} XP, 600 coins
  shelf     ${books.length} books, ${books.filter((one) => one.status === "read").length} finished and reviewed
Run this again before each demo: it puts Emma and Ayaan back online.`);
