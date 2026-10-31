<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Requests waiting for your answer, then who is online: your friends, online ones first with a
// green dot, then everyone else with when they were last seen. Tapping a friend glides the map to
// them if they are out walking, or to their house if not, like the Places list.
import { computed } from 'vue'
import FriendRequestRow from './FriendRequestRow.vue'

const props = defineProps({
  // [{ id, displayName, lastSeenAt, online, lastSeen, house }], house being the place id
  friends: { type: Array, required: true },
  // [{ requestId, reader }]
  requests: { type: Array, default: () => [] },
  // readers near you, [{ id, displayName, online }]: the labelled way to the people on the canvas
  nearby: { type: Array, default: () => [] },
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['go', 'go-nearby', 'answer'])

const sorted = computed(() =>
  [...props.friends].sort((a, b) => Number(b.online) - Number(a.online) || new Date(b.lastSeenAt) - new Date(a.lastSeenAt)),
)
</script>

<template>
  <nav v-if="open" id="town-friends" class="friends-list" aria-label="Friends in town">
    <FriendRequestRow
      v-for="request in requests"
      :key="request.requestId"
      :request="request"
      @answer="(id, accept) => emit('answer', id, accept)"
    />
    <p v-if="!friends.length && !requests.length" class="friends-list__empty">No friends yet. Go public to find readers nearby: friends you add get a house in town.</p>
    <button
      v-for="friend in sorted"
      :key="friend.id"
      type="button"
      class="friends-list__friend"
      :disabled="!friend.house && !friend.online"
      @click="emit('go', friend)"
    >
      <span class="friends-list__dot" :class="{ 'is-online': friend.online }" aria-hidden="true"></span>
      <span class="friends-list__name">{{ friend.displayName }}</span>
      <span class="friends-list__seen">{{ friend.online ? 'Online now' : `Last seen ${friend.lastSeen}` }}</span>
    </button>
    <template v-if="nearby.length">
      <h2 class="friends-list__heading">Readers nearby</h2>
      <button
        v-for="reader in nearby"
        :key="reader.id"
        type="button"
        class="friends-list__friend"
        @click="emit('go-nearby', reader)"
      >
        <span class="friends-list__dot" :class="{ 'is-online': reader.online }" aria-hidden="true"></span>
        <span class="friends-list__name">{{ reader.displayName }}</span>
        <span class="friends-list__seen">{{ reader.online ? 'Online now' : 'Last seen around here' }}</span>
      </button>
    </template>
  </nav>
</template>

<style scoped>
.friends-list {
  position: absolute;
  top: 68px;
  right: 14px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: min(300px, calc(100% - 28px));
  max-height: calc(100% - 150px);
  overflow-y: auto;
  padding: 8px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card, 16px);
  background: var(--rl-surface);
  box-shadow: 0 10px 28px rgba(63, 46, 36, 0.2);
}

.friends-list__empty {
  margin: 0;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--rl-muted);
}

.friends-list__heading {
  margin: 8px 12px 2px;
  font-size: 13px;
  font-weight: 800;
  color: var(--rl-muted);
}

.friends-list__friend {
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

.friends-list__friend:hover,
.friends-list__friend:focus-visible {
  background: var(--rl-canvas);
}

.friends-list__dot {
  grid-row: span 2;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--rl-line);
}

.friends-list__dot.is-online {
  background: #3fae5a;
  box-shadow: 0 0 0 3px rgba(63, 174, 90, 0.22);
}

.friends-list__name {
  font-weight: 700;
  font-size: 15px;
}

.friends-list__seen {
  font-size: 13px;
  color: var(--rl-muted);
}
</style>
