// Other readers, as the Cafe, the town and reader profiles show them: discoverable profiles with
// the books on their shelves. Without Supabase the demo readers in data/demoReaders.js stand in.
// Friends are in friends.js (the friendships table).
import { DEMO_BOOKS, DEMO_READERS, NEIGHBOUR_ID, SAMPLE_READER_IDS } from "../../data/demoReaders.js";
import { getGoogleBook } from "./books.js";
import { env } from "./env.js";
import { supabase } from "./supabase.js";

const MINUTE_MS = 60 * 1000;

// A made-up reader from the seed (not Pip): with Supabase on they are left out everywhere readers
// are listed or looked up.
export const isSampleReader = (userId) => SAMPLE_READER_IDS.has(userId);
// pins show a general area, not a home
const approximate = (value) => (value == null ? null : Number(Number(value).toFixed(2)));

// When a reader was last online. Pip, the neighbour, is always online.
export function lastSeen(profile) {
  return profile.id === NEIGHBOUR_ID ? new Date().toISOString() : profile.last_active_at || null;
}

// { id, userId, username, displayName, initials, tagline, neighborhood, lat, lng, favoriteGenres,
//   character, lastSeenAt, books: [{ id, title, author, genre, status }] }. id is what links to
// the reader use: their username, or their account id when they have none.
function toReader(profile, books) {
  const displayName = profile.display_name || "Reader";
  return {
    id: profile.username || profile.id,
    userId: profile.id,
    username: profile.username || "",
    displayName,
    initials: displayName.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase(),
    tagline: profile.bio || "",
    neighborhood: profile.location_name || "",
    lat: approximate(profile.location_lat),
    lng: approximate(profile.location_lng),
    favoriteGenres: profile.favorite_genres || [],
    character: profile.character || null,
    lastSeenAt: lastSeen(profile),
    books
  };
}

// ---- without Supabase: the demo readers, held in memory -----------------------------------

function demoReaders() {
  const now = Date.now();
  return DEMO_READERS.map((reader) =>
    toReader(
      {
        id: reader.id,
        username: reader.username,
        display_name: reader.displayName,
        bio: reader.tagline,
        location_name: reader.neighborhood,
        location_lat: reader.lat,
        location_lng: reader.lng,
        favorite_genres: reader.favoriteGenres,
        character: reader.character,
        last_active_at: new Date(now - reader.awayMinutes * MINUTE_MS).toISOString()
      },
      reader.shelf.map(([bookId, status]) => ({ ...DEMO_BOOKS.find((book) => book.id === bookId), status }))
    )
  );
}


// ---- with Supabase -------------------------------------------------------------------------

const PROFILE_COLUMNS =
  "id, username, display_name, bio, favorite_genres, location_lat, location_lng, location_name, character, last_active_at";

// stands in for a saved book that Google Books could not return just now (as on the reader's own shelf)
const UNKNOWN_BOOK = { title: "Unavailable book", authors: [], coverUrl: "", description: "", genres: [] };

// A saved book as the books table holds it, in the shape the reader's own shelf has (routes/userBooks.js)
function fromRow(row) {
  return {
    id: row.id,
    googleBooksId: row.google_books_id,
    title: row.title,
    authors: row.authors || [],
    coverUrl: row.cover_url || "",
    description: row.description || "",
    genres: row.genres || [],
    publisher: row.publisher || "",
    publishedDate: row.published_date || "",
    isbn: row.isbn || "",
    averageRating: 0,
    pageCount: row.page_count || 0,
    ratingsCount: row.ratings_count || 0,
    buyUrl: row.buy_url || ""
  };
}

// Each profile as a reader with the books on their shelf. A list of readers (the Cafe) gets each
// book's title, author, genre and shelf. `full` (one reader, for a profile or a visit to their room)
// gets every book on the shelf in full, exactly as the reader sees their own shelf: the cover,
// synopsis and the rest, with Google Books filling in a book the books table doesn't hold yet.
async function withBooks(profiles, { full = false } = {}) {
  if (!profiles.length) return [];
  const ids = profiles.map((profile) => profile.id);
  const { data: shelved, error } = await supabase
    .from("user_books")
    .select("user_id, book_id, status, progress, updated_at")
    .in("user_id", ids)
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const bookIds = [...new Set(shelved.map((row) => row.book_id))];
  const { data: books, error: booksError } = bookIds.length
    ? await supabase.from("books").select("*").in("id", bookIds)
    : { data: [], error: null };
  if (booksError) throw booksError;
  const byId = new Map(books.map((book) => [book.id, fromRow(book)]));

  if (full) {
    // user_books has no foreign key to books, so a saved book may only exist on Google Books
    const missing = bookIds.filter((id) => !byId.has(id));
    const found = await Promise.all(missing.map((id) => getGoogleBook(id).catch(() => UNKNOWN_BOOK)));
    missing.forEach((id, k) => byId.set(id, { ...found[k], id }));
  }

  return profiles.map((profile) =>
    toReader(
      profile,
      // in a list, a book the books table doesn't know yet has no title to show, so it is left out
      shelved
        .filter((row) => row.user_id === profile.id && byId.has(row.book_id))
        .map((row) => {
          const book = byId.get(row.book_id);
          return {
            ...(full ? { ...book, progress: row.progress || 0 } : {}),
            id: book.id,
            title: book.title,
            author: book.authors?.[0] || "Unknown",
            genre: book.genres?.[0] || "",
            status: row.status
          };
        })
    )
  );
}

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// ---- the service ---------------------------------------------------------------------------

// Every discoverable reader except the one asking.
export async function listReaders(viewerId) {
  if (!env.HAS_SUPABASE) return demoReaders().filter((reader) => reader.userId !== viewerId);
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("discoverable", true)
    .neq("id", viewerId)
    .order("display_name");
  if (error) throw error;
  return withBooks(data.filter((profile) => !isSampleReader(profile.id)));
}

// Readers by account id, public or private: your friends, who stay in your town when they go
// private. Only ever called with ids the viewer has a friendship with.
export async function readersByIds(ids) {
  if (!ids.length) return [];
  if (!env.HAS_SUPABASE) return demoReaders().filter((reader) => ids.includes(reader.userId));
  const real = ids.filter((id) => !isSampleReader(id));
  if (!real.length) return [];
  const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).in("id", real);
  if (error) throw error;
  return withBooks(data);
}

async function areFriends(viewerId, otherId) {
  const { data, error } = await supabase
    .from("friendships")
    .select("id")
    .eq("status", "accepted")
    .or(`and(requester.eq.${viewerId},addressee.eq.${otherId}),and(requester.eq.${otherId},addressee.eq.${viewerId})`);
  if (error) throw error;
  return data.length > 0;
}

// One reader by username (or account id), or null: a discoverable reader, or one of viewerId's
// friends. `anyone` finds private readers too: only for sending a friend request by username,
// which a private reader can still turn down; their profile stays hidden until they accept. `full`
// gives their shelf's books in full (a profile or a visit to their room; see withBooks).
export async function findReader(handle, viewerId, { anyone = false, full = false } = {}) {
  if (!env.HAS_SUPABASE) return demoReaders().find((reader) => reader.id === handle || reader.userId === handle) ?? null;
  const { data, error } = await supabase
    .from("profiles")
    .select(`${PROFILE_COLUMNS}, discoverable`)
    .eq(isUuid(handle) ? "id" : "username", handle)
    .maybeSingle();
  if (error) throw error;
  if (!data || isSampleReader(data.id)) return null;
  if (!anyone && !data.discoverable && !(viewerId && (await areFriends(viewerId, data.id)))) return null;
  return (await withBooks([data], { full }))[0];
}

