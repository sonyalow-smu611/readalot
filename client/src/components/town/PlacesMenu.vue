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
  <nav v-if="open" id="town-places" class="places-menu px-sign-box" aria-label="Places in town">
    <button
      v-for="place in places"
      :key="place.id"
      type="button"
      class="places-menu__place"
      :style="{ '--accent': place.accent }"
      @click="emit('go', place.id)"
    >
      <span class="places-menu__name">{{ place.name }}</span>
      <span class="places-menu__tab">{{ place.tab }}</span>
    </button>
  </nav>
</template>

<style scoped>
.places-menu {
  position: absolute;
  top: 74px;
  right: 17px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: min(270px, calc(100% - 34px));
  max-height: calc(100% - 156px);
  overflow-y: auto;
  padding: 10px;
}

/* each place: a little sign in its building's colour */
.places-menu__place {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  padding: 0 12px;
  padding-left: 20px;
  border: 0;
  border-radius: 0;
  background: transparent;
  /* the bar down its left side, in the building's colour */
  box-shadow: inset 8px 0 0 var(--accent, var(--sign-outline));
  color: var(--rl-text);
  text-align: left;
}

.places-menu__place:hover,
.places-menu__place:focus-visible {
  background: color-mix(in srgb, var(--accent, #2b2133) 16%, transparent);
  outline: none;
}

.places-menu__place:focus-visible {
  box-shadow:
    inset 8px 0 0 var(--accent, var(--sign-outline)),
    inset 0 0 0 2px var(--sign-outline);
}

.places-menu__name {
  font-family: var(--sign-font);
  font-size: 15px;
  font-weight: 700;
}

.places-menu__tab {
  padding: 2px 6px;
  background: var(--accent, var(--sign-outline));
  font-family: var(--sign-font);
  font-size: 11px;
  color: #fff6dc;
}
</style>
