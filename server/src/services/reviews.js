// Scaffolded with AI assistance — see AI_USAGE.md
// Readers' reviews of a book, with who wrote them (the reviews table, joined to profiles).
// The reviews table is the only home for ratings: one review per reader per book, a 1-5 rating
// and an optional caption. Without Supabase the demo readers' reviews in data/demoReviews.js
// stand in, and new ones are kept in memory.
import { DEMO_READERS } from "../../data/demoReaders.js";
import { DEMO_REVIEWS, PRIVATE_DEMO_READER } from "../../data/demoReviews.js";
import { env } from "./env.js";
import { supabase } from "./supabase.js";

const DAY_MS = 24 * 60 * 60 * 1000;
// each review with who wrote it
const REVIEW_COLUMNS =
  "id, user_id, rating, review_text, created_at, updated_at, " +
  "reviewer:profiles!reviews_user_id_fkey(id, username, display_name, avatar, character, discoverable)";

// { id, rating, text, createdAt, updatedAt, mine, reviewer: { name, handle, character, avatar } }.
// handle links to the reviewer's page (their username, or account id); null when their profile
// is private. mine: the viewer wrote it.
function toReview(row, profile, viewerId) {
  return {
    id: row.id,
    rating: row.rating,
    text: row.review_text || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    mine: row.user_id === viewerId,
    reviewer: {
      name: profile?.display_name || profile?.username || "Reader",
      handle: profile?.discoverable ? profile.username || profile.id : null,
      character: profile?.character || null,
      avatar: profile?.avatar || ""
    }
  };
}

// ---- without Supabase: the demo readers' reviews, held in memory ---------------------------

const demoProfiles = new Map(
  [
    ...DEMO_READERS.map((reader) => ({ ...reader, discoverable: true })),
    { ...PRIVATE_DEMO_READER, username: "", discoverable: false }
  ].map((reader) => [
    reader.id,
    {
      id: reader.id,
      username: reader.username,
      display_name: reader.displayName,
      character: reader.character,
      discoverable: reader.discoverable
    }
  ])
);
const demoIdOf = (handle) => DEMO_READERS.find((reader) => reader.username === handle)?.id ?? handle;

const started = Date.now();
const demoRows = DEMO_REVIEWS.map((review, index) => {
  const at = new Date(started - review.daysAgo * DAY_MS).toISOString();
  return {
    id: `demo-review-${index + 1}`,
    user_id: demoIdOf(review.reader),
    book_id: review.bookId,
    rating: review.rating,
    review_text: review.text || null,
    created_at: at,
    updated_at: at
  };
});

// ids for reviews written while the server runs; never reused after a delete
let demoCount = demoRows.length;

// ---- the service ---------------------------------------------------------------------------

// A book's reviews, newest first.
export async function listReviews(bookId, viewerId) {
  if (!env.HAS_SUPABASE) {
    return demoRows
      .filter((row) => row.book_id === bookId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((row) => toReview(row, demoProfiles.get(row.user_id), viewerId));
  }

  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => toReview(row, row.reviewer, viewerId));
}

// Saves the reader's review of the book: their first, or an edit of the one they have.
// rating is 1-5 and text at most 500 characters, already checked by the route.
export async function saveReview(viewerId, bookId, { rating, text }) {
  const now = new Date().toISOString();

  if (!env.HAS_SUPABASE) {
    let row = demoRows.find((item) => item.user_id === viewerId && item.book_id === bookId);
    if (!row) {
      demoCount += 1;
      row = { id: `demo-review-${demoCount}`, user_id: viewerId, book_id: bookId, created_at: now };
      demoRows.push(row);
    }
    Object.assign(row, { rating, review_text: text || null, updated_at: now });
    return toReview(row, demoProfiles.get(viewerId), viewerId);
  }

  const { data, error } = await supabase
    .from("reviews")
    .upsert(
      { user_id: viewerId, book_id: bookId, rating, review_text: text || null, updated_at: now },
      { onConflict: "user_id,book_id" }
    )
    .select(REVIEW_COLUMNS)
    .single();
  if (error) throw error;
  return toReview(data, data.reviewer, viewerId);
}

// Deletes the reader's own review of the book, if they have one.
export async function deleteReview(viewerId, bookId) {
  if (!env.HAS_SUPABASE) {
    const index = demoRows.findIndex((item) => item.user_id === viewerId && item.book_id === bookId);
    if (index >= 0) demoRows.splice(index, 1);
    return;
  }

  const { error } = await supabase.from("reviews").delete().eq("user_id", viewerId).eq("book_id", bookId);
  if (error) throw error;
}

// The reader's own ratings, by book id: Map(bookId -> { rating, text }). The shelf reads
// "my rating" from here.
export async function myReviews(viewerId) {
  if (!env.HAS_SUPABASE) {
    return new Map(
      demoRows
        .filter((row) => row.user_id === viewerId)
        .map((row) => [row.book_id, { rating: row.rating, text: row.review_text || "" }])
    );
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("book_id, rating, review_text")
    .eq("user_id", viewerId);
  if (error) throw error;
  return new Map(data.map((row) => [row.book_id, { rating: row.rating, text: row.review_text || "" }]));
}
