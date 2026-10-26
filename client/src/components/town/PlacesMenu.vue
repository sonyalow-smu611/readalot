<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A plain list of the buildings: the way to get anywhere without dragging the map, and the
// way in for keyboard and screen reader users (the map itself is a canvas).
defineProps({
  places: { type: Array, required: true },
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['go'])
</script>

<template>
  <nav v-if="open" id="town-places" class="places-menu" aria-label="Places in town">
    <button v-for="place in places" :key="place.id" type="button" class="places-menu__place" @click="emit('go', place.id)">
      <span class="places-menu__name">{{ place.name }}</span>
      <span class="places-menu__tab">{{ place.tab }}</span>
    </button>
  </nav>
</template>

<style scoped>
.places-menu {
  position: absolute;
  top: 68px;
  right: 14px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: min(260px, calc(100% - 28px));
  max-height: calc(100% - 150px);
  overflow-y: auto;
  padding: 8px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card, 16px);
  background: var(--rl-surface);
  box-shadow: 0 10px 28px rgba(63, 46, 36, 0.2);
}

.places-menu__place {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  padding: 0 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--rl-text);
  text-align: left;
}

.places-menu__place:hover,
.places-menu__place:focus-visible {
  background: var(--rl-canvas);
}

.places-menu__name {
  font-weight: 700;
  font-size: 15px;
}

.places-menu__tab {
  font-size: 13px;
  color: var(--rl-muted);
}
</style>
