<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The card that slides up when you stop a reader out walking. A friend: what they're up to, and
// the ways on (talk to them, visit their house, remove them). A reader nearby: add them as a
// friend, or see their profile.
import { onMounted, ref } from 'vue'

const props = defineProps({
  // { id, displayName, online, lastSeen } (see town/friends.js)
  friend: { type: Object, required: true },
  // their house (an entry of FRIEND_HOUSES in town/places.js), or null if they have none
  house: { type: Object, default: null },
  // a reader near you, not a friend yet
  nearby: { type: Boolean, default: false },
  // you've already asked this reader
  requested: { type: Boolean, default: false },
})
const emit = defineEmits(['talk', 'visit', 'add', 'profile', 'remove', 'close'])

const card = ref(null)
const first = props.friend.displayName.split(' ')[0]
// Remove friend asks once more before it happens
const confirmingRemove = ref(false)

// keyboard and screen reader users land on the card
onMounted(() => card.value?.focus())
</script>

<template>
  <div
    ref="card"
    class="friend-card"
    role="dialog"
    :aria-label="friend.displayName"
    tabindex="-1"
    @keydown.esc="emit('close')"
  >
    <div class="friend-card__top">
      <span class="friend-card__tab" :class="{ 'is-nearby': nearby }">{{ nearby ? 'Reader nearby' : 'Friend' }}</span>
      <button type="button" class="btn btn-secondary btn-icon friend-card__close" aria-label="Close" @click="emit('close')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
    </div>
    <h2 class="friend-card__title">{{ friend.displayName }}</h2>
    <p class="friend-card__presence">
      <span class="friend-card__dot" :class="{ 'is-online': friend.online }" aria-hidden="true"></span>
      <template v-if="nearby">{{ friend.online ? 'Online now, somewhere near you' : `Last seen around here ${friend.lastSeen}` }}</template>
      <template v-else>{{ friend.online ? 'Online now, out for a walk' : `Last seen ${friend.lastSeen}` }}</template>
    </p>
    <p v-if="house" class="friend-card__blurb">{{ house.blurb }}</p>
    <div v-if="nearby" class="friend-card__actions">
      <button type="button" class="btn btn-primary friend-card__talk" :disabled="requested" @click="emit('add', friend)">
        {{ requested ? 'Requested' : 'Add friend' }}
      </button>
      <button type="button" class="btn btn-secondary friend-card__visit" @click="emit('profile', friend)">View profile</button>
    </div>
    <template v-else>
      <div class="friend-card__actions">
        <button type="button" class="btn btn-primary friend-card__talk" @click="emit('talk', friend)">Say hi</button>
        <button v-if="house" type="button" class="btn btn-secondary friend-card__visit" @click="emit('visit', house)">
          Visit {{ first }}'s house
        </button>
      </div>
      <button
        type="button"
        class="btn btn-link btn-sm friend-card__remove"
        @click="confirmingRemove ? emit('remove', friend) : (confirmingRemove = true)"
      >
        {{ confirmingRemove ? `Yes, remove ${first}` : 'Remove friend' }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.friend-card {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 18px;
  z-index: 20;
  padding: 16px 18px 18px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-modal, 22px);
  background: var(--rl-surface);
  box-shadow: 0 14px 36px rgba(63, 46, 36, 0.25);
  outline: none;
}

/* on a laptop the card stays card-sized, in the middle at the bottom */
@media (min-width: 768px) {
  .friend-card {
    left: 50%;
    right: auto;
    width: 420px;
    margin-left: -210px;
    bottom: 28px;
  }
}

.friend-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.friend-card__tab {
  padding: 4px 10px;
  border-radius: 999px;
  background: #d9762b;
  color: var(--rl-surface);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.friend-card__tab.is-nearby {
  background: #2f6fa8;
}

.friend-card__remove {
  display: block;
  margin: 8px auto 0;
}

.friend-card__close {
  flex: none;
}

.friend-card__close svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
}

.friend-card__title {
  margin: 6px 0 4px;
  font-family: var(--rl-font-title);
  font-size: 22px;
  font-weight: 700;
  color: var(--rl-text);
}

.friend-card__presence {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--rl-muted);
}

.friend-card__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--rl-line);
}

.friend-card__dot.is-online {
  background: #3fae5a;
}

.friend-card__blurb {
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 1.45;
  color: var(--rl-muted);
}

.friend-card__actions {
  display: flex;
  gap: 8px;
}

.friend-card__talk,
.friend-card__visit {
  flex: 1;
}
</style>
