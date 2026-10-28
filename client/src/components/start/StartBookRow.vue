<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A row of flat pixel book spines standing on a shelf. Hovering a book slides it up and tips it
// forward, the way a book comes out when you take it off a shelf. Only for show.
defineProps({
  // [{ title, colour, w, h, mark? }]: mark is an optional ribbon ('reading') or star ('finished')
  books: { type: Array, required: true },
})
</script>

<template>
  <div class="row">
    <span
      v-for="book in books"
      :key="book.title"
      class="row__spine"
      :class="book.mark && `row__spine--${book.mark}`"
      :style="{ '--bg': book.colour, width: `${book.w}px`, height: `${book.h}px` }"
    >
      <span class="row__title">{{ book.title }}</span>
    </span>
    <slot />
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: flex-end;
  gap: 3px;
}

/* a flat cloth spine with two pixel bands and a hard pixel shadow on its right */
.row__spine {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  box-shadow: inset -4px 0 0 rgba(0, 0, 0, 0.22), inset 0 10px 0 -6px rgba(255, 253, 249, 0.35), inset 0 -10px 0 -6px rgba(255, 253, 249, 0.35);
  transform-origin: 50% 100%;
  transition: transform 0.18s steps(3, end), box-shadow 0.18s steps(3, end);
}

/* taken half off the shelf: up, tipped towards you, with a shadow behind */
.row__spine:hover {
  z-index: 1;
  transform: translateY(-22%) rotate(-5deg);
  box-shadow: inset -4px 0 0 rgba(0, 0, 0, 0.22), inset 0 10px 0 -6px rgba(255, 253, 249, 0.35), inset 0 -10px 0 -6px rgba(255, 253, 249, 0.35), 6px 6px 0 rgba(30, 26, 36, 0.35);
}

.row__title {
  /* without this the spine squeezes the sideways title to a sliver */
  flex: none;
  line-height: 1.2;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  max-height: calc(100% - 20px);
  overflow: hidden;
  color: #fffdf9;
  font-family: var(--rl-font-title);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
  pointer-events: none;
}

/* a bookmark ribbon hanging out of the top of a book being read */
.row__spine--reading::after {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  width: 6px;
  height: 18px;
  margin-left: -3px;
  background: #e8584a;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%);
}

/* a little gold star on a finished book */
.row__spine--finished::after {
  content: '';
  position: absolute;
  bottom: 12px;
  left: 50%;
  width: 10px;
  height: 10px;
  margin-left: -5px;
  background: #f2c94c;
  clip-path: polygon(50% 0, 63% 35%, 100% 38%, 70% 60%, 80% 100%, 50% 78%, 20% 100%, 30% 60%, 0 38%, 37% 35%);
}

@media (prefers-reduced-motion: reduce) {
  .row__spine {
    transition: none;
  }
}
</style>
