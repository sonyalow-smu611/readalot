<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A genre as a small square chip in that genre's colour (genreColour.js), starred when shared.
import { computed } from 'vue'
import { genreColour, labelColour } from './genreColour.js'

const props = defineProps({
  genre: { type: String, required: true },
  // starred: you like it too
  shared: { type: Boolean, default: false },
})

const colours = computed(() => {
  const background = genreColour(props.genre)
  return { background, color: labelColour(background) }
})
</script>

<template>
  <span class="genre-chip" :style="colours"><span v-if="shared" aria-hidden="true">★ </span>{{ genre }}<span v-if="shared" class="visually-hidden">, you both like it</span></span>
</template>

<style scoped>
.genre-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: var(--px-border);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
}
</style>
