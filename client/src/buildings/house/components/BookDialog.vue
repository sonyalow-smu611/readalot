<!--
  A book's details over the page, in the town's card: the room and My Shelf both open books in
  it. Shows the book (its shelf, progress, synopsis, rating, reviews), a link to the book's own
  page, and Remove from shelf (asking first unless told not to, with Undo either way).
  A tap on the backdrop, Esc or the close button puts it away; `close` says whether the book was
  removed, so the room can fade the book that flew out instead of putting it back.
-->
<template>
  <div class="book-dialog__backdrop" aria-hidden="true" @click="$emit('close', { removed: false })" />
  <BookCard
    ref="card"
    class="book-dialog"
    :style="{ '--book-accent': accent }"
    role="dialog"
    aria-label="Book details"
    tabindex="-1"
    close-label="Close book"
    @keydown.esc="$emit('close', { removed: false })"
    @close="$emit('close', { removed: false })"
  >
    <BookDetailsContent :book="book" @leave="$emit('leave')" />
    <div class="book-dialog__links">
      <RouterLink :to="`/books/${book.id}`">Open book page</RouterLink>
      <button type="button" class="btn btn-danger btn-sm" @click="askRemove(book)">Remove from shelf</button>
    </div>
  </BookCard>
  <RemoveBookModal v-if="removing" :book="removing" @close="removing = null" @remove="confirmRemove" />
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import BookCard from '@/components/book/BookCard.vue'
import BookDetailsContent from '@/components/book/BookDetailsContent.vue'
import RemoveBookModal from '@/components/modals/RemoveBookModal.vue'
import { useRemoveBook } from '@/buildings/house/useRemoveBook'

defineProps({
  book: { type: Object, required: true },
  // the building's colour, for the card's tab, chosen shelf and main button
  accent: { type: String, default: '' },
})
// close: { removed }; leave: a link to the book's page was followed
const emit = defineEmits(['close', 'leave'])

const card = ref(null)
const { removing, askRemove, confirmRemove } = useRemoveBook(() => emit('close', { removed: true }))

onMounted(async () => {
  await nextTick()
  card.value?.focus()
})
</script>

<style scoped>
/* covers what's under the card: a tap on it puts the book away, and nothing under it can be
   reached meanwhile */
.book-dialog__backdrop {
  position: absolute;
  inset: 0;
  z-index: 44;
  background: rgba(44, 36, 30, 0.22);
}

/* the open book's card: 80% of the screen, centred, and no wider than reads well on a laptop */
.book-dialog {
  position: absolute;
  inset: 10%;
  z-index: 45;
  max-width: 720px;
  margin-inline: auto;
}

.book-dialog:focus {
  outline: none;
}

.book-dialog__links {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid var(--rl-line);
  font-size: 13px;
  font-weight: 700;
}

.book-dialog__links a {
  color: var(--book-accent, var(--rl-primary));
}
</style>
