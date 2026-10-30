<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The Friends button in the town's top bar: a two-person icon and a small card with how many
// friends are online, e.g. "2 ●". It opens the friends list (FriendsList).
import { computed } from 'vue'

const props = defineProps({
  // how many friends are online now
  online: { type: Number, default: 0 },
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle'])

const label = computed(() => `Friends, ${props.online} online`)
</script>

<template>
  <button
    type="button"
    class="btn btn-secondary friends-button"
    :aria-label="label"
    :aria-expanded="open"
    aria-controls="town-friends"
    @click="emit('toggle')"
  >
    <!-- two people, the one on the right a little behind -->
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3.6" />
      <path d="M2.4 20.5a6.6 6.6 0 0 1 13.2 0" />
      <path d="M15.4 4.6a3.4 3.4 0 0 1 0 6.6" />
      <path d="M17.6 14.4a5.6 5.6 0 0 1 4 6.1" />
    </svg>
    <span class="friends-button__count" aria-hidden="true">
      {{ online }}
      <span class="friends-button__dot" :class="{ 'is-off': !online }"></span>
    </span>
  </button>
</template>

<style scoped>
.friends-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  pointer-events: auto;
}

.friends-button svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.friends-button__count {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 34px;
  height: 28px;
  padding: 0 9px;
  border-radius: 999px;
  background: var(--rl-canvas);
  font-weight: 800;
  font-size: 14px;
}

.friends-button__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #3fae5a;
  box-shadow: 0 0 0 2px rgba(63, 174, 90, 0.25);
}

.friends-button__dot.is-off {
  background: var(--rl-muted);
  box-shadow: none;
}
</style>
