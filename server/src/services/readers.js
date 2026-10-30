// Other readers, as the Cafe, the town and reader profiles show them: discoverable profiles with
// the books on their shelves, and who you follow (the connections table). Without Supabase the
// demo readers in data/demoReaders.js stand in, and follows are kept in memory.
import { DEMO_BOOKS, DEMO_READERS } from "../../data/demoReaders.js";
import { env } from "./env.js";
import { supabase } from "./supabase.js";

const MINUTE_MS = 60 * 1000;
// pins show a general area, not a home
const approximate = (value) => (value == null ? null : Number(Number(value).toFixed(2)));

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
    lastSeenAt: profile.last_active_at || null,
    books
  };
}

// ---- without Supabase: the demo readers, held in memory -----------------------------------

const demoFollows = new Map();

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

function demoFollowing(viewerId) {
  if (!demoFollows.has(viewerId)) demoFollows.set(viewerId, new Set());
  return demoFollows.get(viewerId);
}

// ---- with Supabase -------------------------------------------------------------------------

const PROFILE_COLUMNS =
  "id, username, display_name, bio, favorite_genres, location_lat, location_lng, location_name, character, last_active_at";

async function withBooks(profiles) {
  if (!profiles.length) return [];
  const ids = profiles.map((profile) => profile.id);
  const { data: shelved, error } = await supabase
    .from("user_books")
    .select("user_id, book_id, status")
    .in("user_id", ids);
  if (error) throw error;

  const bookIds = [...new Set(shelved.map((row) => row.book_id))];
  const { data: books, error: booksError } = bookIds.length
    ? await supabase.from("books").select("id, title, authors, genres").in("id", bookIds)
    : { data: [], error: null };
  if (booksError) throw booksError;
  const byId = new Map(books.map((book) => [book.id, book]));

  return profiles.map((profile) =>
    toReader(
      profile,
      // a book the books table doesn't know yet has no title to show, so it is left out
      shelved
        .filter((row) => row.user_id === profile.id && byId.has(row.book_id))
        .map((row) => {
          const book = byId.get(row.book_id);
          return {
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
  return withBooks(data);
}

// One discoverable reader by username (or account id), or null.
export async function findReader(handle) {
  if (!env.HAS_SUPABASE) return demoReaders().find((reader) => reader.id === handle || reader.userId === handle) ?? null;
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("discoverable", true)
    .eq(isUuid(handle) ? "id" : "username", handle)
    .maybeSingle();
  if (error) throw error;
  return data ? (await withBooks([data]))[0] : null;
}

// The ids (as in reader.id) of the readers someone follows.
export async function followingOf(viewerId) {
  if (!env.HAS_SUPABASE) {
    const following = demoFollowing(viewerId);
    return demoReaders().filter((reader) => following.has(reader.userId)).map((reader) => reader.id);
  }
  const { data, error } = await supabase
    .from("connections")
    .select("target:profiles!connections_target_user_id_fkey(id, username)")
    .eq("user_id", viewerId);
  if (error) throw error;
  return data.filter((row) => row.target).map((row) => row.target.username || row.target.id);
}

// Follow or unfollow a reader (by reader.id); false when there is no such reader.
export async function setFollowing(viewerId, handle, follow) {
  const reader = await findReader(handle);
  if (!reader || reader.userId === viewerId) return false;

  if (!env.HAS_SUPABASE) {
    const following = demoFollowing(viewerId);
    if (follow) following.add(reader.userId);
    else following.delete(reader.userId);
    return true;
  }

  const query = follow
    ? supabase
        .from("connections")
        .upsert({ user_id: viewerId, target_user_id: reader.userId }, { onConflict: "user_id,target_user_id" })
    : supabase.from("connections").delete().eq("user_id", viewerId).eq("target_user_id", reader.userId);
  const { error } = await query;
  if (error) throw error;
  return true;
}
