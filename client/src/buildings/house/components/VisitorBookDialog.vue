<!--
  Scaffolded with AI assistance — see AI_USAGE.md
  A book off someone else's shelf, in the same card as the reader's own books: what it is and
  which of their shelves it's on. Nothing on it changes their shelf (or the visitor's).
  A tap on the backdrop, Esc or the close button emits `close`.
-->
<template>
  <div class="book-dialog__backdrop" aria-hidden="true" @click="$emit('close')" />
  <BookCard
    ref="card"
    class="book-dialog"
    :style="{ '--book-accent': accent }"
    role="dialog"
    aria-label="Book details"
    tabindex="-1"
    close-label="Close book"
    @keydown.esc="$emit('close')"
    @close="$emit('close')"
  >
    <div class="visitor-book">
      <BookCover class="visitor-book__cover" :cover-url="book.coverUrl" :title="book.title" :seed="book.id" />
      <div>
        <p class="visitor-book__tab">On {{ owner }}'s {{ shelfName(book.status) }} shelf</p>
        <h2 class="visitor-book__title">{{ book.title }}</h2>
        <p class="visitor-book__author">{{ book.authors?.join(', ') || 'Unknown author' }}</p>
        <p v-if="book.genres?.length" class="visitor-book__genres">
          <span v-for="genre in book.genres" :key="genre" class="visitor-book__genre">{{ genre }}</span>
        </p>
      </div>
    </div>
  </BookCard>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import BookCard from '@/components/book/BookCard.vue'
import BookCover from '@/components/BookCover.vue'
import { shelfName } from '@/services/shelves.js'

defineProps({
  book: { type: Object, required: true },
  // the first name of the reader whose shelf it's on
  owner: { type: String, required: true },
  // the building's colour, for the card's tab
  accent: { type: String, default: '' },
})
defineEmits(['close'])

const card = ref(null)

onMounted(async () => {
  await nextTick()
  card.value?.focus()
})
</script>

<style scoped>
.book-dialog__backdrop {
  position: absolute;
  inset: 0;
  z-index: 44;
  background: rgba(44, 36, 30, 0.22);
}

/* the reader's own book card's width, centred, only as tall as what it shows */
.book-dialog {
  position: absolute;
  top: 50%;
  left: 10%;
  right: 10%;
  z-index: 45;
  max-width: 560px;
  max-height: 80%;
  margin-inline: auto;
  transform: translateY(-50%);
}

.book-dialog:focus {
  outline: none;
}

.visitor-book {
  display: flex;
  gap: 16px;
  padding-right: 36px;
}

.visitor-book__cover {
  flex: none;
  width: 96px;
}

.visitor-book__tab {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--book-accent, var(--rl-accent));
}

.visitor-book__title {
  margin: 0 0 4px;
  font-family: var(--rl-font-title);
  font-size: 1.3rem;
  color: var(--rl-text);
}

.visitor-book__author {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--rl-muted);
}

.visitor-book__genres {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
}

.visitor-book__genre {
  padding: 4px 10px;
  border: 1px solid var(--rl-line);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: var(--rl-text);
}
</style>
