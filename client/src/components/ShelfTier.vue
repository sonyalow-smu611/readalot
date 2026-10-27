<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// One shelf tier: a scrolling row of book tiles standing on a wooden plank. The genre page
// stacks several of these; another reader's full bookshelf (T25) can reuse it the same way.
import BookTile from './BookTile.vue'

defineProps({
  books: { type: Array, default: () => [] },
  // optional small heading above the row, e.g. "Shelf 1"
  label: { type: String, default: '' },
})

defineEmits(['select'])
</script>

<template>
  <section class="shelf-tier">
    <p v-if="label" class="shelf-tier__label">{{ label }}</p>
    <div class="shelf-tier__row">
      <div v-for="book in books" :key="book.id" class="shelf-tier__item">
        <BookTile :book="book" @select="$emit('select', $event)" />
      </div>
    </div>
    <div class="shelf-tier__plank" aria-hidden="true"></div>
  </section>
</template>

<style scoped>
.shelf-tier {
  margin-bottom: 22px;
}

.shelf-tier__label {
  margin: 0 0 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
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
