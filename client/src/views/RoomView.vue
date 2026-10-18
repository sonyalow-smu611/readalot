<script setup>
// The home page: the 3D room. Books are opened straight off its bookcase.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBookshelfStore } from '@/stores/bookshelf'
import { useToast } from '@/composables/useToast'
import { fetchWeather } from '@/services/weather.js'
import { decorMeta, useDecor } from '@/composables/useDecor'
import Room3D from '@/components/room/Room3D.vue'
import CurrentlyReadingCard from '@/components/room/CurrentlyReadingCard.vue'
import MoodCheckInModal from '@/components/modals/MoodCheckInModal.vue'
import MoodResultModal from '@/components/modals/MoodResultModal.vue'
import QuoteOfDayModal from '@/components/modals/QuoteOfDayModal.vue'
import RemoveBookModal from '@/components/modals/RemoveBookModal.vue'
import StateView from '@/components/StateView.vue'
import BookCard from '@/components/book/BookCard.vue'
import BookDetailsContent from '@/components/book/BookDetailsContent.vue'
import BottomSheet from '@/components/BottomSheet.vue'
import { primaryAuthor } from '@/lib/book'
import DecorPiece from '@/components/DecorPiece.vue'
import CreditChip from '@/components/CreditChip.vue'
import RoomDock from '@/components/RoomDock.vue'

const WINDOW_SCENES = ['sunny', 'cloudy', 'rain']
const WEATHER_REFRESH_MS = 10 * 60 * 1000

const route = useRoute()
const bookshelf = useBookshelfStore()

// --- Removing books ----------------------------------------------------------------------
// From the book details. "Don't ask again" is remembered on this device; Undo in the toast is
// the safety net either way.
const SKIP_CONFIRM_KEY = 'readalot.skipRemoveConfirm'
const removing = ref(null)
const { show: showToast } = useToast()

function skipConfirm() {
  try {
    return localStorage.getItem(SKIP_CONFIRM_KEY) === 'yes'
  } catch {
    return false
  }
}

function askRemove(book) {
  if (skipConfirm()) removeBook(book)
  else removing.value = book
}

function confirmRemove({ remember }) {
  const book = removing.value
  removing.value = null
  if (remember) {
    try {
      localStorage.setItem(SKIP_CONFIRM_KEY, 'yes')
    } catch {
      // storage unavailable: it asks again next visit
    }
  }
  removeBook(book)
}

async function removeBook(book) {
  if (openedBook.value?.id === book.id) closeBook({ removed: true })
  try {
    const removed = await bookshelf.removeBook(book.id)
    if (!removed) return
    showToast(`Removed “${removed.title}”`, 5000, { label: 'Undo', run: () => undoRemove(removed) })
  } catch {
    showToast(`Couldn't remove “${book.title}”. Try again.`)
  }
}

async function undoRemove(book) {
  try {
    await bookshelf.restoreBook(book)
  } catch {
    showToast(`Couldn't put “${book.title}” back. Try again.`)
  }
}

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
const room3d = ref(null)
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
  const spot = room3d.value?.dropAt(entry, clientX, clientY)
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
const bookCard = ref(null)
// the books as a list, for the still picture of the room
const listOpen = ref(false)
const SHELF_NAMES = { reading: 'Reading', want_to_read: 'To read', read: 'Finished' }
let bookTrigger = null

async function openBook(book) {
  bookTrigger = document.activeElement
  openedBook.value = book
  await nextTick()
  bookCard.value?.focus()
}

// The details go at once; the book itself goes back on the shelf (or fades, when removed).
async function closeBook({ removed = false } = {}) {
  const { id } = openedBook.value
  openedBook.value = null
  await room3d.value?.putBack({ removed })
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
      <Room3D
        ref="room3d"
        :books="bookshelf.books"
        :current-book="bookshelf.currentlyReading"
        :weather="sky"
        :loading="bookshelf.loading"
        :error="bookshelf.error"
        :reading-open="readingOpen"
        @open-book="toggleReading"
        @pick-book="openBook"
        @list-books="listOpen = true"
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

    <BottomSheet v-model:open="listOpen" title="Your books">
      <StateView
        v-if="bookshelf.loading || bookshelf.error"
        :loading="bookshelf.loading"
        :error="bookshelf.error"
        @retry="bookshelf.load"
      />
      <div v-else-if="!bookshelf.books.length" class="home__list-empty">
        <strong>Add your first book</strong>
        <RouterLink to="/discover">Discover books</RouterLink>
        <RouterLink to="/scan">Scan a cover</RouterLink>
      </div>
      <template v-else>
        <section v-for="(name, status) in SHELF_NAMES" :key="status" class="home__list-shelf">
          <h3 class="home__list-name">{{ name }}</h3>
          <button
            v-for="book in bookshelf.booksByStatus[status]"
            :key="book.id"
            type="button"
            class="home__list-book"
            :data-book-id="book.id"
            aria-haspopup="dialog"
            @click="openBook(book)"
          >
            <strong>{{ book.title }}</strong> <span>by {{ primaryAuthor(book) }}</span>
          </button>
        </section>
      </template>
    </BottomSheet>

    <!-- covers the room while a book is out: a tap on it puts the book away, and nothing in the
         room under it (another book, the chair, a drag to look around) can be reached -->
    <div v-if="openedBook" class="home__book-backdrop" aria-hidden="true" @click="closeBook" />
    <BookCard
      v-if="openedBook"
      ref="bookCard"
      class="home__book"
      role="dialog"
      aria-label="Book details"
      tabindex="-1"
      close-label="Close book"
      @keydown.esc="closeBook"
      @close="closeBook"
    >
      <BookDetailsContent :book="openedBook" @leave="openedBook = null" />
      <div class="home__book-links">
        <RouterLink :to="`/books/${openedBook.id}`">Open book page</RouterLink>
        <button type="button" class="home__book-remove" @click="askRemove(openedBook)">Remove from shelf</button>
      </div>
    </BookCard>

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
    <RemoveBookModal v-if="removing" :book="removing" @close="removing = null" @remove="confirmRemove" />
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

.home__reading {
  position: absolute;
  inset: auto 15px 76px;
  z-index: 15;
}


.home__book-links {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid rgba(127, 85, 57, 0.28);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 13px;
  font-weight: 700;
}

.home__book-links a {
  color: #7f5539;
}

.home__book-remove {
  padding: 0;
  border: 0;
  background: none;
  font-weight: 700;
  color: #b42318;
}

.home__list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  font-size: 13px;
}

.home__list-shelf + .home__list-shelf {
  margin-top: 14px;
}

.home__list-name {
  margin-bottom: 6px;
  font-family: var(--rl-font-title);
  font-size: 15px;
}

.home__list-book {
  display: block;
  width: 100%;
  padding: 8px 4px;
  border: 0;
  border-bottom: 1px solid var(--rl-line);
  background: none;
  font-size: 13px;
  text-align: left;
  color: var(--rl-text);
}

.home__list-book span {
  color: var(--rl-muted);
}

/* above the list of books on the still picture, which a book can be opened from */
.home__book-backdrop {
  position: absolute;
  inset: 0;
  z-index: 44;
  background: rgba(44, 36, 30, 0.18);
}

/* the open book's card: 80% of the screen, centred, over the room */
.home .home__book {
  position: absolute;
  inset: 10%;
  z-index: 45;
}

.home__book:focus,
.home__reading:focus {
  outline: none;
}

.home__reading-state {
  display: grid;
  place-items: center;
  min-height: 108px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card);
  background: var(--rl-surface);
  box-shadow: 0 4px 10px rgba(63, 46, 36, 0.17);
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
  padding: 8px 10px;
  border-radius: 12px;
  background: var(--paper);
  box-shadow: 0 12px 28px rgba(63, 46, 36, 0.18);
  color: var(--ink);
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
