<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// My Shelf: every book on the reader's shelf, opened from the bookshelf in My Room. Laid out like
// the Library: a search box, genre chips, then one row of covers per shelf (To be read, Currently
// reading, Finished reading), each scrolling sideways. A chip shows one genre in every row; the search narrows by title or
// author. A cover opens the genre page's book card, with the progress slider while it's being read
// and Remove from shelf.
// Opened from someone else's room (/people/:id/room/shelf), it's their shelf instead: their books,
// to look through, with no search and nothing to add, and their books' cards without the status
// buttons.
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import BuildingShell from '@/components/shared/BuildingShell.vue'
import StateView from '@/components/StateView.vue'
import BookPreviewModal from '@/components/BookPreviewModal.vue'
import ReadingProgress from '@/components/book/ReadingProgress.vue'
import RemoveBookModal from '@/components/modals/RemoveBookModal.vue'
import ShelfRow from '@/buildings/house/components/ShelfRow.vue'
import { useRemoveBook } from '@/buildings/house/useRemoveBook'
import { readerRoom } from '@/buildings/house/visitors.js'
import { SHELVES, shelfName } from '@/services/shelves.js'
import { useBookshelfStore } from '@/stores/bookshelf'
import { PLACES } from '@/town/places.js'

const ALL = 'All'

const route = useRoute()
const place = PLACES.find((p) => p.id === 'house')
const bookshelf = useBookshelfStore()

// someone else's shelf being visited; null on My Shelf
const visitingId = route.params.id ?? null
const visiting = visitingId ? readerRoom(visitingId) : null
const books = computed(() => visiting?.books ?? bookshelf.books)
const loading = computed(() => !visiting && bookshelf.loading)
const error = computed(() => (visiting ? '' : bookshelf.error))

const shell = visiting
  ? {
      title: `${visiting.firstName}'s Shelf`,
      subtitle: 'Visiting',
      owner: visiting.name,
      back: { name: 'reader-house', params: { id: visiting.id } },
      backLabel: `Back to ${visiting.firstName}'s room`,
    }
  : { title: place.name, subtitle: 'My Shelf', owner: place.owner, back: { name: 'house' }, backLabel: 'Back to room' }

const query = ref('')
const genre = ref(ALL)

// the genres of the shelf's books, the most common first (ties alphabetical)
const genres = computed(() => {
  const counts = new Map()
  for (const book of books.value) {
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
    const shown = books.value.filter((book) => book.status === shelf.status && matches(book))
    return { ...shelf, books: shown, count: shown.length }
  }),
)

// --- A book's card ------------------------------------------------------------------------
const openedBook = ref(null)
// the shelf's own copy of the open book, so a move or a new percent shows in the card at once
const shownBook = computed(() => (openedBook.value && bookshelf.findBook(openedBook.value.id)) ?? openedBook.value)
const moveError = ref('')
const page = ref(null)
let trigger = null

async function moveBook(status) {
  await bookshelf.setStatus(shownBook.value.id, status)
  moveError.value = bookshelf.moveError
}

const { removing, askRemove, confirmRemove } = useRemoveBook(() => {
  openedBook.value = null
})

function openBook(book) {
  trigger = document.activeElement
  moveError.value = ''
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

onMounted(() => {
  if (!visitingId) bookshelf.load()
})
</script>

<template>
  <div ref="page" class="shelf-page" :style="{ '--house-accent': place.accent }">
    <BuildingShell
      v-if="!visitingId || visiting"
      :title="shell.title"
      :subtitle="shell.subtitle"
      :owner="shell.owner"
      :accent="place.accent"
      :back="shell.back"
      :back-label="shell.backLabel"
    >
      <section class="my-shelf" :aria-label="visiting ? shell.title : 'My Shelf'">
        <form v-if="!visiting" class="my-shelf__search" role="search" @submit.prevent>
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
            class="btn btn-chip my-shelf__chip"
            :aria-pressed="genre === name"
            @click="genre = name"
          >
            {{ name }}
          </button>
        </div>

        <StateView v-if="error" :error="error" @retry="bookshelf.load" />

        <div v-else-if="visiting && !books.length" class="my-shelf__empty">
          <strong>No books yet</strong>
          <p>{{ visiting.firstName }} hasn't put any books on their shelf yet.</p>
        </div>

        <div v-else-if="!loading && !books.length" class="my-shelf__empty">
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
              :loading="loading && !books.length"
              :empty="filtering ? 'Nothing matches.' : 'No books here yet.'"
              @select="openBook"
            />
          </section>
        </template>
      </section>
    </BuildingShell>

    <BuildingShell v-else title="Shelf not found" :owner="place.owner" :accent="place.accent" :back="{ name: 'cafe' }" back-label="Back to the Cafe">
      <div class="my-shelf__empty">
        <p>We couldn't find that reader.</p>
        <div class="my-shelf__empty-links"><RouterLink :to="{ name: 'cafe' }">Find readers in the Cafe</RouterLink></div>
      </div>
    </BuildingShell>

    <template v-if="openedBook">
      <BookPreviewModal
        v-if="visiting"
        :book="openedBook"
        label="Book details"
        close-label="Close book"
        :tab="`On ${visiting.firstName}'s ${shelfName(openedBook.status)} shelf`"
        :statuses="false"
        :links-to-page="false"
        @close="closeBook"
      />
      <BookPreviewModal
        v-else
        :book="shownBook"
        label="Book details"
        close-label="Close book"
        :tab="shelfName(shownBook.status)"
        @close="closeBook"
        @status="moveBook"
      >
        <ReadingProgress
          v-if="shownBook.status === 'reading'"
          class="my-shelf__progress"
          :progress="shownBook.progress"
          @change="bookshelf.setProgress(shownBook.id, $event)"
        />
        <p v-if="moveError" class="my-shelf__error" role="alert">{{ moveError }}</p>
        <button type="button" class="btn btn-danger btn-sm my-shelf__remove" @click="askRemove(shownBook)">
          Remove from shelf
        </button>
      </BookPreviewModal>
    </template>
    <RemoveBookModal v-if="removing" :book="removing" @close="removing = null" @remove="confirmRemove" />
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
  margin-bottom: 21px;
  /* room below and to the right for the chips' pixel shadow, which the scroll would clip */
  padding: 0 3px 3px 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.my-shelf__chip {
  flex-shrink: 0;
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

/* My Shelf's extras in the book's card, under its status buttons */
.my-shelf__progress {
  margin-top: 12px;
}

.my-shelf__error {
  margin: 8px 0 0;
  font-size: 13px;
  color: #a23d3d;
}

.my-shelf__remove {
  margin-top: 12px;
}
</style>
