// T02: seed the demo user, ~8 fake readers around Singapore, and a few saved books.
// SET UP SUPABASE SCHEMA FIRST 

// Idempotent: fixed ids + upserts, safe to re-run. Usage: npm run seed -w server
import { env } from "../src/services/env.js";
import { searchGoogleBooks } from "../src/services/books.js";
import { supabase } from "../src/services/supabase.js";

if (!env.HAS_SUPABASE) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first.");
  process.exit(1);
}

const DEMO_ID = "00000000-0000-4000-8000-000000000001";
const readerId = (n) => `00000000-0000-4000-8000-0000000001${String(n).padStart(2, "0")}`;

const profiles = [
  {
    id: DEMO_ID,
    username: "demo_reader",
    display_name: "Demo Reader",
    bio: "Seeded demo user.",
    favorite_genres: ["Fantasy", "Fiction", "Classics"],
    location_lat: 1.3521,
    location_lng: 103.8198,
    location_name: "Singapore",
    discoverable: true
  },
  reader(1, "mei_reads", "Mei Lin", ["Fantasy", "Romance"], 1.3048, 103.8318),
  reader(2, "arjun_pages", "Arjun Nair", ["Science Fiction", "Fiction"], 1.2966, 103.7764),
  reader(3, "siti_books", "Siti Aminah", ["Classics", "Poetry"], 1.3644, 103.9915),
  reader(4, "wei_shelf", "Wei Jie", ["Mystery", "Thriller"], 1.3329, 103.7436),
  reader(5, "priya_novel", "Priya Raj", ["Fantasy", "Young Adult"], 1.3521, 103.9442),
  reader(6, "daniel_lit", "Daniel Tan", ["Classics", "Fiction"], 1.2789, 103.8536),
  reader(7, "hana_haiku", "Hana Sato", ["Poetry", "Romance"], 1.4382, 103.7890),
  reader(8, "kai_comics", "Kai Ong", ["Science Fiction", "Fantasy"], 1.3151, 103.8985)
];

function reader(n, username, displayName, favoriteGenres, lat, lng) {
  return {
    id: readerId(n),
    username,
    display_name: displayName,
    bio: "Seeded reader.",
    favorite_genres: favoriteGenres,
    location_lat: lat,
    location_lng: lng,
    location_name: "Singapore",
    discoverable: true
  };
}

// [title query, genre fallback] per shelf; users pick from this pool by index.
const bookQueries = [
  "intitle:Norwegian Wood inauthor:Murakami",
  "intitle:Pride and Prejudice inauthor:Austen",
  "intitle:The Hobbit inauthor:Tolkien",
  "intitle:Dune inauthor:Herbert",
  "intitle:1984 inauthor:Orwell",
  "intitle:The Great Gatsby inauthor:Fitzgerald",
  "intitle:Circe inauthor:Miller",
  "intitle:The Alchemist inauthor:Coelho",
  "intitle:Frankenstein inauthor:Shelley",
  "intitle:Gone Girl inauthor:Flynn"
];

// user index (0 = demo, 1-8 = readers) -> [book pool index, status, progress]
const shelves = {
  0: [[0, "reading", 40], [1, "read"], [2, "read"], [3, "want_to_read"], [6, "want_to_read"]],
  1: [[2, "read"], [6, "reading", 20], [1, "read"]],
  2: [[3, "read"], [4, "read"], [7, "want_to_read"]],
  3: [[1, "read"], [5, "read"], [8, "reading", 60]],
  4: [[9, "read"], [4, "read"], [0, "want_to_read"]],
  5: [[2, "read"], [6, "read"], [3, "reading", 10]],
  6: [[5, "read"], [1, "read"], [8, "read"]],
  7: [[0, "read"], [1, "want_to_read"]],
  8: [[3, "read"], [2, "read"], [6, "want_to_read"]]
};

async function ok(label, promise) {
  const { error } = await promise;
  if (error) {
    console.error(`${label} failed:`, error.message);
    process.exit(1);
  }
  console.log(`✓ ${label}`);
}

async function resolveBooks() {
  const books = [];
  for (const query of bookQueries) {
    const [match] = (await searchGoogleBooks(query)).filter((b) => !b.id.startsWith("demo-"));
    books.push(match || null);
  }
  if (books.some((b) => !b)) {
    console.error("Could not resolve every seed book from Google Books (offline or rate limited?). Try again.");
    process.exit(1);
  }
  return books;
}

await ok("profiles", supabase.from("profiles").upsert(profiles));

const books = await resolveBooks();
await ok(
  "books",
  supabase.from("books").upsert(
    books.map((b) => ({
      id: b.id,
      google_books_id: b.googleBooksId,
      isbn: b.isbn,
      title: b.title,
      authors: b.authors,
      cover_url: b.coverUrl,
      genres: b.genres,
      description: b.description,
      publisher: b.publisher,
      published_date: b.publishedDate
    }))
  )
);

const userBooks = Object.entries(shelves).flatMap(([userIndex, items]) =>
  items.map(([bookIndex, status, progress = status === "read" ? 100 : 0]) => ({
    user_id: Number(userIndex) === 0 ? DEMO_ID : readerId(Number(userIndex)),
    book_id: books[bookIndex].id,
    status,
    progress
  }))
);
await ok("user_books", supabase.from("user_books").upsert(userBooks, { onConflict: "user_id,book_id" }));

await ok(
  "reviews",
  supabase.from("reviews").upsert(
    [
      { user_id: readerId(1), book_id: books[2].id, rating: 5, review_text: "A cosy classic I reread every year." },
      { user_id: readerId(2), book_id: books[3].id, rating: 4, review_text: "Dense but worth it." },
      { user_id: DEMO_ID, book_id: books[1].id, rating: 5, review_text: "Witty and timeless." }
    ],
    { onConflict: "user_id,book_id" }
  )
);

// quotes have no natural unique key, so only insert when the seed user has none yet
const { count } = await supabase
  .from("quotes")
  .select("id", { count: "exact", head: true })
  .eq("user_id", readerId(1));
if (!count) {
  await ok(
    "quotes",
    supabase.from("quotes").insert([
      { user_id: readerId(1), book_id: books[2].id, quote_text: "Not all those who wander are lost.", page_number: 88 },
      { user_id: readerId(3), book_id: books[1].id, quote_text: "I declare after all there is no enjoyment like reading!", page_number: 12 }
    ])
  );
} else {
  console.log("✓ quotes (already seeded)");
}

await ok(
  "connections",
  supabase.from("connections").upsert(
    [
      { user_id: DEMO_ID, target_user_id: readerId(1) },
      { user_id: DEMO_ID, target_user_id: readerId(3) }
    ],
    { onConflict: "user_id,target_user_id" }
  )
);

console.log(`\nDone. Add this to .env:\nDEMO_USER_ID=${DEMO_ID}`);
