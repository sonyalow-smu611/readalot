<!--
  Scaffolded with AI assistance — see AI_USAGE.md
  The book preview for a book the reader has found (in the library, the scanner, search and the
  genre pages) rather than one already on their shelf: two simple choices instead of the three
  reading statuses. "Add to To be read" puts it on the To be read shelf in My Room; once it is on
  a shelf, that shelf is named instead. "Where to get" lists shops and the library. Reviews wait
  behind their own button, so the choices come first.

  The page owns the book and saving it: this emits `add` when Add to To be read is tapped and
  `close` to put the preview away. My Shelf keeps the full preview with the statuses.
-->
<template>
  <BookPreviewModal :book="book" :statuses="false" collapse-reviews @close="$emit('close')">
    <div v-if="book" class="found">
      <p v-if="shelf" class="found__on" role="status">
        <span aria-hidden="true">✓</span> On your {{ shelf }} shelf
        <RouterLink class="found__see" :to="{ name: 'my-shelf' }">See it in My Room</RouterLink>
      </p>
      <button v-else type="button" class="btn btn-success found__add" :disabled="adding" @click="$emit('add')">
        {{ adding ? 'Adding…' : 'Add to To be read' }}
      </button>
      <WhereToGet :book="book" />
    </div>
  </BookPreviewModal>
</template>

<script setup>
import { computed } from 'vue'
import BookPreviewModal from '@/components/BookPreviewModal.vue'
import WhereToGet from '@/components/book/WhereToGet.vue'
import { shelfName } from '@/services/shelves.js'

const props = defineProps({
  // the book, with `status` when it is already on the reader's shelf; null when closed
  book: { type: Object, default: null },
  // Add to To be read is being saved
  adding: { type: Boolean, default: false },
})

defineEmits(['add', 'close'])

const shelf = computed(() => (props.book?.status ? shelfName(props.book.status) : ''))
</script>

<style scoped>
.found {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
}

.found__on {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  min-height: 44px;
  margin: 0;
  padding: 8px 12px;
  border: var(--px-border);
  background: var(--px-paper-shade);
  font-weight: 800;
}

.found__see {
  margin-left: auto;
  font-weight: 700;
  color: var(--rl-text);
}
</style>
