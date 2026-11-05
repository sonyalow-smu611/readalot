<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Add a friend by username, requests waiting for your answer, then your friends, online ones first
// (FriendRow: their head, their book and a chat button), then everyone else. Tapping a friend
// glides the map to them if they are out walking, or to their house if not, like the Places list.
// Remove friends turns the rows into ticks, and asks once more before anything goes.
import { computed, ref, watch } from 'vue'
import AddFriendForm from './AddFriendForm.vue'
import FriendRequestRow from './FriendRequestRow.vue'
import LoadButton from '@/components/shared/LoadButton.vue'
import { DONE_FOR } from '@/lib/loading.js'
import FriendRow from './FriendRow.vue'

const props = defineProps({
  // [{ id, displayName, character, books, lastSeenAt, online, lastSeen, house }], house being the place id
  friends: { type: Array, required: true },
  // [{ requestId, reader }]
  requests: { type: Array, default: () => [] },
  // [{ requestId, reader }]: requests you sent that nobody has answered yet
  sent: { type: Array, default: () => [] },
  // readers near you, [{ id, displayName, online }]: the labelled way to the people on the canvas
  nearby: { type: Array, default: () => [] },
  open: { type: Boolean, default: false },
  // how the last Add friend went, { busy, ok, message }, or null
  addStatus: { type: Object, default: null },
  // the friend action on its way: { key, busy, failed } (TownView), for the Accept, Decline and
  // Remove buttons' spinner and tick
  action: { type: Object, default: null },
  // your own username; '' until you have one
  username: { type: String, default: '' },
})
const emit = defineEmits(['go', 'go-nearby', 'answer', 'chat', 'add', 'remove'])

const sorted = computed(() =>
  [...props.friends].sort((a, b) => Number(b.online) - Number(a.online) || new Date(b.lastSeenAt) - new Date(a.lastSeenAt)),
)

const adding = ref(false)
const selecting = ref(false)
const chosen = ref([])
const confirming = ref(false)
// only friends still in the list: one may have gone since they were ticked
const toRemove = computed(() => props.friends.filter((friend) => chosen.value.includes(friend.id)))
const removeLabel = computed(() => `${toRemove.value.length} ${toRemove.value.length === 1 ? 'friend' : 'friends'}`)

function stopSelecting() {
  selecting.value = false
  confirming.value = false
  chosen.value = []
}

function toggleAdding() {
  adding.value = !adding.value
  stopSelecting()
}

function startSelecting() {
  selecting.value = true
  adding.value = false
}

function toggleChosen(id) {
  confirming.value = false
  chosen.value = chosen.value.includes(id) ? chosen.value.filter((one) => one !== id) : [...chosen.value, id]
}

function remove() {
  emit('remove', toRemove.value)
}

// { busy, failed } for the action with that key
function stateOf(key) {
  const now = props.action?.key === key ? props.action : null
  return { busy: Boolean(now?.busy), failed: Boolean(now?.failed) }
}

// removed: the tick shows, then the list is back to normal
watch(
  () => props.action,
  (now) => {
    if (now?.key === 'remove-several' && !now.busy && !now.failed) window.setTimeout(stopSelecting, DONE_FOR)
  },
)

// shutting the list puts it back as it was
watch(
  () => props.open,
  (open) => {
    if (open) return
    adding.value = false
    stopSelecting()
  },
)
</script>

<template>
  <nav v-if="open" id="town-friends" class="friends-list" aria-label="Friends in town">
    <div v-if="!selecting" class="friends-list__tools">
      <button type="button" class="btn btn-secondary btn-sm" :aria-expanded="adding" @click="toggleAdding">Add friend</button>
      <button v-if="friends.length" type="button" class="btn btn-secondary btn-sm" @click="startSelecting">Remove friends</button>
    </div>
    <AddFriendForm v-if="adding" :status="addStatus" :username="username" @add="emit('add', $event)" />
    <template v-if="!selecting">
      <h2 class="friends-list__heading">Friend requests</h2>
      <FriendRequestRow
        v-for="request in requests"
        :key="request.requestId"
        :request="request"
        :accepting="stateOf(`accept-${request.requestId}`)"
        :declining="stateOf(`decline-${request.requestId}`)"
        @answer="(id, accept) => emit('answer', id, accept)"
      />
      <p v-if="!requests.length" class="friends-list__empty">No requests right now.</p>
      <template v-if="sent.length">
        <h2 class="friends-list__heading">Waiting for an answer</h2>
        <p v-for="request in sent" :key="request.requestId" class="friends-list__sent">
          You asked {{ request.reader.displayName }} to be friends
        </p>
      </template>
    </template>
    <h2 class="friends-list__heading">Your friends</h2>
    <p v-if="!friends.length" class="friends-list__empty">No friends yet. Go public to find readers nearby: friends you add get a house in town.</p>
    <FriendRow
      v-for="friend in sorted"
      :key="friend.id"
      :friend="friend"
      :selecting="selecting"
      :selected="chosen.includes(friend.id)"
      @go="emit('go', $event)"
      @chat="emit('chat', $event)"
      @toggle="toggleChosen"
    />
    <div v-if="selecting" class="friends-list__removing">
      <p class="friends-list__warning">
        {{ toRemove.length ? `This removes ${removeLabel} for both of you, and can't be undone.` : 'Tick the friends to remove.' }}
      </p>
      <div class="friends-list__tools">
        <button type="button" class="btn btn-secondary btn-sm" @click="stopSelecting">Cancel</button>
        <LoadButton
          class="btn btn-danger btn-sm"
          :disabled="!toRemove.length"
          :busy="stateOf('remove-several').busy"
          :failed="stateOf('remove-several').failed"
          busy-text="Removing…"
          done-text="Removed"
          @click="confirming ? remove() : (confirming = true)"
        >
          {{ confirming ? `Yes, remove ${removeLabel}` : 'Remove' }}
        </LoadButton>
      </div>
    </div>
    <template v-if="nearby.length && !selecting">
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
  /* over the chat boxes along the bottom */
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: min(330px, calc(100% - 28px));
  max-height: calc(100% - 150px);
  overflow-y: auto;
  padding: 8px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card, 16px);
  background: var(--rl-surface);
  box-shadow: 0 10px 28px rgba(63, 46, 36, 0.2);
}

.friends-list__tools {
  display: flex;
  gap: var(--rl-btn-gap);
  padding: 2px;
}

.friends-list__tools .btn {
  flex: 1;
}

/* stays in view however long the list is */
.friends-list__removing {
  position: sticky;
  bottom: -8px;
  margin: 4px -8px -8px;
  padding: 8px;
  border-top: 1px solid var(--rl-line);
  background: var(--rl-surface);
}

.friends-list__warning {
  margin: 0 4px 6px;
  font-size: 13px;
  color: var(--rl-muted);
}

.friends-list__empty {
  margin: 0;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--rl-muted);
}

.friends-list__sent {
  margin: 0;
  padding: 4px 12px;
  font-size: 14px;
  font-weight: 700;
  color: var(--rl-text);
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
