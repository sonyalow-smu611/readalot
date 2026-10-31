// Scaffolded with AI assistance — see AI_USAGE.md
// Notes left on readers' notice boards (the corkboard in their room): the room_notes table
// (database/room_notes.sql), joined to the author's profile for their name. Without Supabase
// they are kept in memory while the server runs.
import { env } from "./env.js";
import { supabase } from "./supabase.js";

export const NOTE_MAX = 140;

// { id, ownerId, authorId, author, text, createdAt }
function toNote(row, authorName) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    authorId: row.author_id,
    author: authorName || "A reader",
    text: row.content,
    createdAt: row.created_at
  };
}

const COLUMNS = "id, owner_id, author_id, content, created_at";
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// The authors' names, by account id. room_notes points at auth.users, so profiles are read apart.
async function namesOf(ids) {
  const unique = [...new Set(ids)];
  if (!unique.length) return new Map();
  const { data, error } = await supabase.from("profiles").select("id, display_name").in("id", unique);
  if (error) throw error;
  return new Map(data.map((profile) => [profile.id, profile.display_name]));
}

// ---- without Supabase: notes held in memory -------------------------------------------------

const demoRows = [];
let demoCount = 0;

// ---- the service ---------------------------------------------------------------------------

// A board's notes, newest first.
export async function listNotes(ownerId) {
  if (!env.HAS_SUPABASE) {
    // newest first: the order they were pinned, which two notes in one millisecond keep too
    return [...demoRows]
      .reverse()
      .filter((row) => row.owner_id === ownerId)
      .map((row) => toNote(row, row.author_name));
  }

  const { data, error } = await supabase
    .from("room_notes")
    .select(COLUMNS)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const names = await namesOf(data.map((row) => row.author_id));
  return data.map((row) => toNote(row, names.get(row.author_id)));
}

// Pins a note on someone else's board. author: { id, name }; text already checked by the route.
// The name is only used without Supabase, where the server has no profiles to read it from.
export async function addNote(ownerId, author, text) {
  if (!env.HAS_SUPABASE) {
    demoCount += 1;
    const row = {
      id: `demo-note-${demoCount}`,
      owner_id: ownerId,
      author_id: author.id,
      author_name: author.name,
      content: text,
      created_at: new Date().toISOString()
    };
    demoRows.push(row);
    return toNote(row, row.author_name);
  }

  const { data, error } = await supabase
    .from("room_notes")
    .insert({ owner_id: ownerId, author_id: author.id, content: text })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  const names = await namesOf([author.id]);
  return toNote(data, names.get(author.id));
}

// Takes a note off a board, when the reader asking left it or owns the board.
// Returns "removed", "missing" or "forbidden".
export async function removeNote(ownerId, noteId, readerId) {
  if (!env.HAS_SUPABASE) {
    const index = demoRows.findIndex((row) => row.id === noteId && row.owner_id === ownerId);
    if (index < 0) return "missing";
    const row = demoRows[index];
    if (row.author_id !== readerId && row.owner_id !== readerId) return "forbidden";
    demoRows.splice(index, 1);
    return "removed";
  }

  if (!isUuid(noteId)) return "missing";
  const { data: row, error } = await supabase
    .from("room_notes")
    .select(COLUMNS)
    .eq("id", noteId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  if (!row) return "missing";
  if (row.author_id !== readerId && row.owner_id !== readerId) return "forbidden";
  const removed = await supabase.from("room_notes").delete().eq("id", noteId);
  if (removed.error) throw removed.error;
  return "removed";
}
