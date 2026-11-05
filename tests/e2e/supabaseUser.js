// Scaffolded with AI assistance — see AI_USAGE.md
// Real readers for the e2e tests. A test can't read the 6-digit email code, so this makes a
// confirmed user with the service-role key, signs in with a password, and hands the session to
// the page the way the Supabase client stores it. Each reader is deleted after their test.
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// the repo-root .env (Playwright runs from the repo root)
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasSupabase = Boolean(url && anonKey && serviceKey);
export const NEEDS_SUPABASE = "Set the Supabase keys in .env (including SUPABASE_SERVICE_ROLE_KEY) to run the e2e tests.";

const quiet = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = hasSupabase ? createClient(url, serviceKey, quiet) : null;

// profile: the store's fields to save as a finished Welcome, or null for a brand-new reader.
export async function createReader({ profile = null, tourSeen = true } = {}) {
  const email = `e2e-${randomUUID()}@readalot.test`;
  const password = randomUUID();
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw created.error;
  const id = created.data.user.id;
  try {
    return await signInReader({ id, email, password, profile, tourSeen });
  } catch (error) {
    // don't leave a half-made reader behind (e.g. when Supabase's sign-in limit is hit)
    await admin.from("profiles").delete().eq("id", id);
    await admin.auth.admin.deleteUser(id);
    throw error;
  }
}

// A private reader (not discoverable) with a username, never signed in, so it doesn't count
// towards Supabase's sign-in limit. Returns { id, username, remove }.
export async function createPrivateReader(name = "Priya Private") {
  const created = await admin.auth.admin.createUser({ email: `e2e-${randomUUID()}@readalot.test`, password: randomUUID(), email_confirm: true });
  if (created.error) throw created.error;
  const id = created.data.user.id;
  const username = `e2e.${id.slice(0, 8)}`;
  const remove = async () => {
    await admin.from("friendships").delete().or(`requester.eq.${id},addressee.eq.${id}`);
    await admin.from("profiles").delete().eq("id", id);
    await admin.auth.admin.deleteUser(id);
  };
  const saved = await admin.from("profiles").upsert({ id, username, display_name: name, discoverable: false });
  if (saved.error) {
    await remove();
    throw saved.error;
  }
  return { id, username, remove };
}

async function signInReader({ id, email, password, profile, tourSeen }) {
  if (profile) {
    const saved = await admin.from("profiles").upsert({
      id,
      // its own, so readers made at the same moment in parallel never reach for the same free name
      username: `e2e.${id.slice(0, 8)}`,
      display_name: profile.name,
      favorite_genres: profile.favouriteGenres ?? [],
      character: profile.character ?? null,
      discoverable: false,
      tour_seen_at: tourSeen ? new Date().toISOString() : null,
    });
    if (saved.error) throw saved.error;
  }

  const client = createClient(url, anonKey, quiet);
  const signed = await client.auth.signInWithPassword({ email, password });
  if (signed.error) throw signed.error;

  return {
    id,
    email,
    session: signed.data.session,
    async remove() {
      await admin.from("profiles").delete().eq("id", id);
      await admin.auth.admin.deleteUser(id);
    },
  };
}

// Puts a reader's profile back to a finished Welcome (or removes it), between tests that share
// one reader. A database write, not a sign-in, so it doesn't count towards Supabase's auth limit.
export async function resetProfile(id, profile) {
  await admin.from("profile_private").delete().eq("id", id);
  await admin.from("daily_state").delete().eq("reader", id);
  await admin.from("xp_events").delete().eq("reader", id);
  await admin.from("friendships").delete().or(`requester.eq.${id},addressee.eq.${id}`);
  await admin.from("reader_areas").delete().eq("reader", id);
  if (!profile) {
    await admin.from("profiles").delete().eq("id", id);
    return;
  }
  const saved = await admin.from("profiles").upsert({
    id,
    display_name: profile.name,
    avatar: null,
    favorite_genres: profile.favouriteGenres ?? [],
    character: profile.character ?? null,
    location_name: null,
    discoverable: false,
    location_asked_at: new Date().toISOString(),
    tour_seen_at: new Date().toISOString(),
    coins: 480,
  });
  if (saved.error) throw saved.error;
  // nothing read or cleared yet (database/notifications_seen.sql)
  await admin.from("profiles").update({ notifications_read_at: null, notifications_cleared_at: null }).eq("id", id);
}

// The date in Singapore, `offset` days on, as the daily tasks count days: 'YYYY-MM-DD'.
export function sgDay(offset = 0) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(new Date(Date.now() + offset * 24 * 60 * 60 * 1000));
}

// Sets a reader's daily tasks (database/daily_tasks.sql), as town/daily.js names them:
// { day, done, streak, lastClaim, freezes, notice, shown }. Anything left out starts fresh, today.
export async function setDaily(id, state = {}) {
  const { error } = await admin.from("daily_state").upsert({
    reader: id,
    day: state.day ?? sgDay(),
    done: state.done ?? [],
    streak: state.streak ?? 0,
    last_claim: state.lastClaim ?? null,
    freezes: state.freezes ?? 2,
    notice: state.notice ?? null,
    shown: state.shown ?? null,
  });
  if (error) throw error;
}

// Makes demo readers (by username) a reader's friends, each online if `online` lists them.
export async function befriend(id, usernames, online = []) {
  const { data, error } = await admin.from("profiles").select("id, username").in("username", usernames);
  if (error) throw error;
  const friends = usernames.map((username) => data.find((row) => row.username === username));
  const saved = await admin.from("friendships").insert(
    friends.map((friend, spot) => ({
      requester: id,
      addressee: friend.id,
      status: "accepted",
      requester_spot: spot,
      accepted_at: new Date(Date.now() + spot).toISOString(),
    }))
  );
  if (saved.error) throw saved.error;
  await markActive(online);
}

// Makes two readers friends (by account id), with no house spot given out yet.
export async function makeFriends(id, otherId) {
  const { error } = await admin.from("friendships").insert({ requester: id, addressee: otherId, status: "accepted", accepted_at: new Date().toISOString() });
  if (error) throw error;
}

// These readers were active just now. Nearby shows the most recently active first, and only a few.
export async function markActive(usernames) {
  const { error } = await admin.from("profiles").update({ last_active_at: new Date().toISOString() }).in("username", usernames);
  if (error) throw error;
}

// The prompt after the tour hasn't been answered yet.
export async function notAskedYet(id) {
  const saved = await admin.from("profiles").update({ location_asked_at: null }).eq("id", id);
  if (saved.error) throw saved.error;
}

export async function setAge(id, age) {
  const saved = await admin.from("profile_private").upsert({ id, age });
  if (saved.error) throw saved.error;
}

export async function setDiscoverable(id, discoverable) {
  const saved = await admin.from("profiles").update({ discoverable }).eq("id", id).select("discoverable").single();
  if (saved.error) throw saved.error;
  return saved.data.discoverable;
}

export async function storedArea(id) {
  const { data, error } = await admin.from("reader_areas").select("*").eq("reader", id).maybeSingle();
  if (error) throw error;
  return data;
}

// A code like the one in the sign-up or log-in email, made without sending an email.
// purpose "signup" leaves a new, unconfirmed account; "login" uses a confirmed one.
export async function emailCode(purpose) {
  const email = `e2e-${randomUUID()}@readalot.test`;
  const password = randomUUID();
  if (purpose === "login") {
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
  }
  const made = await admin.auth.admin.generateLink(
    purpose === "signup" ? { type: "signup", email, password } : { type: "magiclink", email },
  );
  if (made.error) throw made.error;
  const id = made.data.user.id;
  return {
    email,
    code: made.data.properties.email_otp,
    async remove() {
      await admin.from("profiles").delete().eq("id", id);
      await admin.auth.admin.deleteUser(id);
    },
  };
}

// Gives a reader XP as if they had earned it (a finished book per 100), for level tests.
export async function giveXp(id, xp) {
  const { error } = await admin.from("xp_events").insert({
    reader: id,
    action: "finish_book",
    target: `seed-${randomUUID()}`,
    day: new Date().toISOString().slice(0, 10),
    xp,
  });
  if (error) throw error;
}

// The reader's XP events, newest first.
export async function readXp(id) {
  const { data } = await admin.from("xp_events").select("*").eq("reader", id).order("id", { ascending: false });
  return data ?? [];
}

// A Supabase client with no sign-in: what any visitor's browser can do with the public key.
export function visitorClient() {
  return createClient(url, anonKey, quiet);
}

// A Supabase client signed in as the reader, to check what the database lets them do.
export function readerClient(session) {
  return createClient(url, anonKey, {
    ...quiet,
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
  });
}

// The saved profile row, for checking what the app wrote.
export async function readProfile(id) {
  const { data } = await admin.from("profiles").select("*").eq("id", id).maybeSingle();
  return data;
}

// Puts the session where the app's Supabase client looks for it, on the first load only, so a
// reload or a log-out inside the test behaves like the real thing.
export async function signInPage(page, session) {
  const key = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  await page.addInitScript(([storageKey, value]) => {
    try {
      if (sessionStorage.getItem("e2e-signed-in")) return;
      sessionStorage.setItem("e2e-signed-in", "1");
      localStorage.setItem(storageKey, value);
    } catch {
      // about:blank has no storage; the app's own page comes next
    }
  }, [key, JSON.stringify(session)]);
}
