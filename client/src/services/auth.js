// Scaffolded with AI assistance — see AI_USAGE.md
// Email sign-in and the reader's saved profile, through the Supabase client.
// The profile lives in two tables: `profiles` (what other readers may see) and `profile_private`
// (gender, age, religion: only the reader). See database/profiles_and_tour.sql.
import { MISSING_KEYS, REMEMBER_DAYS, setRemember, supabase } from '@/services/supabase.js'
import { cleanGenres } from '@/lib/genreShelves.js'

const PENDING_KEY = 'readalot-pending-auth'

// store field → profiles column
const PUBLIC_FIELDS = {
  name: 'display_name',
  // set at Register; the salon's Edit profile can change it (unique, see USERNAME_PATTERN)
  username: 'username',
  avatar: 'avatar',
  character: 'character',
  favouriteGenres: 'favorite_genres',
  location: 'location_name',
  discoverable: 'discoverable',
  locationAsked: 'location_asked_at',
}
const PRIVATE_FIELDS = ['gender', 'age', 'religion']

// Demo accounts. An email on a demo domain has no inbox, so it never gets an emailed code: its
// code is always DEMO_CODE, and the password it was registered or logged in with does the real
// sign-in (server/src/routes/demoAuth.js makes the account). Any other email gets a real code.
// VITE_DEMO_CODE_DOMAINS= (empty) turns this off; unset means the demo domain.
export const DEMO_CODE = '111111'
const DEMO_DOMAINS = String(import.meta.env.VITE_DEMO_CODE_DOMAINS ?? 'demo.ikda.app')
  .split(',')
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean)

export function isDemoEmail(email) {
  const text = String(email || '').trim().toLowerCase()
  // the domain is what follows the last @, so "a@demo.ikda.app@elsewhere.com" is not a demo email
  return text.indexOf('@') > 0 && DEMO_DOMAINS.includes(text.slice(text.lastIndexOf('@') + 1))
}

// The password for a demo account's code step, kept only in memory (never saved), so a reload
// on the code screen asks for the log in again.
let demoPassword = ''

export function authConfigured() {
  return Boolean(supabase)
}

function missing() {
  return { data: null, error: { message: MISSING_KEYS } }
}

// `remember` is the Remember me choice, kept with the code step so it is used when the code is accepted
export function rememberPending(email, purpose, remember = true) {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify({ email, purpose, remember }))
}

export function readPending() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null')
    if (!saved?.email || (saved.purpose !== 'signup' && saved.purpose !== 'login')) return null
    return saved
  } catch {
    return null
  }
}

export function clearPending() {
  sessionStorage.removeItem(PENDING_KEY)
}

export async function currentSession() {
  if (!supabase) return { data: { session: null }, error: null }
  return supabase.auth.getSession()
}

export function watchAuth(onSession) {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    // Supabase asks that no other Supabase call is awaited inside this callback
    window.setTimeout(() => onSession(session), 0)
  })
  return () => data.subscription.unsubscribe()
}

// A username a reader may pick: 3 to 20 lowercase letters, numbers, dots and underscores
// (database/chosen_usernames.sql checks the same).
export const USERNAME_PATTERN = /^[a-z0-9._]{3,20}$/

// Whether nobody has this username yet: { data: true | false } (database/chosen_usernames.sql).
export async function usernameFree(username) {
  if (!supabase) return missing()
  return supabase.rpc('readalot_username_free', { name: username })
}

// The username is kept on the account until Welcome makes the profile, which takes it.
export async function beginRegister(email, password, username) {
  if (!supabase) return missing()
  if (isDemoEmail(email)) return beginDemoRegister(email, password, username)
  const created = await supabase.auth.signUp({ email, password, options: { data: { username } } })
  if (created.error) return created
  const identities = created.data.user?.identities
  if (Array.isArray(identities) && identities.length === 0) {
    return { data: null, error: { message: 'That email is already registered. Log in instead.' } }
  }
  if (created.data.session) await supabase.auth.signOut()
  rememberPending(email, 'signup')
  return { data: { email }, error: null }
}

async function beginDemoRegister(email, password, username) {
  let reply
  try {
    reply = await fetch('/api/demo-auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username }),
    })
  } catch {
    return { data: null, error: { message: "Couldn't reach the server. Try again." } }
  }
  const body = await reply.json().catch(() => ({}))
  if (!reply.ok) return { data: null, error: { message: body.error || 'Sign up did not work. Try again.' } }
  demoPassword = password
  rememberPending(email, 'signup')
  return { data: { email }, error: null }
}

// Devices that have already confirmed a reader's email with a code and were asked to remember them:
// { email: the day it stops counting (ms) }, kept on this browser for 30 days. Logging back in there
// needs the password only, not another emailed code. Logging out leaves it as it is.
const TRUSTED_KEY = 'readalot-trusted'
const TRUST_MS = REMEMBER_DAYS * 24 * 60 * 60 * 1000

function readTrusted() {
  try {
    return JSON.parse(localStorage.getItem(TRUSTED_KEY) || '{}') || {}
  } catch {
    return {}
  }
}

function writeTrusted(list) {
  try {
    localStorage.setItem(TRUSTED_KEY, JSON.stringify(list))
  } catch {
    // no storage: the code is asked for next time
  }
}

const trustName = (email) => String(email || '').trim().toLowerCase()

export function isTrustedDevice(email) {
  return Number(readTrusted()[trustName(email)]) > Date.now()
}

function trustDevice(email, on) {
  const list = readTrusted()
  const now = Date.now()
  // forget the ones whose 30 days are over while we are here
  for (const [name, until] of Object.entries(list)) if (Number(until) <= now) delete list[name]
  if (on) list[trustName(email)] = now + TRUST_MS
  else delete list[trustName(email)]
  writeTrusted(list)
}

export async function beginLogin(email, password, remember = true) {
  if (!supabase) return missing()
  const signed = await supabase.auth.signInWithPassword({ email, password })
  if (signed.error) return signed
  // a device the reader confirmed and asked to remember: the password was enough, straight in
  if (remember && isTrustedDevice(email) && signed.data.session) {
    setRemember(true)
    // saved again, now that it is kept for 30 days
    await supabase.auth.setSession({
      access_token: signed.data.session.access_token,
      refresh_token: signed.data.session.refresh_token,
    })
    return { data: { email, session: signed.data.session, trusted: true }, error: null }
  }
  await supabase.auth.signOut()
  if (isDemoEmail(email)) {
    // the password was right: no email is sent, the code is DEMO_CODE
    demoPassword = password
    rememberPending(email, 'login', remember)
    return { data: { email }, error: null }
  }
  const sent = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })
  if (sent.error) return sent
  rememberPending(email, 'login', remember)
  return { data: { email }, error: null }
}

export async function verifyEmailCode(email, token, purpose) {
  if (!supabase) return missing()
  // where the session is kept (30 days, or until the browser closes) is decided before it is made
  const remember = readPending()?.remember !== false
  setRemember(remember)
  if (isDemoEmail(email)) {
    if (token !== DEMO_CODE) return { data: null, error: { message: `That code is not right. The demo code is ${DEMO_CODE}.` } }
    if (!demoPassword) return { data: null, error: { message: 'Go back and log in again, then enter the code.' } }
    const signed = await supabase.auth.signInWithPassword({ email, password: demoPassword })
    if (!signed.error) {
      demoPassword = ''
      clearPending()
      trustDevice(email, remember)
    }
    return signed
  }
  const type = purpose === 'signup' ? 'signup' : 'email'
  const result = await supabase.auth.verifyOtp({ email, token, type })
  if (!result.error) {
    clearPending()
    trustDevice(email, remember)
  }
  return result
}

export async function resendCode(email, purpose) {
  if (!supabase) return missing()
  if (isDemoEmail(email)) return { data: null, error: null }
  if (purpose === 'signup') return supabase.auth.resend({ type: 'signup', email })
  return supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })
}

// The reader's saved profile in the store's shape, or null when they have not finished Welcome.
export async function loadProfile(userId) {
  if (!supabase) return missing()
  const [shared, own] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('profile_private').select('*').eq('id', userId).maybeSingle(),
  ])
  const error = shared.error || own.error
  if (error) return { data: null, error }
  if (!shared.data) return { data: null, error: null }
  const row = shared.data
  const details = own.data || {}
  return {
    data: {
      name: row.display_name || '',
      username: row.username || '',
      avatar: row.avatar || '🐨',
      character: row.character,
      favouriteGenres: cleanGenres(row.favorite_genres),
      location: row.location_name || '',
      discoverable: row.discoverable === true,
      locationAsked: row.location_asked_at || '',
      gender: details.gender || '',
      age: details.age ?? '',
      religion: details.religion || '',
      tourSeen: Boolean(row.tour_seen_at),
    },
    error: null,
  }
}

// Saves only the fields given; Welcome sends them all, the salon one or two at a time.
export async function saveProfile(details) {
  if (!supabase) return missing()
  const { data } = await supabase.auth.getUser()
  const id = data.user?.id
  if (!id) return { data: null, error: { message: 'You are signed out. Log in again.' } }

  const shared = { id }
  for (const [field, column] of Object.entries(PUBLIC_FIELDS)) {
    if (field in details) shared[column] = details[field]
  }
  const saved = await supabase.from('profiles').upsert(shared)
  // 23505: unique_violation. Usernames are unique, and someone may take one between the check
  // and the save.
  if (saved.error?.code === '23505' && 'username' in details) {
    return { data: null, error: { message: 'Someone already has that username. Try another.' } }
  }
  if (saved.error) return saved

  const own = { id }
  for (const field of PRIVATE_FIELDS) {
    if (field in details) own[field] = details[field]
  }
  if (Object.keys(own).length > 1) {
    const savedOwn = await supabase.from('profile_private').upsert(own)
    if (savedOwn.error) return savedOwn
  }
  return { data: details, error: null }
}

// When the reader last read and last cleared their notifications: { readAt, clearedAt }, '' for
// never (database/notifications_seen.sql).
export async function loadNotificationTimes(userId) {
  if (!supabase) return missing()
  const { data, error } = await supabase
    .from('profiles')
    .select('notifications_read_at, notifications_cleared_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) return { data: null, error }
  return { data: { readAt: data?.notifications_read_at ?? '', clearedAt: data?.notifications_cleared_at ?? '' }, error: null }
}

// Saves whichever of the two times is given.
export async function saveNotificationTimes(userId, { readAt, clearedAt }) {
  if (!supabase) return missing()
  const changes = {}
  if (readAt) changes.notifications_read_at = readAt
  if (clearedAt) changes.notifications_cleared_at = clearedAt
  return supabase.from('profiles').update(changes).eq('id', userId)
}

// When the reader last opened their own notice board (database/notes_seen.sql), or '' if never.
export async function loadNotesReadAt(userId) {
  if (!supabase) return missing()
  const { data, error } = await supabase.from('profiles').select('notes_read_at').eq('id', userId).maybeSingle()
  if (error) return { data: null, error }
  return { data: data?.notes_read_at ?? '', error: null }
}

export async function saveNotesReadAt(userId, at) {
  if (!supabase) return missing()
  return supabase.from('profiles').update({ notes_read_at: at }).eq('id', userId)
}

export async function markTourSeen(userId) {
  if (!supabase) return missing()
  return supabase.from('profiles').update({ tour_seen_at: new Date().toISOString() }).eq('id', userId)
}

export async function signOut() {
  if (!supabase) return { error: null }
  return supabase.auth.signOut()
}
