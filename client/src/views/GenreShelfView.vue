<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Full genre shelf (/discover/:genre): about 24 books from one Google Books search, stacked as
// shelf tiers. On a phone each tier holds 6 and scrolls sideways; on a wide screen (where the
// page fills the window) each tier holds as many as fit across. The sort chips re-order the
// books in the browser; nothing is fetched again.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ShelfTier from '@/components/ShelfTier.vue'
import EmptyState from '@/components/EmptyState.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import BookPreviewModal from '@/components/BookPreviewModal.vue'
import { useBookPreview } from '@/composables/useBookPreview'
import { genreInfo } from '@/services/discover.js'
import { searchBooks } from '@/services/api.js'

const BOOK_COUNT = 24
const PER_TIER = 6
// wide screens: a book's width and the gap between books in a tier (ShelfTier.vue), and the
// screen width from which the page fills the window (PhoneFrame.vue)
const WIDE_BOOK = 108
const WIDE_GAP = 16
const WIDE_FROM = 576

// Highest first for each. Popular = how many people rated it, Length = page count.
const SORTS = [
  { key: 'popular', label: 'Popular first', field: 'ratingsCount' },
  { key: 'length', label: 'Length', field: 'pageCount' },
  { key: 'rating', label: 'Rating', field: 'averageRating' },
]

const route = useRoute()
const { previewBook, openPreview, closePreview, saveStatus } = useBookPreview()

const genre = computed(() => genreInfo(route.params.genre))
const books = ref([])
const loading = ref(true)
const error = ref('')
const sortKey = ref('popular')

// Each load gets a number; a slow reply for a genre the reader already left is ignored.
let latest = 0

async function load() {
  const id = ++latest
  loading.value = true
  error.value = ''
  try {
    const result = await searchBooks(genre.value.query, BOOK_COUNT)
    if (id === latest) books.value = result.books || []
  } catch {
    if (id === latest) {
      books.value = []
      error.value = "Couldn't load this shelf. Check your connection and try again."
    }
  } finally {
    if (id === latest) loading.value = false
  }
}

// Runs on open and again when the URL moves to another genre (the page itself is reused).
watch(() => route.params.genre, load, { immediate: true })

const sortedBooks = computed(() => {
  const { field } = SORTS.find((sort) => sort.key === sortKey.value)
  // a copy, so the original Google order is kept; equal values keep that order (stable sort)
  return [...books.value].sort((a, b) => (b[field] || 0) - (a[field] || 0))
})

// how many books stand on each tier, from the page's width
const page = ref(null)
const pageWidth = ref(0)
const perTier = computed(() => {
  if (window.innerWidth < WIDE_FROM || !pageWidth.value) return PER_TIER
  // the row keeps 4 px clear at each end
  return Math.max(PER_TIER, Math.floor((pageWidth.value - 8 + WIDE_GAP) / (WIDE_BOOK + WIDE_GAP)))
})

let resize = null
onMounted(() => {
  resize = new ResizeObserver(([entry]) => {
    pageWidth.value = entry.contentRect.width
  })
  resize.observe(page.value)
})
onBeforeUnmount(() => resize?.disconnect())

const tiers = computed(() => {
  const rows = []
  for (let start = 0; start < sortedBooks.value.length; start += perTier.value) {
    rows.push(sortedBooks.value.slice(start, start + perTier.value))
  }
  return rows
})
</script>

<template>
  <section ref="page" class="view genre">
    <h2 class="genre__title">
      <span aria-hidden="true">{{ genre.emoji }}</span> {{ genre.title }}
    </h2>

    <div class="genre__sorts" role="group" aria-label="Sort books">
      <button
        v-for="sort in SORTS"
        :key="sort.key"
        type="button"
        class="genre__chip"
        :class="{ 'is-active': sortKey === sort.key }"
        :aria-pressed="sortKey === sort.key"
        :disabled="loading"
        @click="sortKey = sort.key"
      >
        {{ sort.label }}
      </button>
    </div>

    <div v-if="loading" aria-busy="true">
      <div v-for="n in 2" :key="n" class="genre__skeleton">
        <SkeletonBlock v-for="m in 3" :key="m" height="144px" radius="6px" />
      </div>
    </div>

    <EmptyState v-else-if="error" emoji="📡" title="Shelf is offline" :message="error" color="butter">
      <button type="button" class="btn btn-outline-dark btn-sm" @click="load">Try again</button>
    </EmptyState>

    <EmptyState
      v-else-if="!books.length"
      emoji="📭"
      title="This shelf is empty"
      message="No books came back for this genre. Try again later."
      color="cream"
    >
      <button type="button" class="btn btn-outline-dark btn-sm" @click="load">Try again</button>
    </EmptyState>

    <template v-else>
      <ShelfTier
        v-for="(tier, index) in tiers"
        :key="`${sortKey}-${index}`"
        :books="tier"
        :label="`Shelf ${index + 1}`"
        @select="openPreview"
      />
    </template>

    <BookPreviewModal :book="previewBook" @close="closePreview" @status="saveStatus" />
  </section>
</template>

<style scoped>
.genre__title {
  margin: 0 0 12px;
  font-family: var(--font-serif);
  font-size: 1.5rem;
  color: var(--ink);
}

.genre__sorts {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  scrollbar-width: none;
}

.genre__chip {
  flex-shrink: 0;
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  background: var(--paper);
  border: var(--outline);
  border-radius: 999px;
  color: var(--ink);
}

.genre__chip.is-active {
  background: var(--mint);
}

.genre__chip:disabled {
  opacity: 0.5;
}

.genre__skeleton {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 22px;
}

/* wide screens: placeholder covers the size of the books */
@media (min-width: 576px) {
  .genre__skeleton {
    grid-template-columns: repeat(auto-fill, 108px);
    gap: 16px;
  }
}
</style>
