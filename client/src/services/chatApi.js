// AI-assisted: user-to-user chat through Supabase RLS. Every reader with an account can be
// messaged, the sample readers included; one without an account can't.
import { supabase } from './supabase.js'
import { getReader } from './api.js'
// Pip the Librarian is only in the walkthrough and has no account: Pip's chat is kept here (see walkthroughPip.js)
import { PIP_ACCOUNT, messagePip, pipChat } from './walkthroughPip.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const NO_ACCOUNT = "This reader can't receive messages yet."

export async function getChatIdentity() {
  if (!supabase) throw new Error('Supabase is not configured. Check your .env file.')
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user?.id) throw new Error('Please sign in to use Reader Chat.')
  return data.user.id
}

// Resolve a username through the existing app API to the reader's account: { id }.
export async function resolveChatRecipient(readerId) {
  const id = String(readerId ?? '').trim()
  if (!id) throw new Error('No reader selected.')
  try {
    const { reader } = await getReader(id)
    const userId = reader?.userId ?? reader?.user_id
    if (UUID.test(String(userId ?? ''))) return { id: userId }
  } catch (err) {
    if (err?.message !== 'Reader not found') throw err // a server or network failure says so
  }
  throw new Error(NO_ACCOUNT)
}

export async function getMessages(recipientId, senderId) {
  if (recipientId === PIP_ACCOUNT) return pipChat()
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

export async function sendReaderMessage(recipientId, content, senderId) {
  const value = String(content ?? '').trim()
  if (!value || value.length > 1000) throw new Error('Write a message between 1 and 1000 characters.')
  if (recipientId === PIP_ACCOUNT) return messagePip(senderId, value)
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
