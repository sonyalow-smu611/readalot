<!--
  Scaffolded with AI assistance — see AI_USAGE.md
  The card for a book on the reader's own shelf, laid out like the library's book preview
  (book/FoundBookPreview.vue): no shelf line above the title, and the reviews behind their own
  button, so the choices come first. Instead of the three reading statuses it offers one next step
  (Start reading, then Mark as finished; nothing once it's finished), the progress slider while the
  book is being read, Where to get while it's still to be read, and Remove from shelf. My Shelf
  opens it.

  The page owns the book and saving it: this emits `status`, `progress` and `remove` for the page
  to act on, and `close` to put the card away.
-->
<template>
  <BookPreviewModal
    :book="book"
    label="Book details"
    close-label="Close book"
    :statuses="false"
    collapse-reviews
    @close="$emit('close')"
  >
    <button
      v-if="next"
      type="button"
      class="btn btn-success own__next"
      :disabled="moving"
      @click="$emit('status', next.status)"
    >
      {{ moving ? 'Moving…' : next.label }}
    </button>
    <!-- a book not started yet may still need finding, as in the library -->
    <WhereToGet v-if="book.status === 'want_to_read'" class="own__where" :book="book" />
    <ReadingProgress
      v-if="book.status === 'reading'"
      class="own__progress"
      :progress="book.progress"
      @change="$emit('progress', $event)"
    />
    <p v-if="error" class="own__error" role="alert">{{ error }}</p>
    <button type="button" class="btn btn-danger btn-sm own__remove" @click="$emit('remove', book)">
      Remove from shelf
    </button>
  </BookPreviewModal>
</template>

<script setup>
import { computed } from 'vue'
import BookPreviewModal from '@/components/BookPreviewModal.vue'
import ReadingProgress from '@/components/book/ReadingProgress.vue'
import WhereToGet from '@/components/book/WhereToGet.vue'

const props = defineProps({
  // the book as it is on the shelf, with its `status` and `progress`
  book: { type: Object, required: true },
  // why the last move didn't save
  error: { type: String, default: '' },
  // a move to the next shelf is being saved
  moving: { type: Boolean, default: false },
})

// status: the shelf to move it to; progress: the new percent; remove: Remove from shelf was tapped
defineEmits(['close', 'status', 'progress', 'remove'])

// the shelf after the one it's on; a finished book has none
const NEXT = {
  want_to_read: { status: 'reading', label: 'Start reading' },
  reading: { status: 'read', label: 'Mark as finished' },
}
const next = computed(() => NEXT[props.book.status] ?? null)
</script>

<style scoped>
.own__next {
  width: 100%;
  margin-top: 18px;
}

.own__where {
  margin-top: 10px;
}

.own__progress {
  margin-top: 12px;
}

.own__error {
  margin: 8px 0 0;
  font-size: 13px;
  color: #a23d3d;
}

.own__remove {
  margin-top: 12px;
}
</style>
