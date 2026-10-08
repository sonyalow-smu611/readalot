<script setup>
// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { computed } from 'vue'

const props = defineProps({
  color: {
    type: String,
    default: 'paper',
    validator: (value) => ['paper', 'cream', 'lilac', 'tangerine', 'mint', 'butter', 'hot-pink'].includes(value),
  },
  // Slight 2D tilt in degrees for a hand-placed sticker look.
  tilt: { type: Number, default: 0 },
  tag: { type: String, default: 'div' },
})

// Exposed as CSS variables so GSAP's clearProps never wipes the tilt or colour.
const cardStyle = computed(() => ({
  '--card-bg': `var(--${props.color})`,
  '--card-tilt': `${props.tilt}deg`,
}))
</script>

<template>
  <component :is="tag" class="sticker-card" :style="cardStyle">
    <slot />
  </component>
</template>

<style scoped>
.sticker-card {
  padding: 16px;
  background: var(--card-bg);
  border: var(--outline);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sticker);
  transform: rotate(var(--card-tilt));
}
</style>
