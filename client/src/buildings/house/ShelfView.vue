<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// My Shelf: every book on the reader's shelf, opened from the bookshelf in My Room. Laid out like
// the Library: a search box, genre chips, then one row of covers per shelf (To be read, Currently
// reading, Finished reading), each scrolling sideways. A chip shows one genre in every row; the search narrows by title or
// author. A cover opens the book's card, the same as in the room.
import { computed, nextTick, onMounted, ref } from 'vue'
import BuildingShell from '@/components/shared/BuildingShell.vue'
import StateView from '@/components/StateView.vue'
import BookDialog from '@/buildings/house/components/BookDialog.vue'
import ShelfRow from '@/buildings/house/components/ShelfRow.vue'
import { SHELVES } from '@/services/shelves.js'
import { useBookshelfStore } from '@/stores/bookshelf'
import { PLACES } from '@/town/places.js'

const ALL = 'All'

const place = PLACES.find((p) => p.id === 'house')
const bookshelf = useBookshelfStore()

const query = ref('')
const genre = ref(ALL)

// the genres of the reader's own books, the most common first (ties alphabetical)
const genres = computed(() => {
  const counts = new Map()
  for (const book of bookshelf.books) {
    for (const name of new Set(book.genres ?? [])) counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  const sorted = [...counts].sort(([a, x], [b, y]) => y - x || a.localeCompare(b)).map(([name]) => name)
  return [ALL, ...sorted]
})

function matches(book) {
  if (genre.value !== ALL && !(book.genres ?? []).includes(genre.value)) return false
  const text = query.value.trim().toLowerCase()
  if (!text) return true
  return [book.title, ...(book.authors ?? [])].some((part) => part?.toLowerCase().includes(text))
}

const filtering = computed(() => genre.value !== ALL || Boolean(query.value.trim()))

const rows = computed(() =>
  SHELVES.map((shelf) => {
    const all = bookshelf.booksByStatus[shelf.status] ?? []
    const books = all.filter(matches)
    return { ...shelf, books, count: books.length }
  }),
)

// --- A book's card ------------------------------------------------------------------------
const openedBook = ref(null)
const page = ref(null)
let trigger = null

function openBook(book) {
  trigger = document.activeElement
  openedBook.value = book
}

// Back to the book's cover in the row it's on now (it may have moved shelf meanwhile), or to
// whatever opened it.
async function closeBook() {
  const { id } = openedBook.value ?? {}
  openedBook.value = null
  await nextTick()
  const shelf = rows.value.find((entry) => entry.books.some((book) => book.id === id))
  const index = shelf ? shelf.books.findIndex((book) => book.id === id) : -1
  const cover = shelf && page.value?.querySelectorAll(`[data-shelf="${shelf.status}"] .book-tile`)[index]
  ;(cover ?? (trigger?.isConnected ? trigger : null))?.focus()
}

onMounted(() => bookshelf.load())
</script>

<template>
  <div ref="page" class="shelf-page" :style="{ '--house-accent': place.accent }">
    <BuildingShell
      :title="place.name"
      subtitle="My Shelf"
      :owner="place.owner"
      :accent="place.accent"
      :back="{ name: 'house' }"
      back-label="Back to room"
    >
      <section class="my-shelf" aria-label="My Shelf">
        <form class="my-shelf__search" role="search" @submit.prevent>
          <span aria-hidden="true">🔍</span>
          <input
            v-model="query"
            class="my-shelf__input"
            type="search"
            enterkeyhint="search"
            placeholder="Search your books"
            aria-label="Search your books"
          />
        </form>

        <div class="my-shelf__chips" role="group" aria-label="Filter by genre">
          <button
            v-for="name in genres"
            :key="name"
            type="button"
            class="my-shelf__chip"
            :class="{ 'is-active': genre === name }"
            :aria-pressed="genre === name"
            @click="genre = name"
          >
            {{ name }}
          </button>
        </div>

        <StateView v-if="bookshelf.error" :error="bookshelf.error" @retry="bookshelf.load" />

        <div v-else-if="!bookshelf.loading && !bookshelf.books.length" class="my-shelf__empty">
          <strong>Add your first book</strong>
          <p>Books you save show up here, on To be read, Currently reading or Finished reading.</p>
          <div class="my-shelf__empty-links">
            <RouterLink to="/discover">Discover books</RouterLink>
            <RouterLink to="/scan">Scan a cover</RouterLink>
          </div>
        </div>

        <template v-else>
          <section
            v-for="row in rows"
            :key="row.status"
            class="my-shelf__row"
            :data-shelf="row.status"
            :aria-label="`${row.label}, ${row.count} ${row.count === 1 ? 'book' : 'books'}`">
            <ShelfRow
              :title="`${row.label} · ${row.count}`"
              :shelf="row.label"
              :emoji="row.emoji"
              :books="row.books"
              :loading="bookshelf.loading && !bookshelf.books.length"
              :empty="filtering ? 'Nothing matches.' : 'No books here yet.'"
              @select="openBook"
            />
          </section>
        </template>
      </section>
    </BuildingShell>

    <BookDialog v-if="openedBook" :book="openedBook" :accent="place.accent" @close="closeBook" @leave="openedBook = null" />
  </div>
</template>

<style scoped>
.shelf-page {
  position: relative;
  height: 100%;
  min-height: 0;
}

.my-shelf {
  overflow-x: hidden;
  color: var(--rl-text);
}

/* the town's and the cafe's look: white surface, a fine line, round corners */
.my-shelf__search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding: 11px 14px;
  border: 1px solid var(--rl-line);
  border-radius: 12px;
  background: var(--rl-surface);
  box-shadow: 0 4px 14px rgba(63, 46, 36, 0.08);
}

.my-shelf__input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: none;
  font-size: 14px;
  color: var(--rl-text);
}

.my-shelf__chips {
  display: flex;
  gap: 8px;
  margin-bottom: 22px;
  padding-bottom: 2px;
  overflow-x: auto;
  scrollbar-width: none;
}

/* the town's chips: white with a fine line; the chosen one in the house's colour */
.my-shelf__chip {
  flex-shrink: 0;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--rl-line);
  border-radius: 999px;
  background: var(--rl-surface);
  font-size: 13px;
  font-weight: 700;
  color: var(--rl-text);
}

.my-shelf__chip.is-active {
  border-color: var(--house-accent);
  background: var(--house-accent);
  color: var(--rl-surface);
}

.my-shelf__empty {
  padding: 18px;
  border: 1px solid var(--rl-line);
  border-radius: 16px;
  background: var(--rl-surface);
  text-align: center;
}

.my-shelf__empty strong {
  font-family: var(--rl-font-title);
  font-size: 17px;
}

.my-shelf__empty p {
  margin: 6px 0 12px;
  font-size: 13px;
  color: var(--rl-muted);
}

.my-shelf__empty-links {
  display: flex;
  justify-content: center;
  gap: 16px;
  font-weight: 700;
}

.my-shelf__empty-links a {
  color: var(--house-accent);
}
</style>
