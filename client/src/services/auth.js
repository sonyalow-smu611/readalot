// Scaffolded with AI assistance — see AI_USAGE.md
// Email sign-in and the reader's saved profile, through the Supabase client.
// The profile lives in two tables: `profiles` (what other readers may see) and `profile_private`
// (gender, age, religion: only the reader). See database/profiles_and_tour.sql.
import { MISSING_KEYS, supabase } from '@/services/supabase.js'

const PENDING_KEY = 'readalot-pending-auth'

// store field → profiles column
const PUBLIC_FIELDS = {
  name: 'display_name',
  avatar: 'avatar',
  character: 'character',
  favouriteGenres: 'favorite_genres',
  location: 'location_name',
  discoverable: 'discoverable',
}
const PRIVATE_FIELDS = ['gender', 'age', 'religion']

export function authConfigured() {
  return Boolean(supabase)
}

function missing() {
  return { data: null, error: { message: MISSING_KEYS } }
}

export function rememberPending(email, purpose) {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify({ email, purpose }))
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

export async function beginRegister(email, password) {
  if (!supabase) return missing()
  const created = await supabase.auth.signUp({ email, password })
  if (created.error) return created
  const identities = created.data.user?.identities
  if (Array.isArray(identities) && identities.length === 0) {
    return { data: null, error: { message: 'That email is already registered. Log in instead.' } }
  }
  if (created.data.session) await supabase.auth.signOut()
  rememberPending(email, 'signup')
  return { data: { email }, error: null }
}

export async function beginLogin(email, password) {
  if (!supabase) return missing()
  const signed = await supabase.auth.signInWithPassword({ email, password })
  if (signed.error) return signed
  await supabase.auth.signOut()
  const sent = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })
  if (sent.error) return sent
  rememberPending(email, 'login')
  return { data: { email }, error: null }
}

export async function verifyEmailCode(email, token, purpose) {
  if (!supabase) return missing()
  const type = purpose === 'signup' ? 'signup' : 'email'
  const result = await supabase.auth.verifyOtp({ email, token, type })
  if (!result.error) clearPending()
  return result
}

export async function resendCode(email, purpose) {
  if (!supabase) return missing()
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
      avatar: row.avatar || '🐨',
      character: row.character,
      favouriteGenres: Array.isArray(row.favorite_genres) ? row.favorite_genres : [],
      location: row.location_name || '',
      discoverable: row.discoverable === true,
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

export async function markTourSeen(userId) {
  if (!supabase) return missing()
  return supabase.from('profiles').update({ tour_seen_at: new Date().toISOString() }).eq('id', userId)
}

export async function signOut() {
  if (!supabase) return { error: null }
  return supabase.auth.signOut()
}
