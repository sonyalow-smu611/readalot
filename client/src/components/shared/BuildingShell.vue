<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The frame every building's page sits in: the same header and "Back to town" everywhere, so
// no building has to build its own. Put the building's page in the default slot.
defineProps({
  title: { type: String, required: true },
  // who builds this building, shown under the title
  owner: { type: String, required: true },
  // the building's colour (the header)
  accent: { type: String, default: '#7f5539' },
  subtitle: { type: String, default: '' },
  // true for pages that fill the screen and scroll themselves (the room); false adds the
  // usual page padding and scrolling
  flush: { type: Boolean, default: false },
  // where the back button goes and what it says: the town, unless a page inside a building
  // goes back to that building instead
  back: { type: [String, Object], default: () => ({ name: 'town' }) },
  backLabel: { type: String, default: 'Back to town' },
})
</script>

<template>
  <div class="building-shell">
    <header class="building-shell__header" :style="{ background: accent }">
      <RouterLink :to="back" class="building-shell__back">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        {{ backLabel }}
      </RouterLink>
      <div class="building-shell__titles">
        <h1 class="building-shell__title">{{ title }}</h1>
        <p class="building-shell__meta">{{ subtitle ? `${subtitle} · ` : '' }}{{ owner }}</p>
      </div>
    </header>
    <div class="building-shell__body" :class="flush ? 'building-shell__body--flush' : 'container py-4'">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.building-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.building-shell__header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
  padding: 12px 14px;
  color: var(--rl-surface);
}

.building-shell__back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: none;
  min-height: 44px;
  padding: 0 14px 0 8px;
  border-radius: 999px;
  background: var(--rl-surface);
  color: var(--rl-text);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
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

.building-shell__titles {
  min-width: 0;
}

.building-shell__title {
  margin: 0;
  font-family: var(--rl-font-title);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
}

.building-shell__meta {
  margin: 2px 0 0;
  font-size: 13px;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.building-shell__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.building-shell__body--flush {
  position: relative;
  overflow: hidden;
}
</style>
