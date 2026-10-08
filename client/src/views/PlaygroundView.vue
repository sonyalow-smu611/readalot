<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Phase 2a: a throwaway screen for judging the book components before real pages use them.
// Twelve books sit on two shelves you can drag between. A third shelf scrolls. Loader,
// empty shelf, sticker, toast and bottom sheet are shown underneath.
import { ref } from 'vue'
import booksData from '@/data/books.json'
import { normalizeBook } from '@/lib/book.js'
import { useToast } from '@/composables/useToast'
import Bookcase from '@/components/Bookcase.vue'
import Shelf from '@/components/Shelf.vue'
import BookLoader from '@/components/BookLoader.vue'
import EmptyShelf from '@/components/EmptyShelf.vue'
import Sticker from '@/components/Sticker.vue'
import BottomSheet from '@/components/BottomSheet.vue'
import AppButton from '@/components/AppButton.vue'
import PageHeader from '@/components/PageHeader.vue'

// Mock books only: this screen never touches the reader's saved shelf.
const books = booksData.map(normalizeBook)
const { show } = useToast()

const dozen = books.slice(0, 12)
const readingShelf = ref(dozen.slice(0, 6))
const tbrShelf = ref(dozen.slice(6, 12))
const scrollShelf = ref(books.slice(12, 22))
const spareShelf = ref([])
const sheetOpen = ref(false)

// Mirrors where each book was dropped onto the local copies.
function syncShelves() {
  readingShelf.value.forEach((book) => {
    book.status = 'reading'
  })
  tbrShelf.value.forEach((book) => {
    book.status = 'want_to_read'
  })
  show('Shelves saved')
}
</script>

<template>
  <section class="view playground">
    <PageHeader
      eyebrow="Component playground"
      title="The bookcase"
      subtitle="Hover a spine, hold to peek, tap to open. Drag books between the top two shelves."
      emoji="📚"
      color="mint"
    />

    <div class="playground__stickers">
      <Sticker emoji="✨" label="New" color="butter" :tilt="-6" />
      <Sticker emoji="🔥" label="Trending" color="hot-pink" :tilt="5" />
    </div>

    <Bookcase title="Your shelves">
      <Shelf
        v-model="readingShelf"
        title="Reading"
        emoji="📖"
        mode="draggable"
        group="playground"
        @change="syncShelves"
      />
      <Shelf
        v-model="tbrShelf"
        title="To read"
        emoji="📌"
        mode="draggable"
        group="playground"
        @change="syncShelves"
      />
      <Shelf v-model="spareShelf" title="Empty (drop here)" emoji="📭" mode="draggable" group="playground" />
    </Bookcase>

    <h2 class="playground__heading">Scroll shelf</h2>
    <Shelf v-model="scrollShelf" title="More books" emoji="🔭" mode="scroll" />

    <h2 class="playground__heading">Loading</h2>
    <div class="playground__panel">
      <BookLoader :count="7" />
      <div class="playground__plank" aria-hidden="true" />
    </div>

    <h2 class="playground__heading">Empty shelf</h2>
    <div class="playground__panel">
      <EmptyShelf message="This shelf is waiting for its first book" />
      <div class="playground__plank" aria-hidden="true" />
    </div>

    <div class="playground__actions">
      <AppButton variant="lilac" @click="sheetOpen = true">Open a sheet</AppButton>
      <AppButton variant="butter" @click="show('Saved to your shelf')">Pop a toast</AppButton>
    </div>

    <BottomSheet v-model:open="sheetOpen" title="A bottom sheet">
      <p class="mb-2">Sheets slide up over the phone for filters, confirmations and quick actions.</p>
      <p class="text-ink-muted small mb-0">Tap the dimmed area or the ✕ to close it.</p>
    </BottomSheet>
  </section>
</template>

<style scoped>
.playground__stickers {
  display: flex;
  gap: 12px;
  margin: -8px 0 16px;
}

.playground__heading {
  font-size: 1.05rem;
  margin: 8px 0 10px;
}

.playground__panel {
  margin-bottom: 20px;
  padding: 12px 8px 0;
  background: var(--butter);
  border: var(--outline);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sticker);
}

.playground__plank {
  height: 14px;
  margin: 8px -8px 0;
  background: var(--tangerine);
  border: var(--outline);
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
}

.playground__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}
</style>
