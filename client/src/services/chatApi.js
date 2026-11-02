// AI-assisted: hybrid messaging. Real user-to-user chat uses Supabase RLS;
// readers without an Auth account use browser-only demo drafts, NOT delivered messages.
import { supabase } from './supabase.js'
import { getReader } from './api.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DEMO_PREFIX = 'readalot_demo_messages_unlinked_v2'

export async function getChatIdentity() {
  if (!supabase) throw new Error('Supabase is not configured. Check your .env file.')
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user?.id) throw new Error('Please sign in to use Reader Chat.')
  return data.user.id
}

// Resolve a username through the existing app API. Unlinked readers receive a
// LOCAL-ONLY demo conversation, never an invented Supabase account or UUID.
export async function resolveChatRecipient(readerId) {
  const id = String(readerId ?? '').trim()
  if (!id) throw new Error('No reader selected.')
  try {
    const { reader } = await getReader(id)
    const userId = reader?.userId ?? reader?.user_id
    if (UUID.test(String(userId ?? ''))) return { id: userId, demo: false }
    return { id, demo: true }
  } catch (err) {
    // Fictional demo reader IDs may not exist in the real reader API.
    if (err?.message === 'Reader not found') return { id, demo: true }
    throw err // Do not mistake server/network failures for an unlinked reader.
  }
}

function demoKey(readerId, senderId) {
  return `${DEMO_PREFIX}:${encodeURIComponent(senderId)}:${encodeURIComponent(readerId)}`
}

function readDemo(readerId, senderId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(demoKey(readerId, senderId)) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function getMessages(recipientId, senderId, { demo = false } = {}) {
  if (demo) return { messages: readDemo(recipientId, senderId) }
  if (!supabase) throw new Error('Supabase is not configured.')
  if (!UUID.test(String(recipientId)) || !UUID.test(String(senderId))) throw new Error('Invalid conversation.')
  const { data, error } = await supabase
    .from('reader_messages')
    .select('id,sender_id,receiver_id,content,created_at')
    .or(`and(sender_id.eq.${senderId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${senderId})`)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return { messages: (data || []).reverse() }
}

export async function sendReaderMessage(recipientId, content, senderId, { demo = false } = {}) {
  const value = String(content ?? '').trim()
  if (!value || value.length > 1000) throw new Error('Write a message between 1 and 1000 characters.')
  if (demo) {
    const item = {
      id: `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sender_id: senderId,
      receiver_id: recipientId,
      content: value,
      created_at: new Date().toISOString(),
    }
    try {
      const messages = [...readDemo(recipientId, senderId), item].slice(-100)
      localStorage.setItem(demoKey(recipientId, senderId), JSON.stringify(messages))
    } catch {
      throw new Error('Browser storage unavailable. Your demo message was not saved.')
    }
    return item
  }
  if (!supabase) throw new Error('Supabase is not configured.')
  if (!UUID.test(String(recipientId)) || !UUID.test(String(senderId)) || senderId === recipientId) {
    throw new Error('Invalid recipient.')
  }
  const { data, error } = await supabase
    .from('reader_messages')
    .insert({ sender_id: senderId, receiver_id: recipientId, content: value })
    .select('id,sender_id,receiver_id,content,created_at')
    .single()
  if (error) throw new Error(error.message)
  return data
}
