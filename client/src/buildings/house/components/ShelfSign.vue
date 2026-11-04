<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The gold board over a shelf, in the Library's Bestsellers colours and pixel letters, with a pixel
// book, so it can't be taken for one of the buttons beside it.
defineProps({
  text: { type: String, required: true },
  // for a reader's name, which can be long: on a phone the letters are smaller and the book goes
  compact: { type: Boolean, default: false },
})
</script>

<template>
  <h2 class="shelf-sign" :class="{ 'shelf-sign--compact': compact }">
    <svg viewBox="0 0 10 10" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="1" y="1" width="8" height="8" fill="#b5472f" />
      <rect x="1" y="1" width="2" height="8" fill="#7a1a20" />
      <rect x="4" y="3" width="4" height="1" fill="#fff4c7" />
      <rect x="4" y="5" width="3" height="1" fill="#fff4c7" />
    </svg>
    <span class="shelf-sign__text">{{ text }}</span>
  </h2>
</template>

<style scoped>
.shelf-sign {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 6px 14px;
  border: 2px solid #1e1a24;
  background: #f2c94c;
  box-shadow: 3px 3px 0 #1e1a24;
  color: #7a1a20;
  font-family: var(--sign-font);
  font-size: 24px;
  font-weight: 400;
  letter-spacing: 1px;
  line-height: 1;
  text-shadow: 2px 2px 0 #fff4c7;
  white-space: nowrap;
}

.shelf-sign svg {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

/* a name too long for the room it's given ends in "…" */
.shelf-sign__text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 575.98px) {
  .shelf-sign {
    padding: 6px 10px;
    font-size: 18px;
  }

  .shelf-sign--compact {
    font-size: 14px;
    text-shadow: 1px 1px 0 #fff4c7;
  }

  .shelf-sign--compact svg {
    display: none;
  }
}
</style>
