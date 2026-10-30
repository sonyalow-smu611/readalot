<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// One shelf tier: a header card naming the shelf, a scrolling row of book tiles, and the wooden
// plank they stand on, which parts it from the next tier. The genre page stacks several of these;
// My Shelf's rows (house ShelfRow) are tiers too, putting their own row and buttons in the slots.
import BookTile from './BookTile.vue'

defineProps({
  books: { type: Array, default: () => [] },
  // the header card's heading, e.g. "Shelf 1"
  label: { type: String, default: '' },
  emoji: { type: String, default: '' },
  // the heading's level, so it sits under the page's own headings
  level: { type: Number, default: 3 },
})

defineEmits(['select'])
</script>

<template>
  <section class="shelf-tier">
    <header v-if="label" class="shelf-tier__head">
      <component :is="`h${level}`" class="shelf-tier__label">
        <span v-if="emoji" aria-hidden="true">{{ emoji }}</span> {{ label }}
      </component>
      <!-- buttons at the card's right end, e.g. My Shelf's Previous / Next -->
      <slot name="actions" />
    </header>
    <!-- the books; My Shelf puts its own scrolling row here -->
    <slot>
      <div class="shelf-tier__row">
        <div v-for="book in books" :key="book.id" class="shelf-tier__item">
          <BookTile :book="book" @select="$emit('select', $event)" />
        </div>
      </div>
    </slot>
    <div class="shelf-tier__plank" aria-hidden="true"></div>
  </section>
</template>

<style scoped>
.shelf-tier {
  margin-bottom: 22px;
}

/* a pixel card, like the pixel buttons: square, a 2 px outline, a hard shadow */
.shelf-tier__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  margin: 0 3px 12px 0;
  padding: 6px 6px 6px 12px;
  border: 2px solid var(--px-outline);
  border-radius: 0;
  background: var(--px-paper);
  box-shadow: var(--px-shadow);
}

.shelf-tier__label {
  margin: 0;
  font-family: var(--rl-font-title);
  font-size: 1rem;
  font-weight: 700;
  color: var(--px-outline);
}

.shelf-tier__row {
  display: flex;
  gap: 12px;
  padding: 0 4px 10px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
}

.shelf-tier__row::-webkit-scrollbar {
  display: none;
}

/* a fixed width so the next book peeks in at the edge, showing the row scrolls */
.shelf-tier__item {
  flex: 0 0 96px;
  scroll-snap-align: start;
}

/* wide screens (the page fills the window): covers the size of My Shelf's, and the tier holds as
   many as fit, so nothing needs scrolling */
@media (min-width: 576px) {
  .shelf-tier__row {
    gap: 16px;
  }

  .shelf-tier__item {
    flex-basis: 108px;
  }
}

.shelf-tier__plank {
  height: 8px;
  background: linear-gradient(to bottom, var(--wood), var(--wood-deep));
  border: 1px solid rgba(28, 27, 25, 0.25);
  border-radius: 1px;
}
</style>
