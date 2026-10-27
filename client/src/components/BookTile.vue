<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// One book as a tappable cover with its title and author. Used by the Discover shelves, the
// genre shelf tiers and search results. Emits `select` with the book.
import BookCover from './BookCover.vue'

defineProps({
  book: { type: Object, required: true },
})

defineEmits(['select'])
</script>

<template>
  <button type="button" class="book-tile" @click="$emit('select', book)">
    <BookCover class="book-tile__cover" :cover-url="book.coverUrl" :title="book.title" :seed="book.id" />
    <span class="book-tile__title">{{ book.title }}</span>
    <span class="book-tile__author">{{ book.authors?.join(', ') || 'Unknown author' }}</span>
  </button>
</template>

<style scoped>
.book-tile {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  text-align: left;
  background: none;
  border: 0;
  color: inherit;
}

.book-tile__cover {
  width: 100%;
  aspect-ratio: 2 / 3;
  height: auto;
  margin-bottom: 6px;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: var(--shadow-sticker-sm);
}

.book-tile__title,
.book-tile__author {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
}

.book-tile__title {
  -webkit-line-clamp: 2;
  line-clamp: 2;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.2;
}

.book-tile__author {
  -webkit-line-clamp: 1;
  line-clamp: 1;
  font-size: 0.75rem;
  color: var(--ink-muted);
}
</style>
