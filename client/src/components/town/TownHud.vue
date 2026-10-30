<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The bar across the top of the town: Places, and Friends with how many of them are online.
// (Your badge sits in the bottom-left corner: PlayerBadge, placed by TownView.)
import FriendsButton from './FriendsButton.vue'

defineProps({
  placesOpen: { type: Boolean, default: false },
  friendsOnline: { type: Number, default: 0 },
  friendsOpen: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle-places', 'toggle-friends'])
</script>

<template>
  <header class="town-hud">
    <span class="town-hud__spacer"></span>
    <button
      type="button"
      class="btn btn-secondary town-hud__places"
      :aria-expanded="placesOpen"
      aria-controls="town-places"
      @click="emit('toggle-places')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" /></svg>
      Places
    </button>
    <FriendsButton :online="friendsOnline" :open="friendsOpen" @toggle="emit('toggle-friends')" />
  </header>
</template>

<style scoped>
.town-hud {
  position: absolute;
  top: 14px;
  left: 14px;
  right: 14px;
  z-index: 10;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  pointer-events: none;
}

.town-hud__spacer {
  flex: 1;
}

.town-hud__chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 14px 0 6px;
  border: 1px solid var(--rl-line);
  border-radius: 999px;
  background: var(--rl-surface);
  box-shadow: 0 4px 14px rgba(63, 46, 36, 0.15);
  font-weight: 700;
  font-size: 14px;
  color: var(--rl-text);
  text-decoration: none;
  pointer-events: auto;
}

.town-hud__places {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  pointer-events: auto;
}

.town-hud__chip svg,
.town-hud__places svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linejoin: round;
}

</style>
