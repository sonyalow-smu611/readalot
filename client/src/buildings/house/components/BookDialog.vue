<!--
  Scaffolded with AI assistance — see AI_USAGE.md
  A book on the reader's own shelf, open over the page: the room and My Shelf both open books in
  it. Shows OwnBookPreview (the card laid out like the library's) and saves what is done in it:
  the next step, the progress, and Remove from shelf (asking first unless told not to, with Undo
  either way).
  The card's close button, a tap on the backdrop or Esc puts it away; `close` says whether the
  book was removed, so the room can fade the book that flew out instead of putting it back.
-->
<template>
  <OwnBookPreview
    :book="shown"
    :error="moveError"
    :moving="moving"
    @close="$emit('close', { removed: false })"
    @status="moveBook"
    @progress="bookshelf.setProgress(shown.id, $event)"
    @remove="askRemove"
  />
  <RemoveBookModal v-if="removing" :book="removing" @close="removing = null" @remove="confirmRemove" />
</template>

<script setup>
import { computed, ref } from 'vue'
import OwnBookPreview from '@/buildings/house/components/OwnBookPreview.vue'
import RemoveBookModal from '@/components/modals/RemoveBookModal.vue'
import { useRemoveBook } from '@/buildings/house/useRemoveBook'
import { useBookshelfStore } from '@/stores/bookshelf'

const props = defineProps({
  book: { type: Object, required: true },
})
// close: { removed }
const emit = defineEmits(['close'])

const bookshelf = useBookshelfStore()
// the shelf's own copy of the book, so a move or a new percent shows in the card at once
const shown = computed(() => bookshelf.findBook(props.book.id) ?? props.book)
const moving = ref(false)
const moveError = ref('')

async function moveBook(status) {
  moving.value = true
  await bookshelf.setStatus(shown.value.id, status)
  moving.value = false
  moveError.value = bookshelf.moveError
}

const { removing, askRemove, confirmRemove } = useRemoveBook(() => emit('close', { removed: true }))
</script>
