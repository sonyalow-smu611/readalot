// Email sign-in through the Supabase client.
// With empty keys, login still reaches the code screen and any code continues, so the flow can be tested.
import { supabase } from '@/services/supabase.js'

const PENDING_KEY = 'readalot-pending-auth'
const PREVIEW_KEY = 'readalot-preview-user'
const MISSING = 'Email cannot be sent until the Supabase keys are set.'

export function authConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

function missing() {
  return { data: null, error: { message: MISSING } }
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

function readPreview() {
  try {
    const user = JSON.parse(sessionStorage.getItem(PREVIEW_KEY) || 'null')
    if (!user?.id || !user.email) return null
    return user
  } catch {
    return null
  }
}

function writePreview(user) {
  sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(user))
}

export async function currentSession() {
  if (!authConfigured()) {
    const user = readPreview()
    return { data: { session: user ? { user } : null }, error: null }
  }
  return supabase.auth.getSession()
}

export function watchAuth(onSession) {
  if (!authConfigured() || typeof supabase.auth.onAuthStateChange !== 'function') return () => {}
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    onSession(session)
  })
  return () => data.subscription.unsubscribe()
}

export async function beginRegister(email, password) {
  if (!authConfigured()) {
    rememberPending(email, 'signup')
    return { data: { email }, error: null }
  }
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
  if (!authConfigured()) {
    rememberPending(email, 'login')
    return { data: { email }, error: null }
  }
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
  if (!authConfigured()) {
    const existing = readPreview()
    const samePerson = existing?.email === email
    const user = {
      id: samePerson ? existing.id : `preview-${email}`,
      email,
      user_metadata: samePerson ? existing.user_metadata || {} : {},
    }
    writePreview(user)
    clearPending()
    return { data: { session: { user } }, error: null }
  }
  const type = purpose === 'signup' ? 'signup' : 'email'
  const result = await supabase.auth.verifyOtp({ email, token, type })
  if (!result.error) clearPending()
  return result
}

export async function resendCode(email, purpose) {
  if (!authConfigured()) return { data: { email }, error: null }
  if (purpose === 'signup') return supabase.auth.resend({ type: 'signup', email })
  return supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })
}

export async function saveProfile(details) {
  if (!authConfigured()) {
    const existing = readPreview()
    if (!existing) return missing()
    const user = {
      ...existing,
      user_metadata: { ...(existing.user_metadata || {}), ...details },
    }
    writePreview(user)
    return { data: { user }, error: null }
  }
  return supabase.auth.updateUser({ data: details })
}

export async function signOut() {
  if (!authConfigured()) {
    sessionStorage.removeItem(PREVIEW_KEY)
    return { error: null }
  }
  return supabase.auth.signOut()
}
