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
      <button type="button" class="book-card__close" :aria-label="closeLabel" @click="$emit('close')">
        <span aria-hidden="true">{{ closeIcon }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  closeLabel: { type: String, default: 'Close' },
  closeIcon: { type: String, default: '✕' },
})
defineEmits(['close'])

const root = ref(null)
// the room moves focus onto the card when it opens
defineExpose({ focus: () => root.value?.focus() })
</script>

<style scoped>
/* positioned for the frame's rails and the close button, unless the page places it (no
   weight, so any position the page gives wins) */
:where(.book-card) {
  position: relative;
}

/* A walnut frame with the grain running along each side (mitred at the corners), around a
   lighter, papery brown page. Where it sits and how big is up to whoever shows it. */
.book-card {
  --frame: 12px;
  --grain-across: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.012 0.42' numOctaves='3' seed='7' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.16 0 0 0 0 0.09 0 0 0 0 0.04 2.1 0 0 0 -0.75'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
  --grain-down: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.42 0.012' numOctaves='3' seed='7' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.16 0 0 0 0 0.09 0 0 0 0 0.04 2.1 0 0 0 -0.75'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
  --paper-fibre: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.42 0 0 0 0 0.28 0 0 0 0 0.16 0 0 0 0.55 -0.12'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E");

  padding: var(--frame);
  border-radius: 6px;
  overflow: hidden;
  background:
    var(--grain-down),
    linear-gradient(90deg, #5e3b22, #7f5539 18%, #6b4428 50%, #7f5539 82%, #5e3b22);
  box-shadow:
    inset 0 0 0 1px rgba(30, 18, 10, 0.55),
    inset 0 1px 0 1px rgba(255, 228, 196, 0.18),
    0 12px 32px rgba(65, 72, 51, 0.2),
    0 18px 50px rgba(30, 18, 10, 0.35);
}

/* the top and bottom rails, grain running across */
.book-card::before,
.book-card::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: var(--frame);
  background:
    var(--grain-across),
    linear-gradient(180deg, #8a5d3c, #6b4428 60%, #5e3b22);
  pointer-events: none;
}

.book-card::before {
  top: 0;
  clip-path: polygon(0 0, 100% 0, calc(100% - var(--frame)) 100%, var(--frame) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 228, 196, 0.25);
}

.book-card::after {
  bottom: 0;
  clip-path: polygon(var(--frame) 0, calc(100% - var(--frame)) 0, 100% 100%, 0 100%);
}

.book-card__page {
  position: relative;
  height: 100%;
  border-radius: 3px;
  overflow: hidden;
  background:
    var(--paper-fibre),
    radial-gradient(ellipse at 50% 30%, rgba(255, 246, 232, 0.55), transparent 70%),
    #e3c7a7;
  box-shadow:
    inset 0 0 0 1px rgba(30, 18, 10, 0.35),
    inset 0 2px 8px rgba(30, 18, 10, 0.3);
}

.book-card__close {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #ddb892;
  border-radius: 50%;
  background: #fffdf9;
  font-size: 13px;
  line-height: 1;
  color: #7f5539;
  box-shadow: 0 1px 2px rgba(65, 72, 51, 0.2);
}

.book-card__close:focus-visible {
  outline: 2px solid #7f5539;
  outline-offset: 2px;
}

.book-card__scroll {
  height: 100%;
  padding: 24px 18px 20px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-color: rgba(127, 85, 57, 0.45) transparent;
  /* text fades out at the edges of the page rather than running under the close button */
  mask-image: linear-gradient(180deg, transparent, #000 22px, #000 calc(100% - 14px), transparent);
}
</style>
