<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Your chats with friends in town, docked beside the zoom buttons: one box per friend you've said
// hi to. Tapping a box opens a mini chat above it with everything you've said to each other (the
// app's Reader Chat, components/people/ReaderChat, used as it is); tapping it again tucks it away.
import { computed } from 'vue'
import ReaderChat from '@/components/people/ReaderChat.vue'

const props = defineProps({
  // [{ id, userId, displayName, online }], newest first
  chats: { type: Array, required: true },
  // the id of the chat that is open, or null when they're all tucked away
  open: { type: String, default: null },
})
const emit = defineEmits(['toggle', 'close'])

const first = (name) => name.split(' ')[0]
const current = computed(() => props.chats.find((chat) => chat.id === props.open) ?? null)
</script>

<template>
  <div class="chat-dock">
    <section
      v-if="current"
      :key="current.id"
      class="chat-dock__window"
      role="region"
      :aria-label="`Chat with ${current.displayName}`"
    >
      <header class="chat-dock__top">
        <span class="chat-dock__dot" :class="{ 'is-online': current.online }" aria-hidden="true"></span>
        <h2 class="chat-dock__title">{{ current.displayName }}</h2>
        <button type="button" class="btn btn-secondary btn-icon chat-dock__icon" aria-label="Minimise chat" @click="emit('toggle', current.id)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" /></svg>
        </button>
      </header>
      <div class="chat-dock__body">
        <ReaderChat :reader-id="current.userId" :reader-name="current.displayName" />
      </div>
    </section>

    <div class="chat-dock__boxes">
      <div v-for="chat in chats" :key="chat.id" class="chat-dock__box" :class="{ 'is-open': chat.id === open }">
        <button
          type="button"
          class="chat-dock__name"
          :aria-label="`Chat with ${chat.displayName}`"
          :aria-expanded="chat.id === open"
          @click="emit('toggle', chat.id)"
        >
          <span class="chat-dock__dot" :class="{ 'is-online': chat.online }" aria-hidden="true"></span>
          {{ first(chat.displayName) }}
        </button>
        <button type="button" class="btn btn-secondary btn-icon chat-dock__icon" :aria-label="`Close chat with ${chat.displayName}`" @click="emit('close', chat.id)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" /></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* the boxes sit in line with the zoom-out button (TownMap: 14px in, 24px up, 44px buttons) */
.chat-dock__boxes {
  position: absolute;
  right: 68px;
  bottom: 24px;
  z-index: 6;
  display: flex;
  flex-direction: row-reverse;
  gap: 8px;
  max-width: calc(100% - 68px - 190px);
  overflow-x: auto;
}

/* a pixel card (styles/pixel-surfaces.css) holding the name and its close button */
.chat-dock__box {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 2px;
  padding: 2px 5px 5px 2px;
  border: var(--px-border);
  border-radius: 0;
  background: var(--rl-surface);
  box-shadow: var(--px-shadow);
}

.chat-dock__box.is-open {
  background: var(--px-paper-shade);
}

.chat-dock__name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 4px 0 12px;
  border: none;
  background: transparent;
  color: var(--rl-text);
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
}

.chat-dock__dot {
  flex-shrink: 0;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--rl-line);
}

.chat-dock__dot.is-online {
  background: #3fae5a;
}

.chat-dock__icon svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
}

/* the mini chat, above the boxes and the zoom buttons */
.chat-dock__window {
  position: absolute;
  right: 14px;
  bottom: 80px;
  z-index: 15;
  display: flex;
  flex-direction: column;
  width: min(380px, calc(100% - 28px));
  max-height: calc(100% - 170px);
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card, 16px);
  background: var(--rl-surface);
  box-shadow: 0 14px 36px rgba(63, 46, 36, 0.28);
  overflow: hidden;
}

.chat-dock__top {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px 6px 14px;
  border-bottom: 1px solid var(--rl-line);
}

.chat-dock__title {
  flex: 1;
  margin: 0;
  font-family: var(--rl-font-title);
  font-size: 17px;
  font-weight: 700;
  color: var(--rl-text);
}

.chat-dock__body {
  overflow-y: auto;
}

/* Reader Chat brings its own margins and border for its place on a profile page */
.chat-dock__body :deep(.reader-chat) {
  margin: 0;
  border: none;
  border-radius: 0;
}
</style>
