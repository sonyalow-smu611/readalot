<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// One bookcase opened: a sheet that rises over the hall with that category's books as covers.
// The page owns the books; this only shows them, and emits `select` when a cover is tapped,
// `close` to put the sheet away and `retry` after a failed load.
import { onMounted, ref } from 'vue'
import BookTile from '@/components/BookTile.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'

const props = defineProps({
  // a category from categories.js: key, title, emoji, genre
  category: { type: Object, required: true },
  books: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

defineEmits(['close', 'select', 'retry'])

const SKELETON_CARDS = 6
const panel = ref(null)
const headingId = `shelf-sheet-${props.category.key}`

onMounted(() => panel.value?.focus())
</script>

<template>
  <div class="shelf-sheet" @keydown.esc="$emit('close')">
    <button type="button" class="shelf-sheet__backdrop" tabindex="-1" aria-label="Close bookcase" @click="$emit('close')" />

    <section
      ref="panel"
      class="shelf-sheet__panel"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="headingId"
      tabindex="-1"
    >
      <header class="shelf-sheet__head">
        <h2 :id="headingId" class="shelf-sheet__title">
          <span aria-hidden="true">{{ category.emoji }}</span> {{ category.title }}
        </h2>
        <button type="button" class="shelf-sheet__close" aria-label="Close" @click="$emit('close')">✕</button>
      </header>

      <div class="shelf-sheet__body">
        <div v-if="loading" class="shelf-sheet__grid" aria-label="Loading books">
          <div v-for="n in SKELETON_CARDS" :key="n">
            <SkeletonBlock height="150px" radius="10px" class="mb-2" />
            <SkeletonBlock width="80%" height="10px" />
          </div>
        </div>

        <div v-else-if="error" class="shelf-sheet__state">
          <p>{{ error }}</p>
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="$emit('retry')">Retry</button>
        </div>

        <p v-else-if="!books.length" class="shelf-sheet__state">No books on this shelf yet.</p>

        <div v-else class="shelf-sheet__grid">
          <BookTile v-for="book in books" :key="book.id" :book="book" @select="$emit('select', $event)" />
        </div>
      </div>

      <RouterLink
        v-if="category.genre"
        class="shelf-sheet__all"
        :to="{ name: 'genre-shelf', params: { genre: category.genre } }"
      >
        See all {{ category.title }}
      </RouterLink>
    </section>
  </div>
</template>

<style scoped>
.shelf-sheet {
  position: absolute;
  inset: 0;
  z-index: 40;
}

.shelf-sheet__backdrop {
  position: absolute;
  inset: 0;
  padding: 0;
  border: 0;
  background: rgba(30, 26, 36, 0.4);
  cursor: pointer;
}

.shelf-sheet__panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  max-height: 78%;
  /* on a wide screen the sheet keeps its books in from the edges, like My Shelf */
  padding: 14px max(16px, calc((100% - 1240px) / 2)) 18px;
  border-top: 3px solid var(--library-accent, var(--rl-primary));
  border-radius: var(--rl-radius-modal) var(--rl-radius-modal) 0 0;
  background: var(--rl-surface);
  box-shadow: 0 -10px 30px rgba(63, 46, 36, 0.25);
  color: var(--rl-text);
  animation: sheet-rise 0.24s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.shelf-sheet__panel:focus {
  outline: none;
}

.shelf-sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.shelf-sheet__title {
  margin: 0;
  font-family: var(--rl-font-title);
  font-size: 20px;
}

.shelf-sheet__close {
  display: grid;
  place-items: center;
  flex: none;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--rl-line);
  border-radius: 50%;
  background: var(--rl-surface);
  color: var(--rl-primary);
}

.shelf-sheet__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* covers the size of My Shelf's (108 px), as many to a row as fit; on a phone, three to a row */
.shelf-sheet__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 108px));
  justify-content: space-between;
  gap: 18px 12px;
}

@media (min-width: 576px) {
  .shelf-sheet__grid {
    justify-content: start;
    gap: 22px 16px;
  }
}

.shelf-sheet__state {
  padding: 24px 0;
  text-align: center;
  color: var(--rl-muted);
}

.shelf-sheet__all {
  align-self: center;
  margin-top: 14px;
  font-weight: 700;
  color: var(--library-accent, var(--rl-primary));
}

@keyframes sheet-rise {
  from {
    transform: translateY(24px);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .shelf-sheet__panel {
    animation: none;
  }
}
</style>
