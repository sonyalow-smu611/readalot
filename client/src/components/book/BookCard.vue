<!--
  The open book's card: a wooden frame round a light brown page that scrolls, with a close
  button that stays on its corner. Used by the room's Book details and the book's own page, so
  the two look the same. Whoever shows it decides where it sits and how big it is.
  Written with AI assistance: see AI_USAGE.md.
-->
<template>
  <div ref="root" class="book-card">
    <div class="book-card__page">
      <div class="book-card__scroll">
        <slot />
      </div>
      <button type="button" class="btn btn-secondary btn-icon book-card__close" :aria-label="closeLabel" @click="$emit('close')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  closeLabel: { type: String, default: 'Close' },
})
defineEmits(['close'])

const root = ref(null)
// the room moves focus onto the card when it opens
defineExpose({ focus: () => root.value?.focus() })
</script>

<style scoped>
/* positioned for the close button, unless the page places it (no weight, so any position the
   page gives wins) */
:where(.book-card) {
  position: relative;
}

/* A pixel card (styles/pixel-surfaces.css): a white surface, square, a black outline and a hard
   shadow. Where it sits and how big is up to whoever shows it; --book-accent is the colour of
   the building it was opened in. */
.book-card {
  overflow: hidden;
  border: var(--px-border);
  border-radius: 0;
  background: var(--rl-surface);
  box-shadow: var(--px-shadow);
}

.book-card__page {
  position: relative;
  height: 100%;
}

/* the close button: an Icon pixel button in the corner */
.book-card__close {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
}

.book-card__close svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
}


.book-card__scroll {
  height: 100%;
  padding: 20px 18px 20px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-color: var(--rl-line) transparent;
}
</style>
