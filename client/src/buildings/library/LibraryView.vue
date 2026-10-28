<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Library → Discover. Owner: Aasim. Everything inside this folder is yours to change.
// A pixel-art library hall with one bookcase per category (categories.js). Tapping a bookcase
// opens its books; the help desk and the search bar find any book; the book scanner reads a
// book's cover. /library?scan=1 (where the old /scan address leads) opens with the scanner on.
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BuildingShell from '@/components/shared/BuildingShell.vue'
import BookPreviewModal from '@/components/BookPreviewModal.vue'
import { useBookPreview } from '@/composables/useBookPreview'
import { searchBooks } from '@/services/api.js'
import { fetchWeather } from '@/services/weather.js'
import { useBookshelfStore } from '@/stores/bookshelf'
import { PLACES } from '@/town/places.js'
import LibraryHall from './components/LibraryHall.vue'
import ScanMachine from './components/ScanMachine.vue'
import ShelfSheet from './components/ShelfSheet.vue'
import { categoryByKey } from './categories.js'

const place = PLACES.find((p) => p.id === 'library')
const route = useRoute()
const router = useRouter()
const bookshelf = useBookshelfStore()
const { previewBook, openPreview, closePreview, saveStatus } = useBookPreview()

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
const asking = ref(false)

function askDesk() {
  searchInput.value?.focus()
}

function settle(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) asking.value = false
}

// --- Bookcases ---------------------------------------------------------------------------------
// Each bookcase's books, loaded the first time it is opened and kept for the visit:
// key -> { books, loading, error }
const shelves = reactive({})
const openKey = ref(null)
let trigger = null

async function loadShelf(key) {
  const category = categoryByKey(key)
  if (!category) return
  shelves[key] = { books: [], loading: true, error: '' }
  try {
    const result = await searchBooks(category.query)
    shelves[key].books = result.books || []
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

// the sheet goes away and focus goes back to the bookcase that opened it
async function closeShelf() {
  openKey.value = null
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

// /scan while already in the library opens the scanner too
watch(
  () => route.query.scan,
  (scan) => {
    if (scan && !scannerOpen.value) openScanner()
  },
)

onMounted(() => {
  // the reader's shelf, so the preview knows which books are already on it
  bookshelf.load()
  if (route.query.scan) openScanner()
  loadWeather()
  weatherTimer = window.setInterval(loadWeather, WEATHER_REFRESH_MS)
})

onBeforeUnmount(() => window.clearInterval(weatherTimer))
</script>

<template>
  <BuildingShell :title="place.name" :subtitle="place.tab" :owner="place.owner" :accent="place.accent" flush>
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
        @focusin="asking = true"
        @focusout="settle"
      >
        <div class="library__bar">
          <span aria-hidden="true">{{ asking ? '🛎️' : '🔍' }}</span>
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
          <button v-if="asking" type="submit" class="btn btn-sm library__go" @mousedown.prevent>Search</button>
        </div>
        <p v-if="asking" class="library__ask" role="status">
          The librarian is listening: type a title or an author, then press Enter.
        </p>
      </form>

      <ShelfSheet
        v-if="openKey"
        :key="openKey"
        :category="categoryByKey(openKey)"
        :books="shelves[openKey]?.books"
        :loading="shelves[openKey]?.loading"
        :error="shelves[openKey]?.error"
        @select="openPreview"
        @close="closeShelf"
        @retry="loadShelf(openKey)"
      />

      <ScanMachine v-if="scannerOpen" @close="closeScanner" @found="openPreview" @search="searchInstead" />

      <BookPreviewModal :book="previewBook" @close="closePreview" @status="saveStatus" />
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

/* the search bar floats at the top of the hall, above the bookcases' name plates; on a wide
   screen it keeps to a comfortable width */
.library__search {
  position: absolute;
  top: 10px;
  left: 12px;
  z-index: 5;
  width: min(460px, calc(100% - 24px));
  border: 1px solid var(--rl-line);
  border-radius: 24px;
  background: var(--rl-surface);
  box-shadow: 0 4px 14px rgba(63, 46, 36, 0.12);
  transition: width 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.library__search:focus-within {
  border-color: var(--library-accent);
  box-shadow: 0 0 0 3px rgba(63, 107, 120, 0.25), 0 4px 14px rgba(63, 46, 36, 0.12);
}

/* asked at the help desk: wider, a thicker teal ring that pulses, and a prompt underneath */
.library__search.is-asking {
  width: min(640px, calc(100% - 24px));
  border: 2px solid var(--library-accent);
  animation: library-ask 1.4s ease-out 2;
}

.library__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
}

.library__search.is-asking .library__bar {
  padding: 12px 10px 12px 16px;
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
  border-radius: 999px;
  background: var(--library-accent);
  font-weight: 700;
  color: #fff;
}

.library__ask {
  margin: 0;
  padding: 0 16px 12px;
  font-size: 13px;
  color: var(--rl-muted);
}

@keyframes library-ask {
  0% {
    box-shadow: 0 0 0 0 rgba(63, 107, 120, 0.55), 0 4px 14px rgba(63, 46, 36, 0.12);
  }
  100% {
    box-shadow: 0 0 0 14px rgba(63, 107, 120, 0), 0 4px 14px rgba(63, 46, 36, 0.12);
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
