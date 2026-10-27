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
const live = ref({ scene: 'cloudy', temperature: null, isDay: true })
let weatherTimer = 0

const weather = computed(() => {
  const preview = SCENES.includes(route.query.scene) ? route.query.scene : null
  return {
    scene: preview ?? (SCENES.includes(live.value.scene) ? live.value.scene : 'cloudy'),
    night: preview ? false : live.value.isDay === false,
    temperature: typeof live.value.temperature === 'number' ? live.value.temperature : null,
  }
})

async function loadWeather() {
  live.value = await fetchWeather()
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

// the help desk: "ask the librarian" by typing in the search bar
function askDesk() {
  searchInput.value?.focus()
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
        @open-shelf="openShelf"
        @desk="askDesk"
        @scan="openScanner"
      />

      <form class="library__search" role="search" @submit.prevent="onSearch">
        <span aria-hidden="true">🔍</span>
        <input
          ref="searchInput"
          v-model="query"
          class="library__input"
          type="search"
          enterkeyhint="search"
          placeholder="Search books or authors"
          data-tour="discover-search"
          aria-label="Search books or authors"
        />
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

/* the search bar floats at the top of the hall, above the bookcases' name plates */
.library__search {
  position: absolute;
  top: 10px;
  left: 12px;
  right: 12px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border: 1px solid var(--rl-line);
  border-radius: 999px;
  background: var(--rl-surface);
  box-shadow: 0 4px 14px rgba(63, 46, 36, 0.12);
}

.library__search:focus-within {
  border-color: var(--library-accent);
  box-shadow: 0 0 0 3px rgba(63, 107, 120, 0.25), 0 4px 14px rgba(63, 46, 36, 0.12);
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
</style>
