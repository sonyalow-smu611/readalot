// Puts the demo readers (data/demoReaders.js) in Supabase as real accounts: an auth user each
// (no one can sign in as them: random passwords), a discoverable profile with their town look,
// and their shelf. Safe to re-run: fixed ids and upserts. Re-running also resets when each was
// last online, so Emma and Ayaan show as online again.
// Usage: npm run seed:readers -w server
import { randomBytes } from "node:crypto";
import { DEMO_BOOKS, DEMO_READERS } from "../data/demoReaders.js";
import { env } from "../src/services/env.js";
import { supabase } from "../src/services/supabase.js";

if (!env.HAS_SUPABASE) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first.");
  process.exit(1);
}

async function ok(label, promise) {
  const { error } = await promise;
  if (error) {
    console.error(`${label} failed:`, error.message);
    process.exit(1);
  }
  console.log(`✓ ${label}`);
}

// the auth user each profile belongs to, created once with the reader's fixed id
for (const reader of DEMO_READERS) {
  const { data } = await supabase.auth.admin.getUserById(reader.id);
  if (data?.user) continue;
  await ok(
    `account ${reader.username}`,
    supabase.auth.admin.createUser({
      id: reader.id,
      email: `${reader.username}@demo.ikda.app`,
      password: randomBytes(24).toString("base64url"),
      email_confirm: true,
      user_metadata: { demo: true }
    })
  );
}

const now = Date.now();
await ok(
  "profiles",
  supabase.from("profiles").upsert(
    DEMO_READERS.map((reader) => ({
      id: reader.id,
      username: reader.username,
      display_name: reader.displayName,
      bio: reader.tagline,
      favorite_genres: reader.favoriteGenres,
      location_lat: reader.lat,
      location_lng: reader.lng,
      location_name: reader.neighborhood,
      character: reader.character,
      discoverable: true,
      last_active_at: new Date(now - reader.awayMinutes * 60 * 1000).toISOString()
    }))
  )
);

await ok(
  "books",
  supabase.from("books").upsert(
    DEMO_BOOKS.map((book) => ({ id: book.id, title: book.title, authors: [book.author], genres: [book.genre] }))
  )
);

await ok(
  "user_books",
  supabase.from("user_books").upsert(
    DEMO_READERS.flatMap((reader) =>
      reader.shelf.map(([bookId, status]) => ({
        user_id: reader.id,
        book_id: bookId,
        status,
        progress: status === "read" ? 100 : 0
      }))
    ),
    { onConflict: "user_id,book_id" }
  )
);
