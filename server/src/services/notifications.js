// Scaffolded with AI assistance — see AI_USAGE.md
// Who has visited your room. Visiting already earns the visitor XP (xp_events, action visit_room,
// at most once a day per room), so that row is the record of the visit. A visitor is only named if
// you could look them up anyway: a friend or a public reader. Anyone private, under-18s included,
// stays "someone". Without Supabase there are no visits.
import { env } from "./env.js";
import { friendshipsOf } from "./friends.js";
import { readersByIds } from "./readers.js";
import { supabase } from "./supabase.js";

const MOST_VISITS = 20;

// Your friends' account ids.
async function friendIds(me) {
  const rows = await friendshipsOf(me);
  return new Set(rows.filter((row) => row.status === "accepted").map((row) => (row.requester === me ? row.addressee : row.requester)));
}

// [{ id, at, visitor: { id, displayName } or null }] since the date, newest first. visitor.id is
// what links to them, like reader.id.
export async function roomVisits(me, since) {
  if (!env.HAS_SUPABASE) return [];
  const { data: profile, error: profileError } = await supabase.from("profiles").select("username").eq("id", me).maybeSingle();
  if (profileError) throw profileError;

  // a room is earned against the reader's link: their username, or their account id
  const { data: visits, error } = await supabase
    .from("xp_events")
    .select("id, reader, created_at")
    .eq("action", "visit_room")
    .in("target", [me, profile?.username].filter(Boolean))
    .neq("reader", me)
    .gt("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(MOST_VISITS);
  if (error) throw error;
  if (!visits.length) return [];

  const { data: visitors, error: visitorsError } = await supabase
    .from("profiles")
    .select("id, username, display_name, discoverable")
    .in("id", [...new Set(visits.map((visit) => visit.reader))]);
  if (visitorsError) throw visitorsError;
  const friends = await friendIds(me);
  const byId = new Map(visitors.map((visitor) => [visitor.id, visitor]));

  return visits.map((visit) => {
    const visitor = byId.get(visit.reader);
    const named = visitor && (visitor.discoverable || friends.has(visitor.id));
    return {
      id: String(visit.id),
      at: visit.created_at,
      visitor: named ? { id: visitor.username || visitor.id, displayName: visitor.display_name || "A reader" } : null,
    };
  });
}

const ACCEPT_GAP_MS = 5000;
const MOST_ACTIVITY = 40;

// What happened between you and other readers since the date: requests you sent, ones that were
// accepted later (a demo reader accepts at once: not news), and your conversations, newest message
// per reader and direction. Each is { id, at, reader: { id, displayName } }; messages also carry
// `direction`, 'sent' or 'received'. reader.id is what links to them.
export async function activityOf(me, since) {
  if (!env.HAS_SUPABASE) return { sent: [], accepted: [], messages: [] };
  const after = since.getTime();
  const rows = (await friendshipsOf(me)).filter((row) => row.status !== "closed" || row.accepted_at);
  const mine = rows.filter((row) => row.requester === me);

  const { data: messages, error } = await supabase
    .from("reader_messages")
    .select("id, sender_id, receiver_id, created_at")
    .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
    .gt("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(MOST_ACTIVITY);
  if (error) throw error;

  const otherIds = [
    ...new Set([...mine.map((row) => row.addressee), ...messages.map((row) => (row.sender_id === me ? row.receiver_id : row.sender_id))]),
  ];
  const readers = new Map((await readersByIds(otherIds)).map((reader) => [reader.userId, { id: reader.id, displayName: reader.displayName }]));
  const named = (userId) => readers.get(userId) ?? null;

  const seen = new Set();
  const conversation = [];
  for (const row of messages) {
    const direction = row.sender_id === me ? "sent" : "received";
    const other = direction === "sent" ? row.receiver_id : row.sender_id;
    const key = `${direction}-${other}`;
    if (seen.has(key) || !named(other)) continue;
    seen.add(key);
    conversation.push({ id: String(row.id), at: row.created_at, direction, reader: named(other) });
  }

  return {
    sent: mine
      .filter((row) => row.status === "pending" && Date.parse(row.created_at) > after && named(row.addressee))
      .map((row) => ({ id: String(row.id), at: row.created_at, reader: named(row.addressee) })),
    accepted: mine
      .filter(
        (row) =>
          row.status === "accepted" &&
          Date.parse(row.accepted_at) > after &&
          Date.parse(row.accepted_at) - Date.parse(row.created_at) > ACCEPT_GAP_MS &&
          named(row.addressee),
      )
      .map((row) => ({ id: String(row.id), at: row.accepted_at, reader: named(row.addressee) })),
    messages: conversation,
  };
}
