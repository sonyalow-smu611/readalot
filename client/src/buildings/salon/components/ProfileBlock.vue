<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// One titled section of the salon's profile (genres, coins, about you…): a widget card like
// the style studio's, labelled by its title.
import { useId } from 'vue'

defineProps({
  title: { type: String, required: true },
})

const titleId = useId()
</script>

<template>
  <section class="block" :aria-labelledby="titleId">
    <h2 :id="titleId" class="block__title">{{ title }}</h2>
    <slot />
  </section>
</template>

<style scoped>
.block {
  margin-top: 14px;
  padding: 16px;
  border: 2px solid rgba(30, 26, 36, 0.85);
  border-radius: 18px;
  background: rgba(255, 253, 249, 0.94);
  box-shadow: 5px 5px 0 rgba(30, 26, 36, 0.22);
  backdrop-filter: blur(8px);
}

.block__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 1.125rem;
}

/* a little pink star before each title */
.block__title::before {
  content: '';
  width: 12px;
  height: 12px;
  background: #e98aa8;
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
}

.block :deep(.block__empty) {
  color: var(--rl-muted);
  font-size: 0.875rem;
}
</style>
