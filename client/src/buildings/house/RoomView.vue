<script setup>
// My Room: the room, side on. Books are opened straight off its bookshelf; the bookshelf itself
// opens My Shelf.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBookshelfStore } from '@/stores/bookshelf'
import { fetchWeather } from '@/services/weather.js'
import { decorMeta, useDecor } from '@/composables/useDecor'
import RoomStrip from '@/buildings/house/components/RoomStrip.vue'
import CurrentlyReadingCard from '@/buildings/house/components/CurrentlyReadingCard.vue'
import MoodCheckInModal from '@/components/modals/MoodCheckInModal.vue'
import MoodResultModal from '@/components/modals/MoodResultModal.vue'
import QuoteOfDayModal from '@/components/modals/QuoteOfDayModal.vue'
import StateView from '@/components/StateView.vue'
import BookDialog from '@/buildings/house/components/BookDialog.vue'
import { PLACES } from '@/town/places.js'
import DecorPiece from '@/components/DecorPiece.vue'
import CreditChip from '@/components/CreditChip.vue'
import RoomDock from '@/buildings/house/components/RoomDock.vue'

const WINDOW_SCENES = ['sunny', 'cloudy', 'rain']
const WEATHER_REFRESH_MS = 10 * 60 * 1000

const route = useRoute()
const router = useRouter()
const bookshelf = useBookshelfStore()
// the house's colour from the town, for the book card
const accent = PLACES.find((place) => place.id === 'house').accent

// --- Window ------------------------------------------------------------------------------
const weather = ref({ scene: 'cloudy', temperature: null, isDay: true })
let weatherTimer = 0

// /?scene=sunny|cloudy|rain previews a window scene without waiting for that weather
const preview = computed(() => (WINDOW_SCENES.includes(route.query.scene) ? route.query.scene : null))

const sky = computed(() => ({
  scene: preview.value ?? (WINDOW_SCENES.includes(weather.value.scene) ? weather.value.scene : 'cloudy'),
  night: preview.value ? false : weather.value.isDay === false,
  temperature: typeof weather.value.temperature === 'number' ? weather.value.temperature : null,
}))

async function loadWeather() {
  weather.value = await fetchWeather()
}

// --- Decorations -------------------------------------------------------------------------
const room = ref(null)
const strip = ref(null)
let listening = false

const { shopOpen, inventoryOpen, drag, notice, sparkle, moveDrag, endDrag, flash, burst } = useDecor()

function onMove(event) {
  moveDrag(event.clientX, event.clientY)
}

function release(entry, clientX, clientY) {
  const meta = decorMeta(entry.id)
  if (!meta) return
  const roomRect = room.value?.getBoundingClientRect()
  const mark = (x, y) => {
    if (!roomRect) return
    burst(x - roomRect.left, y - roomRect.top)
  }

  // it goes on the free spot nearest where it was let go
  const spot = strip.value?.dropAt(entry, clientX, clientY)
  if (!spot) {
    const where = meta.surface === 'floor' ? 'on the floor' : 'on the window seat, nightstand or side table'
    flash(`Drop ${meta.name} on a glowing spot ${where}.`, 'bad')
    return
  }
  mark(clientX, clientY)
  flash(`${meta.name} is ${spot.name}.`, 'ok')
}

function onUp(event) {
  const entry = endDrag()
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  listening = false
  if (!entry?.moved) return
  release(entry, event.clientX, event.clientY)
}

watch(drag, (value) => {
  if (!value || listening) return
  listening = true
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
})

// --- A book taken off the shelf ----------------------------------------------------------
const openedBook = ref(null)
let bookTrigger = null

function openBook(book) {
  bookTrigger = document.activeElement
  openedBook.value = book
}

// the bookshelf itself: every book, on My Shelf
function openShelf() {
  router.push({ name: 'my-shelf' })
}

// The details go at once; the book itself goes back on the shelf (or fades, when removed).
async function closeBook({ removed = false } = {}) {
  if (!openedBook.value) return
  const { id } = openedBook.value
  openedBook.value = null
  await strip.value?.putBack({ removed })
  await nextTick()
  // the button that opened it may have gone (the book changed shelf in the list, or a tap that
  // skipped the opening); then the book's own button
  const trigger = bookTrigger?.isConnected
    ? bookTrigger
    : room.value?.querySelector(`[data-book-id="${id}"], [data-pin="book:${id}"]`)
  trigger?.focus?.()
}

// --- Currently Reading card and Quote of the Day -----------------------------------------
const readingOpen = ref(false)
const readingCard = ref(null)
const quoteOpen = ref(false)
let readingTrigger = null

async function toggleReading() {
  if (readingOpen.value) {
    closeReading()
    return
  }
  readingTrigger = document.activeElement
  readingOpen.value = true
  await nextTick()
  readingCard.value?.focus()
}

function closeReading({ refocus = false } = {}) {
  if (!readingOpen.value) return
  readingOpen.value = false
  if (refocus) readingTrigger?.focus?.()
}

// A tap anywhere else puts the card away. The chair's book is left to its own click handler.
function onOutsidePress(event) {
  if (readingCard.value?.contains(event.target) || event.target.closest?.('.chair__book')) return
  closeReading()
}

watch(readingOpen, (open) => {
  if (open) window.addEventListener('pointerdown', onOutsidePress)
  else window.removeEventListener('pointerdown', onOutsidePress)
})

// The shop, the inventory and a decoration being dragged all need the floor the card covers.
watch([shopOpen, inventoryOpen, drag], ([shop, bag, dragging]) => {
  if (shop || bag || dragging) closeReading()
})

// --- Mood check-in -----------------------------------------------------------------------
// Opens by itself on the first visit of the day; the room menu can bring it back any time.
const MOOD_KEY = 'readalot.moodCheckIn'
const moodStep = ref(null) // null | 'checkin' | 'result'
const mood = ref('')

// today's date on this device, e.g. "2026-01-31"
function today() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function moodDoneToday() {
  try {
    return localStorage.getItem(MOOD_KEY) === today()
  } catch {
    return false
  }
}

// Answering and skipping both count: the check-in stays away until tomorrow.
function markMoodDone() {
  try {
    localStorage.setItem(MOOD_KEY, today())
  } catch {
    // storage unavailable: it will simply ask again on the next visit
  }
}

function openMood() {
  closeReading()
  moodStep.value = 'checkin'
}

function submitMood(value) {
  mood.value = value
  markMoodDone()
  moodStep.value = 'result'
}

function skipMood() {
  markMoodDone()
  moodStep.value = null
}

watch(
  () => bookshelf.moveError,
  (message) => {
    if (message) flash(message, 'bad')
  },
)

onMounted(() => {
  if (!moodDoneToday()) moodStep.value = 'checkin'
  bookshelf.load()
  loadWeather()
  weatherTimer = window.setInterval(loadWeather, WEATHER_REFRESH_MS)
})

onBeforeUnmount(() => {
  window.clearInterval(weatherTimer)
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointerdown', onOutsidePress)
})
</script>

<template>
  <section ref="room" class="home">
    <div class="home__far">
      <RoomStrip
        ref="strip"
        :books="bookshelf.books"
        :current-book="bookshelf.currentlyReading"
        :weather="sky"
        :loading="bookshelf.loading"
        :error="bookshelf.error"
        :reading-open="readingOpen"
        @open-book="toggleReading"
        @pick-book="openBook"
        @open-shelf="openShelf"
        @quote="quoteOpen = true"
        @retry="bookshelf.load"
      />

      <CreditChip data-tour="credits" class="home__credits" />
    </div>

    <!-- Opened from the book on the chair -->
    <Transition name="reading-pop">
      <div
        v-if="readingOpen"
        ref="readingCard"
        class="home__reading"
        role="dialog"
        aria-label="Currently reading"
        tabindex="-1"
        @keydown.esc="closeReading({ refocus: true })"
      >
        <div v-if="bookshelf.loading || bookshelf.error" class="home__reading-state">
          <StateView :loading="bookshelf.loading" :error="bookshelf.error" @retry="bookshelf.load" />
        </div>
        <CurrentlyReadingCard v-else :book="bookshelf.currentlyReading" />
        <button
          type="button"
          class="home__reading-close"
          aria-label="Close"
          @click="closeReading({ refocus: true })"
        >
          ✕
        </button>
      </div>
    </Transition>


    <!-- covers the room while a book is out: nothing in the room under it (another book, the
         chair, a drag to look around) can be reached -->
    <BookDialog v-if="openedBook" :book="openedBook" :accent="accent" @close="closeBook" @leave="openedBook = null" />

    <div v-if="drag?.moved" class="drag-ghost" :style="{ left: `${drag.x}px`, top: `${drag.y}px` }">
      <DecorPiece :kind="drag.id" />
    </div>
    <div v-if="sparkle" :key="sparkle.key" class="spark" :style="{ left: `${sparkle.x}px`, top: `${sparkle.y}px` }" aria-hidden="true">
      <i v-for="n in 7" :key="n" />
    </div>
    <p v-if="notice" :key="notice.key" class="room-toast" :class="`room-toast--${notice.tone}`" role="status">
      {{ notice.text }}
    </p>

    <RoomDock @mood="openMood" />

    <QuoteOfDayModal v-if="quoteOpen" @close="quoteOpen = false" />
    <MoodCheckInModal v-if="moodStep === 'checkin'" @submit="submitMood" @skip="skipMood" />
    <MoodResultModal v-else-if="moodStep === 'result'" :mood="mood" @close="moodStep = null" />
  </section>
</template>

<style scoped>
.home {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  position: relative;
  background: var(--wall);
}

.home__far {
  position: relative;
  height: 100%;
  transition: opacity 0.55s ease;
}

.home__credits {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 4;
}

/* across the bottom of the room on a phone; the same width, centred, on a wide window */
.home__reading {
  position: absolute;
  inset: auto 15px 76px;
  z-index: 15;
  max-width: 450px;
  margin-inline: auto;
}


.home__reading:focus {
  outline: none;
}

.home__reading-state {
  display: grid;
  place-items: center;
  min-height: 108px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-modal, 22px);
  background: var(--rl-surface);
  box-shadow: 0 14px 36px rgba(63, 46, 36, 0.25);
}

.home__reading-close {
  position: absolute;
  top: -10px;
  right: -8px;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--rl-line);
  border-radius: 50%;
  background: var(--rl-surface);
  font-size: 12px;
  line-height: 1;
  color: var(--rl-primary);
  box-shadow: 0 2px 6px rgba(63, 46, 36, 0.2);
}

/* the card rises from the floor, out from under the chair */
.reading-pop-enter-active,
.reading-pop-leave-active {
  transform-origin: 75% 0;
  transition: transform 0.26s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.18s ease;
}

.reading-pop-enter-from,
.reading-pop-leave-to {
  transform: translateY(14px) scale(0.92);
  opacity: 0;
}

.drag-ghost {
  position: fixed;
  z-index: 40;
  transform: translate(-50%, -100%);
  pointer-events: none;
  filter: drop-shadow(0 8px 8px rgba(63, 46, 36, 0.2));
}

.spark {
  position: absolute;
  z-index: 28;
  width: 0;
  height: 0;
  pointer-events: none;
}

.spark i {
  position: absolute;
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  border-radius: 50%;
  background: #f3d48a;
  box-shadow: 0 0 6px rgba(243, 212, 138, 0.9);
  animation: spark-out 0.62s ease-out forwards;
}

.spark i:nth-child(1) { --a: -80deg; }
.spark i:nth-child(2) { --a: -40deg; background: #fff; }
.spark i:nth-child(3) { --a: -10deg; }
.spark i:nth-child(4) { --a: 24deg; background: #fff; }
.spark i:nth-child(5) { --a: 58deg; }
.spark i:nth-child(6) { --a: 100deg; }
.spark i:nth-child(7) { --a: 150deg; background: #fff; }

.room-toast {
  position: absolute;
  top: 58px;
  right: 10px;
  z-index: 32;
  max-width: 54%;
  margin: 0;
  padding: 8px 12px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card);
  background: var(--rl-surface);
  box-shadow: 0 4px 14px rgba(63, 46, 36, 0.15);
  color: var(--rl-text);
  font-size: 0.75rem;
  line-height: 1.35;
  animation: toast-life 1.7s ease forwards;
}

.room-toast--bad {
  background: #f8e8e6;
  color: #8d2218;
  animation-name: toast-bad;
}

@keyframes spark-out {
  to { transform: rotate(var(--a)) translateY(-26px) scale(0.2); opacity: 0; }
}

@keyframes toast-life {
  0% { opacity: 0; transform: translateX(18px); }
  14% { opacity: 1; transform: none; }
  72% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes toast-bad {
  0% { opacity: 0; transform: translateX(14px); }
  10% { opacity: 1; transform: translateX(-7px); }
  18% { transform: translateX(6px); }
  26% { transform: translateX(-4px); }
  34% { transform: none; }
  72% { opacity: 1; }
  100% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .spark i,
  .room-toast,
  .room-toast--bad,
  .reading-pop-enter-active,
  .reading-pop-leave-active {
    animation: none;
    transition: none;
  }
}
</style>
