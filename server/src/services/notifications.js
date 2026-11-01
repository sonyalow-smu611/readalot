// Scaffolded with AI assistance — see AI_USAGE.md
// Who has visited your room. Visiting already earns the visitor XP (xp_events, action visit_room,
// at most once a day per room), so that row is the record of the visit. A visitor is only named if
// you could look them up anyway: a friend or a public reader. Anyone private, under-18s included,
// stays "someone". Without Supabase there are no visits.
import { env } from "./env.js";
import { friendshipsOf } from "./friends.js";
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
