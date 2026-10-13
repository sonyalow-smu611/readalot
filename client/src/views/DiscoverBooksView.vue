<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import DiscoverShelf from '@/components/DiscoverShelf.vue'
import EmptyState from '@/components/EmptyState.vue'
import BookPreviewModal from '@/components/BookPreviewModal.vue'
import { useBookPreview } from '@/composables/useBookPreview'
import { FILTERS, SHELVES } from '@/services/discover.js'
import { searchBooks } from '@/services/api.js'

const router = useRouter()
const { previewBook, openPreview, closePreview, saveStatus } = useBookPreview()

const activeFilter = ref('For You')
const query = ref('')

const shelves = ref(SHELVES.map((shelf) => ({ ...shelf, books: [], loading: true })))

// "For You" shows every shelf; the other chips show only the shelves filed under them.
const visibleShelves = computed(() =>
  activeFilter.value === 'For You'
    ? shelves.value
    : shelves.value.filter((shelf) => shelf.category === activeFilter.value),
)

// Fills one shelf from Google Books. A failed request leaves the shelf empty
// ("No books on this shelf yet") instead of stuck on skeletons.
async function loadShelf(shelf) {
  shelf.loading = true
  try {
    const result = await searchBooks(shelf.query)
    shelf.books = result.books || []
  } catch {
    shelf.books = []
  } finally {
    shelf.loading = false
  }
}

// All shelves load at the same time, so switching chips later needs no new requests.
onMounted(() => Promise.all(shelves.value.map(loadShelf)))

// Results get their own page, so they can be shared and the Back button returns here.
function onSearch() {
  const text = query.value.trim()
  if (!text) return
  router.push({ name: 'search', query: { q: text } })
}
</script>

<template>
  <section class="view discover">
    <form class="discover__search" role="search" @submit.prevent="onSearch">
      <span aria-hidden="true">🔍</span>
      <input
        v-model="query"
        class="discover__input"
        type="search"
        enterkeyhint="search"
        placeholder="Search books or authors"
        data-tour="discover-search"
        aria-label="Search books or authors"
      />
    </form>

    <div class="discover__chips" data-tour="discover-filters" role="group" aria-label="Filter shelves">
      <button
        v-for="filter in FILTERS"
        :key="filter"
        type="button"
        class="discover__chip"
        :class="{ 'is-active': activeFilter === filter }"
        :aria-pressed="activeFilter === filter"
        @click="activeFilter = filter"
      >
        {{ filter }}
      </button>
    </div>

    <DiscoverShelf
      v-for="(shelf, index) in visibleShelves"
      :key="shelf.key"
      :data-tour="index === 0 ? 'discover-shelf' : null"
      :title="shelf.title"
      :emoji="shelf.emoji"
      :books="shelf.books"
      :loading="shelf.loading"
      :see-all="shelf.genre ? { name: 'genre-shelf', params: { genre: shelf.genre } } : null"
      @select="openPreview"
    />

    <!-- Community shelves need the reviews and ratings feature, which is not built yet -->
    <EmptyState
      v-if="!visibleShelves.length"
      emoji="💬"
      title="Community picks are coming"
      message="Books other readers love will show up here once reviews and ratings are in."
      color="mint"
    />

    <BookPreviewModal :book="previewBook" @close="closePreview" @status="saveStatus" />
  </section>
</template>

<style scoped>
.discover {
  overflow-x: hidden;
}

.discover__search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding: 10px 14px;
  background: var(--paper);
  border: var(--outline);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sticker-sm);
}

.discover__input {
  flex: 1;
  min-width: 0;
  background: none;
  border: 0;
  outline: none;
  color: var(--ink);
}

.discover__chips {
  display: flex;
  gap: 8px;
  margin-bottom: 22px;
  overflow-x: auto;
  scrollbar-width: none;
}

.discover__chip {
  flex-shrink: 0;
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  background: var(--paper);
  border: var(--outline);
  border-radius: 999px;
  color: var(--ink);
}

.discover__chip.is-active {
  background: var(--mint);
}
</style>
