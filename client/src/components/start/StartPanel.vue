<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The landing page's card: warm paper, a dark pixel outline and a hard shadow, like the signs
// and cards inside the buildings. Everything on the page that sits in a box uses it.
defineProps({
  // the element to draw, e.g. 'li' inside a list
  tag: { type: String, default: 'div' },
})
</script>

<template>
  <component :is="tag" class="panel">
    <slot />
  </component>
</template>

<style scoped>
.panel {
  border: 3px solid var(--s-ink);
  border-radius: 8px;
  background: var(--s-paper);
  color: var(--s-ink);
  box-shadow: 6px 6px 0 var(--s-ink);
}
</style>
