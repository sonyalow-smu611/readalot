<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// My Shelf: every book on the reader's shelf, opened from the bookshelf in My Room. Headed like an
// opened Library bookcase (Back to room, the My Shelf sign, the Spines / Covers switch), then a
// search box and genre chips, then a bookcase like the Library's with three shelves (To be read, Currently
// reading, Finished reading), each scrolling sideways. A chip shows one genre on every shelf; the
// search narrows by title or author. A book slides out and opens its card, laid out like the
// library's (components/OwnBookPreview.vue). A book dragged onto another
// shelf moves there, as the card's status buttons would move it.
// Opened from someone else's room (/people/:id/room/shelf), it's their shelf instead: their books,
// to look through, with no search and nothing to add, and their books' cards without the status
// buttons.
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import BuildingShell from '@/components/shared/BuildingShell.vue'
import StateView from '@/components/StateView.vue'
import BookPreviewModal from '@/components/BookPreviewModal.vue'
import ShelfBookcase from '@/buildings/house/components/ShelfBookcase.vue'
import ShelfSign from '@/buildings/house/components/ShelfSign.vue'
import BookDialog from '@/buildings/house/components/BookDialog.vue'
import { readerRoom } from '@/buildings/house/visitors.js'
import { bookcaseColours } from '@/buildings/house/bookcase.js'
import { MY_THEME, themeOf } from '@/buildings/house/themes.js'
import { SHELVES, shelfName } from '@/services/shelves.js'
import { useBookshelfStore } from '@/stores/bookshelf'
import { PLACES } from '@/town/places.js'

const ALL = 'All'
const MODES = [
  { value: 'spines', label: 'Spines' },
  { value: 'covers', label: 'Covers' },
]

const route = useRoute()
const place = PLACES.find((p) => p.id === 'house')
const bookshelf = useBookshelfStore()

// someone else's shelf being visited (fetched); null on My Shelf
const visitingId = route.params.id ?? null
const visiting = ref(null)
const visitLoading = ref(Boolean(visitingId))
const visitError = ref('')
const books = computed(() => (visitingId ? (visiting.value?.books ?? []) : bookshelf.books))
const loading = computed(() => (visitingId ? visitLoading.value : bookshelf.loading))
const error = computed(() => (visitingId ? visitError.value : bookshelf.error))
// in the room's colours: the visited reader's theme, or My Room's
const colours = computed(() => bookcaseColours(themeOf(visiting.value?.theme ?? MY_THEME)))
// no such reader: the page says so
const missing = computed(() => visitingId && !visiting.value && !visitLoading.value && !visitError.value)

const shell = computed(() => {
  const reader = visiting.value
  if (reader) {
    return {
      title: `${reader.firstName}'s Shelf`,
      sign: `${reader.firstName}'s Shelf`,
      subtitle: 'Visiting',
      owner: reader.name,
      back: { name: 'reader-house', params: { id: reader.id }, query: route.query },
      backLabel: `Back to ${reader.firstName}'s room`,
      backShort: 'Back',
    }
  }
  if (visitingId) {
    return { title: 'Shelf', sign: 'Shelf', subtitle: 'Visiting', owner: place.owner, back: { name: 'reader-house', params: { id: visitingId }, query: route.query }, backLabel: 'Back to their room', backShort: 'Back' }
  }
  return { title: place.name, sign: 'My Shelf', subtitle: 'My Shelf', owner: place.owner, back: { name: 'house' }, backLabel: 'Back to room' }
})

async function loadVisiting() {
  visitLoading.value = true
  visitError.value = ''
  try {
    visiting.value = await readerRoom(visitingId)
  } catch (err) {
    visitError.value = err.message || "Couldn't load their shelf."
  } finally {
    visitLoading.value = false
  }
}

const query = ref('')
const genre = ref(ALL)
// the books standing as spines or face out
const mode = ref('spines')

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
    return { ...shelf, books: shown }
  }),
)

// --- A book's card ------------------------------------------------------------------------
const openedBook = ref(null)
const page = ref(null)
let trigger = null

// A book dragged onto another shelf: the same move as the card's next step. A failed save
// has put it back; the page says why, or reads the move out.
const dropError = ref('')
const dropNews = ref('')

async function dropBook({ book, status }) {
  dropError.value = ''
  dropNews.value = ''
  await bookshelf.setStatus(book.id, status)
  if (bookshelf.moveError) dropError.value = bookshelf.moveError
  else dropNews.value = `${book.title} moved to ${shelfName(status)}`
}

function openBook(book) {
  trigger = document.activeElement
  openedBook.value = book
}

// Back to the book on the shelf it's on now (it may have moved shelf meanwhile), or to whatever
// opened it.
async function closeBook() {
  const { id } = openedBook.value ?? {}
  openedBook.value = null
  await nextTick()
  const spine = id && page.value?.querySelector(`[data-book-id="${CSS.escape(id)}"]`)
  ;(spine ?? (trigger?.isConnected ? trigger : null))?.focus()
}

function retry() {
  if (visitingId) loadVisiting()
  else bookshelf.load()
}

onMounted(() => {
  if (visitingId) loadVisiting()
  else bookshelf.load()
})
</script>

<template>
  <div
    ref="page"
    class="shelf-page"
    :style="{ '--house-accent': place.accent, '--shelf-wall': colours.wall }"
  >
    <BuildingShell
      v-if="!missing"
      :title="shell.title"
      :subtitle="shell.subtitle"
      :owner="shell.owner"
      :back="shell.back"
      :back-label="shell.backLabel"
      :back-short="shell.backShort"
      flush
    >
      <div class="my-shelf__frame">
        <header class="my-shelf__head">
          <!-- the shell's Back to room button floats over this cell -->
          <span class="my-shelf__back-space" aria-hidden="true" />
          <ShelfSign class="my-shelf__sign" :text="shell.sign" :compact="Boolean(visitingId)" />
          <div class="my-shelf__modes" role="group" aria-label="Show the books by">
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

        <section class="my-shelf" :aria-label="visiting ? shell.title : 'My Shelf'">
          <form v-if="!visitingId" class="my-shelf__search" role="search" @submit.prevent>
            <svg class="my-shelf__search-icon" viewBox="0 0 9 9" shape-rendering="crispEdges" aria-hidden="true">
              <path fill="#1e1a24" d="M1 0h4v1h-4zM0 1h1v4h-1zM5 1h1v4h-1zM1 5h4v1h-4zM5 5h2v2h-2zM7 7h2v2h-2z" />
              <path fill="#7fb6d9" d="M1 1h4v4h-4z" />
              <path fill="#fdf7ec" d="M2 2h1v1h-1z" />
            </svg>
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

          <StateView v-if="error" :error="error" @retry="retry" />

          <div v-else-if="visiting && !books.length" class="my-shelf__empty">
            <strong>No books yet</strong>
            <p>{{ visiting.firstName }} hasn't put any books on their shelf yet.</p>
          </div>

          <div v-else-if="!loading && !books.length" class="my-shelf__empty">
            <strong>Add your first book</strong>
            <p>Books you save show up here, on To be read, Currently reading or Finished reading.</p>
            <div class="my-shelf__empty-links">
              <RouterLink class="btn btn-secondary btn-sm" to="/discover">Discover books</RouterLink>
              <RouterLink class="btn btn-secondary btn-sm" to="/scan">Scan a cover</RouterLink>
            </div>
          </div>

          <template v-else>
            <p v-if="dropError" class="my-shelf__drop-error" role="alert">{{ dropError }}</p>
            <p class="visually-hidden" role="status">{{ dropNews }}</p>
            <ShelfBookcase
              :shelves="rows"
              :mode="mode"
              :wood="colours.wood"
              :loading="loading && !books.length"
              :empty="filtering ? 'Nothing matches.' : 'No books here yet.'"
              :open-book="openedBook?.id ?? null"
              :draggable="!visitingId"
              @select="openBook"
              @move="dropBook"
            />
          </template>
        </section>
      </div>
    </BuildingShell>

    <BuildingShell v-else title="Shelf not found" :owner="place.owner" :back="{ name: 'cafe' }" back-label="Back to the Cafe">
      <div class="my-shelf__empty">
        <p>We couldn't find that reader.</p>
        <div class="my-shelf__empty-links"><RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'cafe' }">Find readers in the Cafe</RouterLink></div>
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
      <BookDialog v-else :book="openedBook" @close="closeBook" />
    </template>
  </div>
</template>

<style scoped>
/* a book dragged to another shelf that couldn't be saved: a small pixel note above the bookcase */
.my-shelf__drop-error {
  margin-bottom: 10px;
  padding: 8px 12px;
  border: 2px solid #1e1a24;
  background: #fff4f2;
  box-shadow: 3px 3px 0 #1e1a24;
  font-size: 13px;
  color: #a23d3d;
}

.shelf-page {
  position: relative;
  isolation: isolate;
  background: var(--shelf-wall);
  height: 100%;
  min-height: 0;
}

/* the My Shelf sign's book, faintly tiled behind the whole shelf like the Library's open cases */
.shelf-page::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10' shape-rendering='crispEdges'%3E%3Crect x='1' y='1' width='8' height='8' fill='%23b5472f'/%3E%3Crect x='1' y='1' width='2' height='8' fill='%237a1a20'/%3E%3Crect x='4' y='3' width='4' height='1' fill='%23fff4c7'/%3E%3Crect x='4' y='5' width='3' height='1' fill='%23fff4c7'/%3E%3C/svg%3E");
  background-repeat: space;
  background-size: 36px 36px;
  opacity: 0.12;
  image-rendering: pixelated;
  pointer-events: none;
}

/* the header above, and the search, chips and bookcase scrolling under it */
.my-shelf__frame {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* back on the left, the switch on the right, the sign in the middle; on a phone the sign drops
   to its own line below (the Library's opened bookcase) */
.my-shelf__head {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 10px 15px 8px 12px;
}

.my-shelf__back-space {
  min-height: 38px;
}

.my-shelf__modes {
  justify-self: end;
  display: flex;
  gap: 8px;
}

@media (max-width: 575.98px) {
  /* the sign's row starts where the Daily button does and is as tall, so the two line up */
  .my-shelf__head {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto 46px;
    gap: 8px 12px;
    padding-bottom: 14px;
  }

  .my-shelf__sign {
    grid-column: 1 / -1;
    grid-row: 2;
    justify-self: center;
    /* centred, and clear of the Daily button on its left */
    max-width: calc(100% - 164px);
  }
}

.my-shelf {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 8px 12px 28px;
  color: var(--rl-text);
}

/* the search, chips and bookcase in one column, the bookcase's width */
.my-shelf > * {
  max-width: 680px;
  margin-left: auto;
  margin-right: auto;
}

/* the town's and the cafe's look: white surface, a fine line, round corners */
.my-shelf__search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  min-height: 42px;
  padding: 4px 12px;
  border: var(--px-border);
  background: var(--px-paper);
  box-shadow: var(--px-shadow);
}

.my-shelf__search:focus-within {
  box-shadow: 0 0 0 3px rgba(63, 107, 120, 0.35), var(--px-shadow);
}

.my-shelf__search-icon {
  flex: none;
  width: 18px;
  height: 18px;
}

.my-shelf__input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: none;
  font-size: 16px;
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
  gap: var(--rl-btn-gap);
  font-weight: 700;
}

</style>
