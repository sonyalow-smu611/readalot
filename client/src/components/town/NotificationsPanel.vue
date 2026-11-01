<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The bell's list, newest first: friend requests, friends coming online and visits to your room.
// Tapping one goes to it: the friends list, the friend on the map, or the visitor's profile.
import { presence } from '@/town/friends.js'

defineProps({
  // [{ id, kind, text, at, read, visitorId }] (see town/notificationsStore.js)
  items: { type: Array, required: true },
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['open-item', 'clear'])

const ago = (at) => presence(at).lastSeen
// a visitor who stays private has nowhere to go
const leadsNowhere = (item) => item.kind === 'visit' && !item.visitorId
</script>

<template>
  <section v-if="open" id="town-notifications" class="notifications" aria-label="Notifications">
    <header class="notifications__top">
      <h2 class="notifications__title">Notifications</h2>
      <button v-if="items.length" type="button" class="btn btn-secondary btn-sm" @click="emit('clear')">Clear all</button>
    </header>
    <p v-if="!items.length" class="notifications__empty">Nothing yet. Friend requests, friends coming online and visits to your room will show here.</p>
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="notifications__item"
      :class="{ 'is-unread': !item.read }"
      :disabled="leadsNowhere(item)"
      @click="emit('open-item', item)"
    >
      <span class="notifications__dot" aria-hidden="true"></span>
      <span class="notifications__text">{{ item.text }}</span>
      <span class="notifications__when">{{ ago(item.at) }}</span>
    </button>
  </section>
</template>

<style scoped>
.notifications {
  position: absolute;
  top: 68px;
  right: 14px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: min(320px, calc(100% - 28px));
  max-height: calc(100% - 150px);
  overflow-y: auto;
  padding: 8px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card, 16px);
  background: var(--rl-surface);
  box-shadow: 0 10px 28px rgba(63, 46, 36, 0.2);
}

.notifications__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  padding: 0 4px 0 12px;
}

.notifications__title {
  margin: 0;
  font-family: var(--rl-font-title);
  font-size: 17px;
  font-weight: 700;
  color: var(--rl-text);
}

.notifications__empty {
  margin: 0;
  padding: 6px 12px 10px;
  font-size: 14px;
  color: var(--rl-muted);
}

.notifications__item {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  column-gap: 10px;
  min-height: 52px;
  padding: 6px 12px;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--rl-text);
  text-align: left;
}

.notifications__item:not(:disabled):hover,
.notifications__item:focus-visible {
  background: var(--rl-canvas);
}

.notifications__dot {
  grid-row: span 2;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: transparent;
}

.is-unread .notifications__dot {
  background: #e5484d;
}

.notifications__text {
  font-size: 14px;
  font-weight: 700;
}

.notifications__when {
  font-size: 13px;
  color: var(--rl-muted);
}
</style>
