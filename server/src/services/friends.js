// Scaffolded with AI assistance — see AI_USAGE.md
// Friends: a request one reader sends and the other accepts (the friendships table). Follows are
// separate and stay one-way. Without Supabase there are no friends. Demo readers can't answer, so
// they accept straight away.
import { DEMO_READERS, NEIGHBOUR_ID } from "../../data/demoReaders.js";
import { env } from "./env.js";
import { findReader, readersByIds } from "./readers.js";
import { addNote } from "./roomNotes.js";
import { supabase } from "./supabase.js";

// how many friends' houses the town has room for (FRIEND_HOUSES in client/src/town/places.js)
export const HOUSE_SPOTS = 7;

const demoIds = new Set(DEMO_READERS.map((reader) => reader.id));
export const isDemoReader = (userId) => demoIds.has(userId);

const otherOf = (row, me) => (row.requester === me ? row.addressee : row.requester);
const spotColumn = (row, me) => (row.requester === me ? "requester_spot" : "addressee_spot");

export async function friendshipsOf(me) {
  if (!env.HAS_SUPABASE) return [];
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .or(`requester.eq.${me},addressee.eq.${me}`)
    .order("accepted_at", { ascending: true });
  if (error) throw error;
  return data;
}

// Friends without a spot move into the free ones, longest-standing friends first. It runs on every
// load, so when a friend is removed the next one in line moves in.
async function giveOutSpots(accepted, me) {
  const taken = new Set(accepted.map((row) => row[spotColumn(row, me)]).filter((spot) => spot != null));
  for (const row of accepted) {
    const column = spotColumn(row, me);
    if (row[column] != null) continue;
    const free = Array.from({ length: HOUSE_SPOTS }, (_, spot) => spot).find((spot) => !taken.has(spot));
    if (free === undefined) return;
    const { error } = await supabase.from("friendships").update({ [column]: free }).eq("id", row.id);
    if (error) throw error;
    row[column] = free;
    taken.add(free);
  }
}

// { friends: readers with their house `spot` (null when the town is full), incoming: requests to
// you as { requestId, reader, at } (when it was sent), outgoing: the reader ids you've asked, sent: the
// same requests as { requestId, reader, at } for the list of who you're waiting on }
export async function friendsOf(me) {
  const rows = await friendshipsOf(me);
  const accepted = rows.filter((row) => row.status === "accepted");
  const incoming = rows.filter((row) => row.status === "pending" && row.addressee === me);
  const outgoing = rows.filter((row) => row.status === "pending" && row.requester === me);
  if (accepted.length) await giveOutSpots(accepted, me);

  const readers = await readersByIds(rows.filter((row) => row.status !== "closed").map((row) => otherOf(row, me)));
  const byId = new Map(readers.map((reader) => [reader.userId, reader]));
  return {
    friends: accepted
      .filter((row) => byId.has(otherOf(row, me)))
      .map((row) => ({ ...byId.get(otherOf(row, me)), spot: row[spotColumn(row, me)] })),
    incoming: incoming
      .filter((row) => byId.has(row.requester))
      .map((row) => ({ requestId: row.id, reader: byId.get(row.requester), at: row.created_at })),
    outgoing: outgoing.filter((row) => byId.has(row.addressee)).map((row) => byId.get(row.addressee).id),
    sent: outgoing
      .filter((row) => byId.has(row.addressee))
      .map((row) => ({ requestId: row.id, reader: byId.get(row.addressee), at: row.created_at })),
  };
}

// Sends a request to a reader (by reader.id), public or private: a private reader can be asked by
// their username, though nobody finds them nearby. If they already asked you, you're friends. A
// decline stays silent: asking again looks the same as asking the first time. False when there's
// no such reader.
export async function requestFriend(me, handle) {
  const reader = await findReader(handle, me, { anyone: true });
  if (!reader || reader.userId === me || !env.HAS_SUPABASE) return false;

  const accepted = isDemoReader(reader.userId);
  const existing = (await friendshipsOf(me)).find((row) => otherOf(row, me) === reader.userId);
  if (existing) {
    if (existing.status === "pending" && existing.addressee === me) await answerRequest(me, existing.id, true);
    // a demo reader you removed takes you back straight away too
    if (existing.status === "closed" && accepted) {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw error;
      await welcomeFromPip(me, reader);
    }
    return true;
  }
  const { error } = await supabase.from("friendships").insert({
    requester: me,
    addressee: reader.userId,
    status: accepted ? "accepted" : "pending",
    accepted_at: accepted ? new Date().toISOString() : null,
  });
  if (error) throw error;
  await welcomeFromPip(me, reader);
  return true;
}

// Pip, the neighbour, pins a welcome note on a new friend's board. A note that can't be pinned
// doesn't undo the friendship.
async function welcomeFromPip(me, reader) {
  if (reader.userId !== NEIGHBOUR_ID) return;
  try {
    await addNote(me, { id: NEIGHBOUR_ID, name: reader.displayName }, "Welcome to town, neighbour! Pop by the library any time. — Pip");
  } catch {
    // the friendship stands without the note
  }
}

// Accept or decline a request sent to you; false when there's no such request.
export async function answerRequest(me, requestId, accept) {
  if (!env.HAS_SUPABASE) return false;
  const { data, error } = await supabase
    .from("friendships")
    .update(accept ? { status: "accepted", accepted_at: new Date().toISOString() } : { status: "closed" })
    .eq("id", requestId)
    .eq("addressee", me)
    .eq("status", "pending")
    .select("id");
  if (error) throw error;
  return data.length > 0;
}

// Ends a friendship for both readers (by reader.id); false when you aren't friends.
export async function removeFriend(me, handle) {
  const reader = await findReader(handle, me);
  if (!reader) return false;
  const row = (await friendshipsOf(me)).find((other) => other.status === "accepted" && otherOf(other, me) === reader.userId);
  if (!row) return false;
  const { error } = await supabase
    .from("friendships")
    .update({ status: "closed", requester_spot: null, addressee_spot: null })
    .eq("id", row.id);
  if (error) throw error;
  return true;
}
