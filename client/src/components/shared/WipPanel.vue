<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// "Work in progress" for a part of a building nobody has built yet: who is building it, and
// what will go there.
defineProps({
  owner: { type: String, required: true },
  // what will go here, one short line each
  items: { type: Array, default: () => [] },
})
</script>

<template>
  <section class="wip-panel" aria-label="Work in progress">
    <h2 class="wip-panel__title">Work in progress</h2>
    <p class="wip-panel__owner">Being built by <strong>{{ owner }}</strong></p>
    <ul v-if="items.length" class="wip-panel__items">
      <li v-for="item in items" :key="item">{{ item }}</li>
    </ul>
  </section>
</template>

<style scoped>
.wip-panel {
  padding: 20px;
  border: 2px dashed var(--rl-line);
  border-radius: var(--rl-radius-card, 16px);
  background: var(--rl-surface);
  text-align: center;
}

.wip-panel__title {
  margin: 0 0 4px;
  font-family: var(--rl-font-title);
  font-size: 22px;
  color: var(--rl-text);
}

.wip-panel__owner {
  margin: 0;
  color: var(--rl-muted);
}

.wip-panel__items {
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  text-align: left;
}

.wip-panel__items li {
  padding: 10px 12px;
  margin-top: 8px;
  border-radius: 10px;
  background: var(--rl-canvas);
  color: var(--rl-text);
}
</style>
