// Scaffolded with AI assistance — see AI_USAGE.md
// Who is near you. A reader's exact position stops here: it is turned into a rough area of about
// 1 km (reader_areas) and discarded, and only the question "who is near?" is ever answered. No
// coordinates, area or distance go to another reader.
import { env } from "./env.js";
import { friendshipsOf, isDemoReader } from "./friends.js";
import { supabase } from "./supabase.js";

const CELLS_PER_DEGREE = 100;
// about 2 km, in areas
const REACH = 2;
const MAX_READERS = 8;
const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_MS = 14 * DAY_MS;

const toCell = (degrees) => Math.round(degrees * CELLS_PER_DEGREE);

function validPosition(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

// Whether two areas are within reach. A degree of longitude shrinks away from the equator.
function near(a, b) {
  const north = a.lat_cell - b.lat_cell;
  const east = (a.lng_cell - b.lng_cell) * Math.cos((a.lat_cell / CELLS_PER_DEGREE) * (Math.PI / 180));
  return Math.hypot(north, east) <= REACH;
}

async function isMinor(userId) {
  const { data, error } = await supabase.from("profile_private").select("age").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data?.age != null && data.age < 18;
}

// Marks you as active, saves your rough area when you're public and sent a position, and returns
// the readers near you: [{ id, userId, displayName, character, lastSeenAt, requested }], or nothing
// while you're private.
export async function checkIn(me, { lat, lng } = {}) {
  if (!env.HAS_SUPABASE) return [];

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", me)
    .select("discoverable")
    .maybeSingle();
  if (error) throw error;
  if (!profile?.discoverable || (await isMinor(me))) return [];

  if (validPosition(lat, lng)) {
    const area = { reader: me, lat_cell: toCell(lat), lng_cell: toCell(lng), updated_at: new Date().toISOString() };
    const { error: saveError } = await supabase.from("reader_areas").upsert(area);
    if (saveError) throw saveError;
  }
  return readersNear(me);
}

async function readersNear(me) {
  const { data: mine, error } = await supabase.from("reader_areas").select("*").eq("reader", me).maybeSingle();
  if (error) throw error;
  if (!mine) return [];

  const { data: areas, error: areasError } = await supabase
    .from("reader_areas")
    .select("*")
    .neq("reader", me)
    .gte("lat_cell", mine.lat_cell - REACH)
    .lte("lat_cell", mine.lat_cell + REACH);
  if (areasError) throw areasError;

  // friends are already in town; a declined or removed reader is gone for good
  const rows = await friendshipsOf(me);
  const otherOf = (row) => (row.requester === me ? row.addressee : row.requester);
  const hidden = new Set(rows.filter((row) => row.status !== "pending").map(otherOf));
  const asked = new Set(rows.filter((row) => row.status === "pending" && row.requester === me).map(otherOf));

  const cutoff = Date.now() - STALE_MS;
  const ids = areas
    .filter((area) => near(mine, area) && !hidden.has(area.reader))
    // demo readers never open the app, so their set areas don't go stale
    .filter((area) => new Date(area.updated_at).getTime() >= cutoff || isDemoReader(area.reader))
    .map((area) => area.reader);
  if (!ids.length) return [];

  const { data: minors, error: minorsError } = await supabase.from("profile_private").select("id").in("id", ids).lt("age", 18);
  if (minorsError) throw minorsError;
  const allowed = ids.filter((id) => !minors.some((minor) => minor.id === id));
  if (!allowed.length) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, display_name, character, last_active_at")
    .in("id", allowed)
    .eq("discoverable", true)
    .order("last_active_at", { ascending: false, nullsFirst: false })
    .limit(MAX_READERS);
  if (profilesError) throw profilesError;

  return profiles.map((profile) => ({
    id: profile.username || profile.id,
    userId: profile.id,
    displayName: profile.display_name || "Reader",
    character: profile.character || null,
    lastSeenAt: profile.last_active_at || null,
    requested: asked.has(profile.id),
  }));
}
