<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// One stop on the landing page's tour: a piece of town art, the place's name and one line
// about what you do there. The art is a building sprite, or the slot when there is none.
defineProps({
  title: { type: String, required: true },
  line: { type: String, required: true },
  // the building's colour from town/places.js
  accent: { type: String, default: 'var(--rl-accent)' },
  // a building sprite (public/town/buildings/<id>.png); leave empty to fill the slot instead
  image: { type: String, default: '' },
})
</script>

<template>
  <li class="feature" :style="{ '--feature-accent': accent }">
    <div class="feature__art" aria-hidden="true">
      <img v-if="image" :src="image" alt="" />
      <slot v-else />
    </div>
    <h3 class="feature__title">{{ title }}</h3>
    <p class="feature__line">{{ line }}</p>
  </li>
</template>

<style scoped>
.feature {
  display: flex;
  flex-direction: column;
  padding: 12px 14px 14px;
  border: 1px solid var(--rl-line);
  border-top: 4px solid var(--feature-accent);
  border-radius: var(--rl-radius-card);
  background: var(--rl-surface);
  box-shadow: 0 6px 18px rgba(63, 46, 36, 0.1);
}

.feature__art {
  display: grid;
  place-items: end center;
  height: 84px;
  margin-bottom: 8px;
  color: var(--feature-accent);
}

.feature__art img {
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: contain;
  object-position: bottom;
  image-rendering: pixelated;
}

.feature__title {
  margin: 0 0 2px;
  font-family: var(--rl-font-title);
  font-size: 17px;
  font-weight: 700;
  color: var(--rl-text);
}

.feature__line {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  color: var(--rl-muted);
}
</style>
