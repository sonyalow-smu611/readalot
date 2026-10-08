<script setup>
// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { ref } from 'vue'
import { usePressable } from '@/composables/usePressable'

defineProps({
  variant: {
    type: String,
    default: 'tangerine',
    validator: (value) => ['tangerine', 'lilac', 'mint', 'butter', 'hot-pink', 'cream', 'ink'].includes(value),
  },
  type: { type: String, default: 'button' },
  block: { type: Boolean, default: false },
})

const button = ref(null)
usePressable(button)
</script>

<template>
  <button
    ref="button"
    :type="type"
    class="app-button"
    :class="[`app-button--${variant}`, { 'w-100': block }]"
  >
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  --button-bg: var(--tangerine);
  --button-fg: var(--ink);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 48px;
  padding: 0.6rem 1.4rem;
  font-family: var(--font-heading);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--button-fg);
  background: var(--button-bg);
  border: var(--outline);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sticker);
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  transition: box-shadow 0.15s ease;
}

/* The shadow tucks in while pressed so the squish reads as "pushed into the page" */
.app-button:active:not(:disabled) {
  box-shadow: var(--shadow-sticker-sm);
}

.app-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.app-button--lilac { --button-bg: var(--lilac); }
.app-button--mint { --button-bg: var(--mint); }
.app-button--butter { --button-bg: var(--butter); }
.app-button--hot-pink { --button-bg: var(--hot-pink); }
.app-button--cream { --button-bg: var(--cream); }
.app-button--ink { --button-bg: var(--ink); --button-fg: var(--cream); }
</style>
