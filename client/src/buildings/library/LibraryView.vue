<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Library → Discover. Owner: Aasim. Everything inside this folder is yours to change.
// A pixel-art library hall with one bookcase per category (categories.js). Tapping a bookcase
// opens its books; the help desk and the search bar find any book; the book scanner reads a
// book's cover. /library?scan=1 (where the old /scan address leads) opens with the scanner on.
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BuildingShell from '@/components/shared/BuildingShell.vue'
import FoundBookPreview from '@/components/book/FoundBookPreview.vue'
import { useBookPreview } from '@/composables/useBookPreview'
import { getBestsellers, searchBooks } from '@/services/api.js'
import { fetchWeather } from '@/services/weather.js'
import { useBookshelfStore } from '@/stores/bookshelf'
import { PLACES } from '@/town/places.js'
import LibraryHall from './components/LibraryHall.vue'
import ScanMachine from './components/ScanMachine.vue'
import GenreBookcase from './components/GenreBookcase.vue'
import { categoryByKey } from './categories.js'
import { loadGenreFonts } from './fonts.js'

const place = PLACES.find((p) => p.id === 'library')
const route = useRoute()
const router = useRouter()
const bookshelf = useBookshelfStore()
const { previewBook, saving, addedId, openPreview, closePreview, saveStatus, undoAdd } = useBookPreview()

// --- Weather -----------------------------------------------------------------------------------
// The live weather, as My Room has it: it shows through the hall's windows and lights the hall.
// /library?scene=sunny|cloudy|rain previews a sky without waiting for that weather.
const SCENES = ['sunny', 'cloudy', 'rain']
const WEATHER_REFRESH_MS = 10 * 60 * 1000
const live = ref({ scene: 'cloudy', temperature: null, isDay: true, weatherCode: null })

// How hard it rains, from Open-Meteo's weather code: drizzle and light showers, rain, or a
// downpour (heavy rain, violent showers, thunderstorms).
const LIGHT_RAIN = new Set([51, 53, 55, 56, 57, 61, 80])
const HEAVY_RAIN = new Set([65, 67, 82, 95, 96, 99])
function rainFor(code) {
  if (LIGHT_RAIN.has(code)) return 'light'
  if (HEAVY_RAIN.has(code)) return 'heavy'
  return 'steady'
}
let weatherTimer = 0

const weather = computed(() => {
  const preview = SCENES.includes(route.query.scene) ? route.query.scene : null
  return {
    scene: preview ?? (SCENES.includes(live.value.scene) ? live.value.scene : 'cloudy'),
    night: preview ? false : live.value.isDay === false,
    temperature: typeof live.value.temperature === 'number' ? live.value.temperature : null,
    rain: preview ? 'steady' : rainFor(live.value.weatherCode),
  }
})

async function loadWeather() {
  live.value = await fetchWeather()
}

// --- Lamps ------------------------------------------------------------------------------------
// Each lamp in the hall turns off and on by tapping it. The ones turned off are remembered on
// this device for the next visit.
const LAMPS_KEY = 'readalot.libraryLampsOff'
const lampsOff = ref(readLampsOff())

function readLampsOff() {
  try {
    const saved = JSON.parse(localStorage.getItem(LAMPS_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function toggleLamp(id) {
  lampsOff.value = lampsOff.value.includes(id) ? lampsOff.value.filter((lamp) => lamp !== id) : [...lampsOff.value, id]
  try {
    localStorage.setItem(LAMPS_KEY, JSON.stringify(lampsOff.value))
  } catch {
    // storage blocked (private browsing): the lamps still work for this visit
  }
}

// --- Search ------------------------------------------------------------------------------------
const query = ref('')
const searchInput = ref(null)

// Results get their own page, so they can be shared and the Back button returns here.
function onSearch() {
  const text = query.value.trim()
  if (!text) return
  router.push({ name: 'search', query: { q: text } })
}

// The search bar grows, glows and asks what you're looking for whenever it's in use: tapped
// directly, or from the help desk ("ask the librarian"). It settles back once you click away.
// On a phone it rests as a magnifier button between the back button and the weather.
const asking = ref(false)

async function askDesk() {
  asking.value = true
  await nextTick()
  searchInput.value?.focus()
}

// only the text box opens it: the phone's magnifier button opens it on click, and hiding that
// button the moment it is focused would swallow its click
function onFocusIn(event) {
  if (event.target === searchInput.value) asking.value = true
}

function settle(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) asking.value = false
}

// --- Bookcases ---------------------------------------------------------------------------------
// Each bookcase's books, loaded the first time it is opened and kept for the visit:
// key -> { books, loading, error }. 24 fill about four shelves on a phone from one search.
const BOOKS_PER_CASE = 24
const shelves = reactive({})
const openKey = ref(null)
let trigger = null

// where the Bestsellers bookcase's list came from, credited under its sign (the NYT asks for it)
const CREDITS = {
  nyt: { text: 'Data provided by The New York Times', url: 'https://www.nytimes.com/books/best-sellers/' },
  openlibrary: { text: 'Trending this week on Open Library', url: 'https://openlibrary.org/trending/weekly' },
}

async function loadShelf(key) {
  const category = categoryByKey(key)
  if (!category) return
  shelves[key] = { books: [], loading: true, error: '', credit: null }
  try {
    const result = category.source === 'bestsellers' ? await getBestsellers() : await searchBooks(category.query, BOOKS_PER_CASE)
    shelves[key].books = result.books || []
    shelves[key].credit = CREDITS[result.source] ?? null
  } catch {
    shelves[key].error = "Couldn't load these books. Check your connection and try again."
  } finally {
    shelves[key].loading = false
  }
}

function openShelf(key) {
  trigger = document.activeElement
  openKey.value = key
  if (!shelves[key] || shelves[key].error) loadShelf(key)
}

// the bookcase closes and focus goes back to the bookcase in the hall that opened it
async function closeShelf() {
  openKey.value = null
  // opened from a link (?shelf=…, a favourite genre): drop it so going back or reloading doesn't open it again
  if (route.query.shelf) router.replace({ name: 'library' })
  await nextTick()
  if (trigger?.isConnected) trigger.focus()
}

// --- Book scanner ------------------------------------------------------------------------------
const scannerOpen = ref(false)
let scanTrigger = null

function openScanner() {
  scanTrigger = document.activeElement
  scannerOpen.value = true
}

async function closeScanner() {
  scannerOpen.value = false
  // opened from /scan: drop ?scan=1 so going back or reloading does not open it again
  if (route.query.scan) router.replace({ name: 'library' })
  await nextTick()
  if (scanTrigger?.isConnected) scanTrigger.focus()
}

// the cover couldn't be matched: type the title instead
function searchInstead() {
  closeScanner()
  askDesk()
}

// /library?shelf=<key> opens that bookcase: the salon's favourite genres link here. Only a bookcase
// the hall has (and not the one already open) opens.
function openLinkedShelf(key) {
  if (!key || key === openKey.value || !categoryByKey(key)) return
  openShelf(key)
}

watch(() => route.query.shelf, openLinkedShelf)

// /scan while already in the library opens the scanner too
watch(
  () => route.query.scan,
  (scan) => {
    if (scan && !scannerOpen.value) openScanner()
  },
)

onMounted(() => {
  loadGenreFonts()
  // the reader's shelf, so the preview knows which books are already on it
  bookshelf.load()
  if (route.query.scan) openScanner()
  openLinkedShelf(route.query.shelf)
  loadWeather()
  weatherTimer = window.setInterval(loadWeather, WEATHER_REFRESH_MS)
})

onBeforeUnmount(() => window.clearInterval(weatherTimer))
</script>

<template>
  <BuildingShell :title="place.name" :subtitle="place.tab" :owner="place.owner" flush>
    <section class="library" :style="{ '--library-accent': place.accent }">
      <LibraryHall
        :active="openKey"
        :scanning="scannerOpen"
        :weather="weather"
        :lamps-off="lampsOff"
        @open-shelf="openShelf"
        @desk="askDesk"
        @scan="openScanner"
        @toggle-lamp="toggleLamp"
      />

      <form
        class="library__search"
        :class="{ 'is-asking': asking }"
        role="search"
        @submit.prevent="onSearch"
        @focusin="onFocusIn"
        @focusout="settle"
      >
        <button type="button" class="btn btn-secondary btn-icon library__open" data-tour="discover-search" aria-label="Search books or authors" @click="askDesk">
          <span class="library__icon is-glass" aria-hidden="true" />
        </button>
        <div class="library__bar">
          <span class="library__icon" :class="asking ? 'is-bell' : 'is-glass'" aria-hidden="true" />
          <input
            ref="searchInput"
            v-model="query"
            class="library__input"
            type="search"
            enterkeyhint="search"
            :placeholder="asking ? 'What are you looking for?' : 'Search books or authors'"
            data-tour="discover-search"
            aria-label="Search books or authors"
          />
          <!-- mousedown.prevent keeps the typing in the box, so the button stays to be clicked -->
          <button v-if="asking" type="submit" class="btn btn-primary btn-sm library__go" @mousedown.prevent>Search</button>
        </div>
        <p v-if="asking" class="library__ask" role="status">
          The librarian is listening: type a title or an author, then press Enter.
        </p>
      </form>

      <GenreBookcase
        v-if="openKey"
        :key="openKey"
        :category="categoryByKey(openKey)"
        :books="shelves[openKey]?.books"
        :loading="shelves[openKey]?.loading"
        :error="shelves[openKey]?.error"
        :credit="shelves[openKey]?.credit"
        :open-book="previewBook?.id ?? null"
        @select="openPreview"
        @close="closeShelf"
        @retry="loadShelf(openKey)"
      />

      <ScanMachine v-if="scannerOpen" @close="closeScanner" @found="openPreview" @search="searchInstead" />

      <FoundBookPreview
      :book="previewBook"
      :adding="saving"
      :undoable="addedId === previewBook?.id"
      @add="saveStatus('want_to_read')"
      @undo="undoAdd"
      @close="closePreview"
    />
    </section>
  </BuildingShell>
</template>

<style scoped>
.library {
  position: relative;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

/* The search bar sits in the middle of the top line, between the back button (left) and the
   weather (right), clear of both: 370px is their widths and gaps together. It is a pixel text
   box: square, a dark outline and a hard shadow, like the buttons beside it. */
.library__search {
  position: absolute;
  top: 10px;
  left: 50%;
  z-index: 5;
  width: min(460px, calc(100% - 370px));
  transform: translateX(-50%);
  border: var(--px-border);
  background: var(--px-paper);
  box-shadow: var(--px-shadow);
  transition: width 0.25s ease, box-shadow 0.25s ease;
}

.library__search:focus-within {
  box-shadow: 0 0 0 3px rgba(63, 107, 120, 0.35), var(--px-shadow);
}

/* in use, or asked at the help desk: wider, a teal ring that pulses, and a prompt underneath */
.library__search.is-asking {
  width: min(640px, calc(100% - 370px));
  border-color: var(--library-accent);
  animation: library-ask 1.4s ease-out 2;
}

.library__open {
  display: none;
}

.library__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 4px 6px 4px 12px;
}

.library__search.is-asking .library__bar {
  padding: 8px 8px 8px 14px;
}

/* the magnifier, and the help desk's bell while the librarian listens: pixel icons */
.library__icon {
  flex: none;
  width: 18px;
  height: 18px;
  image-rendering: pixelated;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}

.library__icon.is-glass {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 9' shape-rendering='crispEdges'%3E%3Cpath fill='%231e1a24' d='M1 0h4v1h-4zM0 1h1v4h-1zM5 1h1v4h-1zM1 5h4v1h-4zM5 5h2v2h-2zM7 7h2v2h-2z'/%3E%3Cpath fill='%237fb6d9' d='M1 1h4v4h-4z'/%3E%3Cpath fill='%23fdf7ec' d='M2 2h1v1h-1z'/%3E%3C/svg%3E");
}

.library__icon.is-bell {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 9' shape-rendering='crispEdges'%3E%3Cpath fill='%23b08a3c' d='M4 0h1v1h-1zM3 1h3v1h-3zM2 2h5v3h-5zM1 5h7v1h-7zM0 6h9v1h-9zM4 7h1v1h-1z'/%3E%3Cpath fill='%23f0d48a' d='M3 2h1v2h-1z'/%3E%3C/svg%3E");
}

/* A phone has no room for the whole bar on the top line: it rests as a magnifier button in the
   middle, and when used it grows into a full-width bar just below the top line. */
@media (max-width: 719.98px) {
  .library__search:not(.is-asking) {
    width: auto;
    border: 0;
    background: none;
    box-shadow: none;
  }

  .library__search:not(.is-asking) .library__open {
    display: inline-flex;
  }

  .library__search:not(.is-asking) .library__bar {
    display: none;
  }

  .library__search.is-asking {
    top: 66px;
    left: 12px;
    width: calc(100% - 24px);
    transform: none;
  }
}

.library__input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: none;
  font-size: 14px;
  color: var(--rl-text);
}

.library__search.is-asking .library__input {
  font-size: 16px;
}

.library__go {
  flex: none;
}

.library__ask {
  margin: 0;
  padding: 0 16px 12px;
  font-size: 13px;
  color: var(--rl-muted);
}

@keyframes library-ask {
  0% {
    box-shadow: 0 0 0 0 rgba(63, 107, 120, 0.55), var(--px-shadow);
  }
  100% {
    box-shadow: 0 0 0 14px rgba(63, 107, 120, 0), var(--px-shadow);
  }
}

@media (prefers-reduced-motion: reduce) {
  .library__search {
    transition: none;
  }

  .library__search.is-asking {
    animation: none;
  }
}
</style>
