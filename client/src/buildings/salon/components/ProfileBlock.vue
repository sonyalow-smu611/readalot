<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// One titled section of the salon's profile (genres, coins, about you…): a pixel panel like
// the town's signs, labelled by its title. It leans toward the mouse and pops when pressed.
import { useId } from 'vue'
import { vTilt } from '@/buildings/salon/tilt.js'

defineProps({
  title: { type: String, required: true },
})

const titleId = useId()
</script>

<template>
  <section v-tilt class="block" data-tilt :aria-labelledby="titleId">
    <h2 :id="titleId" class="block__title">{{ title }}</h2>
    <slot />
  </section>
</template>

<style scoped>
.block {
  margin-top: 14px;
  padding: 16px;
  border: 3px solid var(--px-ink, #2b1d24);
  border-radius: 4px;
  background: var(--px-paper, #fff8ef);
  box-shadow: inset 0 -4px 0 rgba(43, 29, 36, 0.08), var(--px-shadow, 5px 5px 0 #2b1d24);
}

.block__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 1.125rem;
}

/* a little pixel star before each title */
.block__title::before {
  content: '';
  width: 4px;
  height: 4px;
  margin: 4px;
  background: var(--px-pink, #d0608e);
  box-shadow:
    4px 0 0 var(--px-pink, #d0608e), -4px 0 0 var(--px-pink, #d0608e),
    0 4px 0 var(--px-pink, #d0608e), 0 -4px 0 var(--px-pink, #d0608e);
}

.block :deep(.block__empty) {
  color: var(--rl-muted);
  font-size: 0.875rem;
}
</style>
