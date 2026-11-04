<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Book search (/search?q=...), the library's catalogue: full screen on the hall's striped wall,
// with the library's search bar, and the books found standing in a bookcase (BookShelves), face
// out by default. The query lives in the URL, so results survive a reload and the Back button
// steps through earlier searches. Reached from the library's search bar and help desk, and from
// the search icon in other pages' header.
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FoundBookPreview from '@/components/book/FoundBookPreview.vue'
import { useBookPreview } from '@/composables/useBookPreview'
import { searchBooks } from '@/services/api.js'
import { useBookshelfStore } from '@/stores/bookshelf'
import { HALL_CASE } from './categories.js'
import BookShelves from './components/BookShelves.vue'
import { iconUrl } from './hall/icons.js'

// a bookcase's worth, as an opened genre bookcase has
const RESULTS = 24
const MODES = [
  { value: 'covers', label: 'Covers' },
  { value: 'spines', label: 'Spines' },
]

const route = useRoute()
const router = useRouter()
const bookshelf = useBookshelfStore()
const { previewBook, saving, openPreview, closePreview, saveStatus } = useBookPreview()

const query = ref('')
const books = ref([])
const loading = ref(false)
const error = ref('')
const searched = ref('')
const mode = ref('covers')
const input = ref(null)

const icons = { magnifier: iconUrl('magnifier'), bell: iconUrl('bell') }

// Each search gets a number; a slow reply to an older search is ignored.
let latest = 0

async function runSearch(text) {
  const id = ++latest
  searched.value = text
  error.value = ''
  if (!text) {
    books.value = []
    return
  }

  loading.value = true
  try {
    const result = await searchBooks(text, RESULTS)
    if (id === latest) books.value = result.books || []
  } catch {
    if (id === latest) {
      books.value = []
      error.value = "Couldn't reach the book search. Check your connection and try again."
    }
  } finally {
    if (id === latest) loading.value = false
  }
}

watch(
  () => String(route.query.q || '').trim(),
  (text) => {
    query.value = text
    runSearch(text)
  },
  { immediate: true },
)

function onSubmit() {
  const text = query.value.trim()
  if (!text) return
  // the same words again: search again in place (e.g. after an error) instead of adding history
  if (text === searched.value) return runSearch(text)
  router.push({ name: 'search', query: { q: text } })
}

// back where the reader came from; opened straight from a link, back to the library
function goBack() {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'library' })
}

onMounted(() => {
  // the reader's shelf, so the preview knows which books are already on it
  if (!bookshelf.books.length && !bookshelf.loading) bookshelf.load()
  if (!searched.value) input.value?.focus()
})
</script>

<template>
  <section class="search">
    <h1 class="visually-hidden">Search books</h1>

    <header class="search__head">
      <button type="button" class="btn btn-secondary search__back" @click="goBack">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        Back
      </button>

      <form class="search__bar" role="search" @submit.prevent="onSubmit">
        <img v-if="icons.magnifier" class="search__icon" :src="icons.magnifier" alt="" />
        <input
          ref="input"
          v-model="query"
          class="search__input"
          type="search"
          enterkeyhint="search"
          placeholder="Search books or authors"
          aria-label="Search books or authors"
        />
        <button type="submit" class="btn btn-primary btn-sm search__go">Search</button>
      </form>

      <div v-if="books.length" class="search__modes" role="group" aria-label="Show the books by">
        <button
          v-for="option in MODES"
          :key="option.value"
          type="button"
          class="btn btn-chip btn-sm"
          :class="{ active: mode === option.value }"
          :aria-pressed="mode === option.value"
          @click="mode = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </header>

    <div class="search__scroll">
      <!-- nothing asked yet, nothing found, or no connection: a card from the librarian -->
      <div v-if="!loading && (error || !searched || !books.length)" class="search__card" role="status">
        <img v-if="icons.bell" class="search__card-icon" :src="icons.bell" alt="" />
        <template v-if="error">
          <h2 class="search__card-title">Search is offline</h2>
          <p>{{ error }}</p>
          <button type="button" class="btn btn-secondary" @click="runSearch(searched)">Try again</button>
        </template>
        <template v-else-if="!searched">
          <h2 class="search__card-title">Ask the librarian</h2>
          <p>Search by title or author, like “Pachinko” or “Sally Rooney”.</p>
        </template>
        <template v-else>
          <h2 class="search__card-title">No books found</h2>
          <p>Nothing matched “{{ searched }}”. Try fewer words or check the spelling.</p>
        </template>
      </div>

      <template v-else>
        <p v-if="!loading" class="search__count">{{ books.length }} {{ books.length === 1 ? 'book' : 'books' }} for “{{ searched }}”</p>
        <BookShelves
          data-tour="search-results"
          :bookcase="HALL_CASE"
          :books="books"
          :loading="loading"
          :mode="mode"
          :open-book="previewBook?.id ?? null"
          @select="openPreview"
        />
      </template>
    </div>

    <FoundBookPreview :book="previewBook" :adding="saving" @add="saveStatus('want_to_read')" @close="closePreview" />
  </section>
</template>

<style scoped>
/* the hall's wall: parchment with its faint wallpaper stripes, a crown moulding along the top */
.search {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border-top: 10px solid #6b4329;
  background:
    repeating-linear-gradient(to right, transparent 0 18px, #e3cba1 18px 24px, transparent 24px 36px),
    #efdcb8;
  color: var(--rl-text);
}

/* back on the left, the search bar in the middle, the toggle on the right; on a phone the bar
   takes its own line below */
.search__head {
  display: grid;
  grid-template-columns: 1fr minmax(0, 560px) 1fr;
  align-items: center;
  gap: 12px;
  padding: 10px 15px 8px 12px;
}

.search__back {
  justify-self: start;
  gap: 6px;
  font-size: 14px;
}

.search__back svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* the library's search bar: a pixel text box with its magnifier and a Search button */
.search__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 4px 6px 4px 12px;
  border: var(--px-border);
  background: var(--px-paper);
  box-shadow: var(--px-shadow);
}

.search__bar:focus-within {
  box-shadow: 0 0 0 3px rgba(63, 107, 120, 0.35), var(--px-shadow);
}

.search__icon {
  flex: none;
  width: 18px;
  height: auto;
  image-rendering: pixelated;
}

.search__input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: none;
  font-size: 16px;
  color: var(--rl-text);
}

.search__go {
  flex: none;
}

.search__modes {
  grid-column: 3;
  justify-self: end;
  display: flex;
  gap: 8px;
}

@media (max-width: 719.98px) {
  .search__head {
    grid-template-columns: 1fr auto;
  }

  .search__bar {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .search__modes {
    grid-column: 2;
    grid-row: 1;
  }
}

.search__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 8px 12px 28px;
}

/* how many were found, on a little cream plate like the hall's name plates */
.search__count {
  width: fit-content;
  margin: 0 auto 12px;
  padding: 4px 12px;
  border: var(--px-border);
  background: var(--px-paper);
  font-size: 14px;
  font-weight: 800;
}

/* the librarian's card: a pixel card in the middle of the wall */
.search__card {
  max-width: 420px;
  margin: 40px auto 0;
  padding: 22px 20px;
  border: var(--px-border);
  background: var(--px-paper);
  box-shadow: var(--px-shadow);
  text-align: center;
}

.search__card-icon {
  width: 40px;
  height: auto;
  margin-bottom: 10px;
  image-rendering: pixelated;
}

.search__card-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 800;
}

.search__card p {
  margin-bottom: 12px;
  color: var(--rl-muted);
}

.search__card p:last-child {
  margin-bottom: 0;
}
</style>
