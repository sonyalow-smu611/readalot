<script setup>
// AI-assisted scaffold — team review and AI_USAGE.md documentation required.
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  getChatIdentity, resolveChatRecipient, getMessages, sendReaderMessage,
} from '@/services/chatApi.js'

const props = defineProps({
  readerId: { type: String, required: true },
  readerName: { type: String, default: '' },
})

const myId = ref('')
const recipientId = ref('')
const messages = ref([])
const draft = ref('')
const loading = ref(true)
const sending = ref(false)
const error = ref('')
const messageBox = ref(null)
let version = 0
let interval = null

function timeLabel(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-SG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function scrollBottom() {
  await nextTick()
  if (messageBox.value) messageBox.value.scrollTop = messageBox.value.scrollHeight
}

async function refresh({ silent = false } = {}) {
  if (!recipientId.value || !myId.value) return
  const selected = version
  try {
    const { messages: items } = await getMessages(recipientId.value, myId.value)
    if (selected !== version) return
    const prevLast = messages.value.at(-1)?.id
    messages.value = items
    if (prevLast !== items.at(-1)?.id) await scrollBottom()
    error.value = ''
  } catch (err) {
    if (selected === version && !silent) error.value = err.message || 'Could not load messages.'
  }
}

async function setup() {
  const selected = ++version
  loading.value = true
  error.value = ''
  messages.value = []
  recipientId.value = ''
  if (interval) clearInterval(interval)
  try {
    const [self, other] = await Promise.all([getChatIdentity(), resolveChatRecipient(props.readerId)])
    if (selected !== version) return
    if (self === other.id) throw new Error('You cannot message yourself.')
    myId.value = self
    recipientId.value = other.id
    await refresh()
    if (selected !== version) return
    interval = setInterval(() => {
      if (!sending.value && !document.hidden) refresh({ silent: true })
    }, 8000)
  } catch (err) {
    if (selected === version) error.value = err.message || 'Could not open this conversation.'
  } finally {
    if (selected === version) loading.value = false
  }
}

async function send() {
  if (sending.value || !draft.value.trim() || !recipientId.value) return
  sending.value = true
  const text = draft.value
  const selected = version
  try {
    await sendReaderMessage(recipientId.value, text, myId.value)
    if (selected !== version) return
    draft.value = ''
    await refresh()
  } catch (err) {
    if (selected === version) error.value = err.message || 'Message not sent.'
  } finally {
    sending.value = false
  }
}

watch(() => props.readerId, setup)
onMounted(setup)
onUnmounted(() => { version++; if (interval) clearInterval(interval) })
</script>

<template>
  <section class="bookworm-chat" aria-label="Private reader messages">
    <div class="chat-heading">
      <span class="heading-badge">✉ READER MESSAGES</span>
      <span class="private-label">PRIVATE CONVERSATION</span>
    </div>

    <div class="chat-card">
      <div class="chat-reader">
        <div class="chat-portrait" aria-hidden="true">📚</div>
        <div>
          <strong>{{ readerName || 'Fellow reader' }}</strong>
          <small>Talk books, share recommendations and say hello!</small>
        </div>
      </div>

      <div ref="messageBox" class="message-list" aria-live="polite" aria-relevant="additions text">
        <p v-if="loading" class="chat-state">Opening your conversation…</p>
        <p v-else-if="!messages.length && !error" class="chat-state">
          No messages yet. Start a bookish conversation! ☕
        </p>
        <div
          v-for="message in messages" :key="message.id"
          class="message-row" :class="{ mine: message.sender_id === myId }"
        >
          <div class="bubble">
            <span class="bubble-name">{{ message.sender_id === myId ? 'YOU' : (readerName || 'READER') }}</span>
            <p>{{ message.content }}</p>
            <time :datetime="message.created_at">{{ timeLabel(message.created_at) }}</time>
          </div>
        </div>
      </div>

      <form class="composer" @submit.prevent="send">
        <label class="visually-hidden" for="cafe-chat-input">Your message</label>
        <textarea
          id="cafe-chat-input" v-model="draft" maxlength="1000" rows="2"
          placeholder="Write a message about books…" :disabled="loading || sending || !recipientId"
          @keydown.enter.exact.prevent="send"
        />
        <button type="submit" :disabled="loading || sending || !draft.trim() || !recipientId">
          {{ sending ? 'SENDING…' : 'SEND →' }}
        </button>
      </form>
      <p v-if="error" role="alert" class="chat-error">{{ error }}</p>
      <p class="chat-note">Only you and this reader can view these messages. Be kind and protect your privacy.</p>
    </div>
  </section>
</template>

<style scoped>
.bookworm-chat { margin: 28px 0 36px; font-family: inherit; color: #2d2328; }
.chat-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: -3px; flex-wrap: wrap; }
.heading-badge { position: relative; z-index: 1; padding: 9px 14px; background: #eac17c; border: 3px solid #29232a; box-shadow: 4px 4px 0 #29232a; font-size: 13px; font-weight: 900; letter-spacing: .6px; }
.private-label { font-size: 10px; font-weight: 800; letter-spacing: .7px; color: #5a6d4b; }
.chat-card { background: #fffae9; border: 4px solid #2e2630; box-shadow: 6px 6px 0 #30252e; padding: 17px 14px 12px; }
.chat-reader { display: flex; gap: 12px; align-items: center; padding-bottom: 14px; border-bottom: 3px solid #30252e; }
.chat-portrait { width: 52px; height: 54px; flex-shrink: 0; border: 3px solid #30252e; background: #e2d19d; display: grid; place-items: center; font-size: 27px; }
.chat-reader strong { display: block; font-size: 18px; font-family: Georgia,serif; font-weight: 800; }
.chat-reader small { display: block; font-size: 11px; line-height: 1.5; color: #6d5c52; margin-top: 3px; }
.message-list { background: #f3e4bd; margin: 12px 0; border: 3px solid #30252e; height: 275px; overflow-y: auto; padding: 13px 10px; }
.chat-state { margin: 68px auto 0; max-width: 220px; text-align: center; font-size: 13px; font-weight: 650; line-height: 1.6; color: #65534a; }
.message-row { display: flex; margin-bottom: 12px; justify-content: flex-start; }
.message-row.mine { justify-content: flex-end; }
.bubble { border: 3px solid #30252e; background: #fffdf5; padding: 8px 11px; max-width: 88%; box-shadow: 3px 3px 0 #695444; overflow-wrap: anywhere; }
.mine .bubble { background: #d4e4bc; box-shadow: 3px 3px 0 #758b62; }
.bubble-name { display: block; font-size: 10px; letter-spacing: .5px; font-weight: 900; color: #5b6849; margin-bottom: 5px; }
.bubble p { margin: 0 0 6px; font-size: 13px; line-height: 1.5; white-space: pre-wrap; }
.bubble time { display: block; text-align: right; font-size: 10px; color: #716256; }
.composer { display: flex; gap: 8px; align-items: stretch; }
.composer textarea { width: 100%; flex: 1; min-width: 0; padding: 10px; resize: vertical; border: 3px solid #30252e; border-radius: 0; background: #fffdf5; color: #30252e; font: inherit; font-size: 13px; }
.composer textarea:focus { outline: 3px solid #d3a968; outline-offset: 2px; }
.composer button { min-width: 86px; background: #5b774c; color: #fffdf3; border: 3px solid #30252e; border-radius: 0; box-shadow: 3px 3px 0 #30252e; padding: 8px; font-size: 12px; font-weight: 900; cursor: pointer; }
.composer button:disabled { opacity: .55; cursor: not-allowed; }
.chat-error { color: #963d35; background: #ffe2d7; border: 2px solid #963d35; padding: 9px; margin-top: 12px; font-size: 12px; }
.chat-note { color: #6d6057; margin: 14px 0 0; font-size: 10px; line-height: 1.5; }
@media (max-width: 410px) { .chat-card { padding: 14px 9px 11px; } .message-list { height: 240px; } .composer { flex-direction: column; } .composer button { padding: 11px; } }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; } }
</style>
