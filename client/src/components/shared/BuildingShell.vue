<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The frame every building's page sits in: the same back button everywhere, so no building has
// to build its own. Put the building's page in the default slot. There is no bar: the page's
// own background runs to the top of the screen.
defineProps({
  title: { type: String, required: true },
  // who builds this building, read out with the title
  owner: { type: String, required: true },
  subtitle: { type: String, default: '' },
  // true for pages that fill the screen and scroll themselves (the room): the back button floats
  // over them, and anything of theirs in the top left starts --building-back-space lower.
  // false adds the usual page padding and scrolling, with the button at the top of the page
  flush: { type: Boolean, default: false },
  // where the back button goes and what it says: the town, unless a page inside a building
  // goes back to that building instead
  back: { type: [String, Object], default: () => ({ name: 'town' }) },
  backLabel: { type: String, default: 'Back to town' },
})
</script>

<template>
  <div class="building-shell" :class="{ 'building-shell--flush': flush }">
    <div class="visually-hidden">
      <h1>{{ title }}</h1>
      <p>{{ subtitle ? `${subtitle} · ` : '' }}{{ owner }}</p>
    </div>
    <RouterLink :to="back" class="btn btn-secondary building-shell__back">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
      {{ backLabel }}
    </RouterLink>
    <div :class="flush ? 'building-shell__page' : 'container py-3'">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.building-shell {
  position: relative;
  height: 100%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.building-shell--flush {
  --building-back-space: 58px;
  overflow: hidden;
}

.building-shell__back {
  margin: 10px 0 0 12px;
  font-size: 14px;
}

/* above the page's own controls, below its dialogs (40 and up) */
.building-shell--flush .building-shell__back {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 35;
}

.building-shell__back svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.building-shell__page {
  height: 100%;
}
</style>
