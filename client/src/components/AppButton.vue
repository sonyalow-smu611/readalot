<script setup>
// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
// The older sticker button, now drawn as a pixel button (styles/pixel-buttons.css). Its colour
// variants map onto the kinds; new buttons use Bootstrap's classes and the kinds directly.
import { computed } from 'vue'

const KINDS = {
  tangerine: 'btn-primary',
  ink: 'btn-primary',
  'hot-pink': 'btn-accent',
  butter: 'btn-accent',
  lilac: 'btn-secondary',
  mint: 'btn-secondary',
  cream: 'btn-secondary',
}

const props = defineProps({
  variant: {
    type: String,
    default: 'tangerine',
    validator: (value) => ['tangerine', 'lilac', 'mint', 'butter', 'hot-pink', 'cream', 'ink'].includes(value),
  },
  type: { type: String, default: 'button' },
  block: { type: Boolean, default: false },
})

const kind = computed(() => KINDS[props.variant])
</script>

<template>
  <button :type="type" class="btn" :class="[kind, { 'w-100': block }]">
    <slot />
  </button>
</template>
