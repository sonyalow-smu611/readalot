<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The bar across the top of the town: the notifications bell, Places, and Friends with how many of
// them are online.
// (Your badge sits in the bottom-left corner: PlayerBadge, placed by TownView.)
import FriendsButton from './FriendsButton.vue'
import NotificationsButton from './NotificationsButton.vue'

defineProps({
  placesOpen: { type: Boolean, default: false },
  friendsOnline: { type: Number, default: 0 },
  friendRequests: { type: Number, default: 0 },
  friendsOpen: { type: Boolean, default: false },
  unread: { type: Number, default: 0 },
  notificationsOpen: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle-places', 'toggle-friends', 'toggle-notifications'])
</script>

<template>
  <header class="town-hud">
    <span class="town-hud__spacer"></span>
    <NotificationsButton data-tour="town-bell" :unread="unread" :open="notificationsOpen" @toggle="emit('toggle-notifications')" />
    <button
      type="button"
      class="btn btn-secondary px-sign town-hud__places"
      data-tour="town-places"
      :aria-expanded="placesOpen"
      aria-controls="town-places"
      @click="emit('toggle-places')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" /></svg>
      Places
    </button>
    <FriendsButton data-tour="town-friends" :online="friendsOnline" :requests="friendRequests" :open="friendsOpen" @toggle="emit('toggle-friends')" />
  </header>
</template>

<style scoped>
.town-hud {
  position: absolute;
  top: 14px;
  left: 17px;
  right: 17px;
  z-index: 10;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  pointer-events: none;
}

.town-hud__spacer {
  flex: 1;
}

/* closer together on a phone, leaving room for the weather chip on the left */
@media (max-width: 600px) {
  .town-hud {
    gap: 8px;
  }
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
  gap: 6px;
  --bs-btn-padding-x: 10px;
  font-size: 13px;
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
