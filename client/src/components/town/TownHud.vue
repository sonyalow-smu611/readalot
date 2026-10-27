<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The bar across the top of the town: who you are (opens the salon), Scan a book, and Places.
defineProps({
  name: { type: String, default: 'You' },
  avatar: { type: String, default: '' },
  placesOpen: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle-places'])
</script>

<template>
  <header class="town-hud">
    <RouterLink :to="{ name: 'salon' }" class="town-hud__chip" aria-label="Your profile">
      <span class="town-hud__avatar" aria-hidden="true">{{ avatar }}</span>
      <span class="town-hud__name">{{ name }}</span>
    </RouterLink>
    <span class="town-hud__spacer"></span>
    <RouterLink :to="{ name: 'scan-book' }" class="town-hud__chip town-hud__chip--button" aria-label="Scan a book">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" /></svg>
      Scan
    </RouterLink>
    <button
      type="button"
      class="town-hud__chip town-hud__chip--button"
      :aria-expanded="placesOpen"
      aria-controls="town-places"
      @click="emit('toggle-places')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" /></svg>
      Places
    </button>
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

.town-hud__chip--button {
  padding: 0 14px;
}

.town-hud__chip svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linejoin: round;
}

.town-hud__avatar {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 3px solid #2f5fb3;
  border-radius: 50%;
  background: var(--rl-secondary);
  font-size: 16px;
}

.town-hud__name {
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
