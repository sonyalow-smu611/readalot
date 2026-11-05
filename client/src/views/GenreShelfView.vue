<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Full genre shelf (/discover/:genre): about 24 books from one Google Books search, standing in
// bookcases (the library's wooden bookcase in that genre's wood). Each bookcase holds a dozen
// books, and the bookcases sit side by side in a carousel: swipe or drag left and right, or use
// the arrows and dots. The sort chips re-order the books in the browser; nothing is fetched again.
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BookShelves from '@/buildings/library/components/BookShelves.vue'
import { categoryByKey, CATEGORIES, HALL_CASE } from '@/buildings/library/categories.js'
import EmptyState from '@/components/EmptyState.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import FoundBookPreview from '@/components/book/FoundBookPreview.vue'
import { useBookPreview } from '@/composables/useBookPreview'
import { prefersReducedMotion } from '@/lib/motion'
import { genreInfo } from '@/services/discover.js'
import { searchBooks } from '@/services/api.js'

const BOOK_COUNT = 24
// books on each bookcase of the carousel
const PER_CASE = 12

// Highest first for each. Popular = how many people rated it, Length = page count.
const SORTS = [
  { key: 'popular', label: 'Popular first', field: 'ratingsCount' },
  { key: 'length', label: 'Length', field: 'pageCount' },
  { key: 'rating', label: 'Rating', field: 'averageRating' },
]

const route = useRoute()
const { previewBook, saving, addedId, openPreview, closePreview, saveStatus, undoAdd } = useBookPreview()

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

// The bookcase in this genre's wood: the library's own for a genre it has, the hall's for any other.
const bookcase = computed(() => {
  const slug = String(route.params.genre || '').toLowerCase().replace(/-/g, ' ')
  return categoryByKey(slug) ?? CATEGORIES.find((one) => one.label.toLowerCase() === slug) ?? HALL_CASE
})

const cases = computed(() => {
  const rows = []
  for (let start = 0; start < sortedBooks.value.length; start += PER_CASE) {
    rows.push(sortedBooks.value.slice(start, start + PER_CASE))
  }
  return rows
})

// the carousel: which bookcase is showing, from how far the track has scrolled
const track = ref(null)
const current = ref(0)

function onScroll() {
  const { scrollLeft, clientWidth } = track.value
  current.value = clientWidth ? Math.round(scrollLeft / clientWidth) : 0
}

function goTo(index) {
  const last = cases.value.length - 1
  const to = Math.min(Math.max(index, 0), last)
  track.value?.scrollTo({ left: to * track.value.clientWidth, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

// a new order or genre starts at the first bookcase again
watch([sortKey, () => route.params.genre], () => {
  current.value = 0
  track.value?.scrollTo({ left: 0 })
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
        class="btn btn-chip genre__chip"
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

    <section v-else class="genre__carousel" aria-roledescription="carousel" :aria-label="`${genre.title} bookcases`">
      <div ref="track" class="genre__track" @scroll.passive="onScroll">
        <div
          v-for="(group, index) in cases"
          :key="`${sortKey}-${index}`"
          class="genre__slide"
          role="group"
          aria-roledescription="slide"
          :aria-label="`Bookcase ${index + 1} of ${cases.length}`"
        >
          <BookShelves
            :bookcase="bookcase"
            :books="group"
            mode="covers"
            :open-book="previewBook?.id ?? null"
            @select="openPreview"
          />
        </div>
      </div>

      <div v-if="cases.length > 1" class="genre__nav">
        <button type="button" class="btn btn-secondary btn-icon" aria-label="Previous bookcase" :disabled="current === 0" @click="goTo(current - 1)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <div class="genre__dots" role="group" aria-label="Bookcases">
          <button
            v-for="(group, index) in cases"
            :key="index"
            type="button"
            class="btn btn-chip btn-sm genre__dot"
            :aria-pressed="current === index"
            :aria-label="`Bookcase ${index + 1} of ${cases.length}`"
            @click="goTo(index)"
          >
            {{ index + 1 }}
          </button>
        </div>
        <button
          type="button"
          class="btn btn-secondary btn-icon"
          aria-label="Next bookcase"
          :disabled="current === cases.length - 1"
          @click="goTo(current + 1)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>
    </section>

    <FoundBookPreview
      :book="previewBook"
      :adding="saving"
      :undoable="addedId === previewBook?.id"
      @add="saveStatus('want_to_read')"
      @undo="undoAdd"
      @close="closePreview"
    />
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
  /* room below and to the right for the chips' pixel shadow, which the scroll would clip */
  padding: 0 3px 3px 0;
  margin-bottom: 17px;
  overflow-x: auto;
  scrollbar-width: none;
}

.genre__chip {
  flex-shrink: 0;
}

.genre__track {
  display: flex;
  /* the shadow and frame of each bookcase stay in view while it slides */
  padding-bottom: 8px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.genre__track::-webkit-scrollbar {
  display: none;
}

.genre__slide {
  flex: 0 0 100%;
  min-width: 0;
  padding: 0 6px 6px 0;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.genre__nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 10px;
}

.genre__nav svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.genre__dots {
  display: flex;
  gap: 8px;
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
