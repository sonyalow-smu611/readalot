<template>
  <section class="reader-chat" aria-label="Demo reader conversation">
    <div class="chat-title">
      <div>
        <h2>💌 Reader Chat</h2>
        <p>Leave a message for this bookworm.</p>
      </div>
      <button type="button" class="small-button" @click="resetChat">Reset demo</button>
    </div>

    <div class="demo-bar">
      <span>DEMO · Saved on this browser only</span>
      <label>
        View as
        <select v-model="activeSenderId" aria-label="Demo sender">
          <option :value="DEMO_USER_ID">You</option>
          <option :value="readerId">{{ readerName || 'Other reader' }}</option>
        </select>
      </label>
    </div>

    <div ref="messageBox" class="message-list" aria-live="polite">
      <p v-if="!messages.length" class="chat-state">No messages yet. Say hello! 📚</p>
      <div v-for="message in messages" :key="message.id"
           class="message-row" :class="{ mine: message.sender_id === activeSenderId }">
        <div class="message-bubble">
          <p>{{ message.content }}</p>
          <small>{{ displayDate(message.created_at) }}</small>
        </div>
      </div>
    </div>

    <form class="message-compose" @submit.prevent="send">
      <label for="reader-chat-text" class="visually-hidden">Message</label>
      <input id="reader-chat-text" v-model="draft" maxlength="1000"
             placeholder="Write a message…" :disabled="sending" required />
      <button :disabled="sending || !draft.trim()" type="submit">
        {{ sending ? 'Sending…' : 'Send' }}
      </button>
    </form>
    <p v-if="error" class="chat-error" role="alert">{{ error }}</p>
    <p class="chat-footer">Prototype only — other people cannot see these messages on their devices.</p>
  </section>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";
import {
  DEMO_USER_ID, getMessages, sendReaderMessage, clearDemoConversation,
} from "../../services/chatApi.js";
import { useProgressStore } from "../../stores/progress.js";

const props = defineProps({
  readerId: { type: String, required: true },
  readerName: { type: String, default: "" },
});
const progress = useProgressStore();
const activeSenderId = ref(DEMO_USER_ID);
const messages = ref([]);
const draft = ref("");
const sending = ref(false);
const error = ref("");
const messageBox = ref(null);
let version = 0;

async function scrollToBottom() {
  await nextTick();
  if (messageBox.value) messageBox.value.scrollTop = messageBox.value.scrollHeight;
}

async function loadMessages() {
  const currentVersion = version;
  try {
    const result = await getMessages(props.readerId);
    if (currentVersion !== version) return;
    messages.value = result.messages;
    await scrollToBottom();
  } catch (err) {
    if (currentVersion === version) error.value = err.message;
  }
}

async function send() {
  if (!draft.value.trim() || sending.value) return;
  const readerId = props.readerId;
  const currentVersion = version;
  sending.value = true;
  error.value = "";
  try {
    await sendReaderMessage(readerId, draft.value, activeSenderId.value);
    // up to 10 messages a day earn XP
    progress.earn("send_message", readerId);
    if (currentVersion !== version) return;
    draft.value = "";
    await loadMessages();
  } catch (err) {
    if (currentVersion === version) error.value = err.message;
  } finally {
    sending.value = false;
  }
}

async function resetChat() {
  if (!window.confirm("Reset this demo conversation to sample messages?")) return;
  try {
    clearDemoConversation(props.readerId);
    error.value = "";
    await loadMessages();
  } catch (err) {
    error.value = err.message;
  }
}

function displayDate(value) {
  return new Date(value).toLocaleString("en-SG", { dateStyle: "short", timeStyle: "short" });
}

watch(() => props.readerId, () => {
  version += 1;
  activeSenderId.value = DEMO_USER_ID;
  draft.value = "";
  messages.value = [];
  error.value = "";
  loadMessages();
}, { immediate: true });
</script>

<style scoped>
.reader-chat { margin: 22px 0; background: #fffaf3; border: 1px solid #e8dbc9; border-radius: 18px; padding: 16px; }
.chat-title { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.chat-title h2 { margin: 0 0 5px; font-size: 19px; color: #624b3c; }
.chat-title p, .chat-footer { color: #897666; font-size: 12px; }
.small-button { border-radius: 10px; padding: 7px 10px; border: 1px solid #ddcabb; background: white; font-size: 11px; cursor: pointer; }
.demo-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 12px 0; flex-wrap: wrap; font-size: 10px; color: #79695e; }
.demo-bar label { display: flex; align-items: center; gap: 6px; }
.demo-bar select { border-radius: 7px; padding: 5px; background: white; border: 1px solid #d9c9bc; max-width: 125px; }
.message-list { height: 260px; overflow-y: auto; padding: 14px; background: #f2e9de; border-radius: 12px; }
.chat-state { text-align: center; color: #776b60; font-size: 13px; padding: 28px 5px; }
.message-row { display: flex; margin-bottom: 10px; }
.message-row.mine { justify-content: flex-end; }
.message-bubble { max-width: 82%; padding: 10px 13px; background: white; border-radius: 14px; overflow-wrap: anywhere; }
.mine .message-bubble { background: #ddd0eb; }
.message-bubble p { margin: 0 0 6px; font-size: 13px; white-space: pre-wrap; }
.message-bubble small { display: block; text-align: right; color: #756d74; font-size: 10px; }
.message-compose { display: flex; gap: 7px; margin-top: 10px; }
.message-compose input { flex: 1; min-width: 0; padding: 11px; border: 1px solid #d9c9bc; border-radius: 10px; font: inherit; }
.message-compose button { padding: 10px 14px; background: #76598c; color: white; border: 0; border-radius: 10px; cursor: pointer; }
.message-compose button:disabled { opacity: .5; cursor: not-allowed; }
.chat-error { font-size: 12px; color: #a73b39; }
.chat-footer { margin-bottom: 0; }
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
</style>
