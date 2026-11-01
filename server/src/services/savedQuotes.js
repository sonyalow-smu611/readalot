// Scaffolded with AI assistance — see AI_USAGE.md
// Quotes a reader keeps from their mood check-in: the saved_mood_quotes table
// (database/saved_mood_quotes.sql). Without Supabase they are kept in memory while the server runs.
import { env } from "./env.js";
import { supabase } from "./supabase.js";

export const QUOTE_MAX = 2000;

const COLUMNS = "id, user_id, quote_text, author, work, book_id, source_url, mood, created_at";
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// { id, quoteText, author, work, bookId, sourceUrl, mood, createdAt }
function toQuote(row) {
  return {
    id: row.id,
    quoteText: row.quote_text,
    author: row.author,
    work: row.work,
    bookId: row.book_id || null,
    sourceUrl: row.source_url || null,
    mood: row.mood || null,
    createdAt: row.created_at
  };
}

// ---- without Supabase: quotes held in memory ------------------------------------------------

const demoRows = [];
let demoCount = 0;

// ---- the service ---------------------------------------------------------------------------

// A reader's saved quotes, newest first.
export async function listQuotes(userId) {
  if (!env.HAS_SUPABASE) {
    // newest first: the order they were saved, which two saves in one millisecond keep too
    return [...demoRows].reverse().filter((row) => row.user_id === userId).map(toQuote);
  }

  const { data, error } = await supabase
    .from("saved_mood_quotes")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(toQuote);
}

// Saves a quote; one already saved comes back as it was. quote: checked by the route.
export async function saveQuote(userId, quote) {
  const row = {
    user_id: userId,
    quote_text: quote.quoteText,
    author: quote.author,
    work: quote.work,
    book_id: quote.bookId,
    source_url: quote.sourceUrl,
    mood: quote.mood
  };

  if (!env.HAS_SUPABASE) {
    const kept = demoRows.find(
      (r) => r.user_id === userId && r.book_id === row.book_id && r.quote_text === row.quote_text
    );
    if (kept) return toQuote(kept);
    demoCount += 1;
    const saved = { ...row, id: `demo-quote-${demoCount}`, created_at: new Date().toISOString() };
    demoRows.push(saved);
    return toQuote(saved);
  }

  // ignoreDuplicates leaves a saved quote untouched (and returns nothing), so it is read back
  const { error } = await supabase
    .from("saved_mood_quotes")
    .upsert(row, { onConflict: "user_id,book_id,quote_text", ignoreDuplicates: true });
  if (error) throw error;
  const { data, error: readError } = await supabase
    .from("saved_mood_quotes")
    .select(COLUMNS)
    .eq("user_id", userId)
    .eq("book_id", row.book_id)
    .eq("quote_text", row.quote_text)
    .single();
  if (readError) throw readError;
  return toQuote(data);
}

// Removes one of the reader's own quotes. Returns false when they have no such quote.
export async function removeQuote(userId, quoteId) {
  if (!env.HAS_SUPABASE) {
    const index = demoRows.findIndex((row) => row.id === quoteId && row.user_id === userId);
    if (index < 0) return false;
    demoRows.splice(index, 1);
    return true;
  }

  if (!isUuid(quoteId)) return false;
  const { data, error } = await supabase
    .from("saved_mood_quotes")
    .delete()
    .eq("id", quoteId)
    .eq("user_id", userId)
    .select("id");
  if (error) throw error;
  return data.length > 0;
}
