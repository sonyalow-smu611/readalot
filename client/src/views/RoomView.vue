<script setup>
// The home page. Far: the illustrated room. Close: the bookshelf fills the phone.
// The zoom between them is scale and translate only.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBookshelfStore } from '@/stores/bookshelf'
import { fetchWeather } from '@/services/weather.js'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import { decorMeta, useDecor } from '@/composables/useDecor'
import RoomScene from '@/components/room/RoomScene.vue'
import CurrentlyReadingCard from '@/components/room/CurrentlyReadingCard.vue'
import QuoteOfDayModal from '@/components/modals/QuoteOfDayModal.vue'
import StateView from '@/components/StateView.vue'
import Shelf from '@/components/Shelf.vue'
import CoverRow from '@/components/CoverRow.vue'
import DecorPiece from '@/components/DecorPiece.vue'
import CreditChip from '@/components/CreditChip.vue'
import RoomDock from '@/components/RoomDock.vue'
import FloorLife from '@/components/FloorLife.vue'

const WINDOW_SCENES = ['sunny', 'cloudy', 'rain']
const WEATHER_REFRESH_MS = 10 * 60 * 1000
const ZOOM = { duration: 0.55, ease: 'power3.inOut', force3D: false }
const ZOOM_TO = { scale: 1, x: 0, y: 0 }

const route = useRoute()
const bookshelf = useBookshelfStore()

// --- Shelves -----------------------------------------------------------------------------
// The full bookshelf edits these three lists by drag; the store is told where books landed.
const reading = ref([])
const tbr = ref([])
const finished = ref([])
const shelfView = ref('spines')

const storeLayout = computed(() => layoutOf(bookshelf.booksByStatus))
const shelfLayout = computed(() =>
  layoutOf({ reading: reading.value, want_to_read: tbr.value, read: finished.value }),
)

// "which book is on which shelf, in what order", as one comparable string
function layoutOf(shelves) {
  return ['reading', 'want_to_read', 'read']
    .map((status) => shelves[status].map((book) => book.id).join(','))
    .join('|')
}

function fillShelves() {
  if (shelfLayout.value === storeLayout.value) return
  reading.value = [...bookshelf.booksByStatus.reading]
  tbr.value = [...bookshelf.booksByStatus.want_to_read]
  finished.value = [...bookshelf.booksByStatus.read]
}

function syncShelves() {
  if (shelfLayout.value === storeLayout.value) return
  const ids = (list) => list.value.map((book) => book.id)
  bookshelf.setOrder([...ids(reading), ...ids(tbr), ...ids(finished)])
  bookshelf.applyShelf(ids(reading), 'reading')
  bookshelf.applyShelf(ids(tbr), 'want_to_read')
  bookshelf.applyShelf(ids(finished), 'read')
}

// Books arriving from the API, or a failed save moving a book back, redraw the shelves;
// a drag that changed the shelves is saved.
watch(storeLayout, fillShelves, { immediate: true })
watch(shelfLayout, syncShelves)

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
const isClose = ref(false)
const room = ref(null)
let blockOpen = false
let listening = false

const {
  placedIn,
  placing,
  selected,
  hasFood,
  hasDrink,
  shopOpen,
  inventoryOpen,
  placeOn,
  pick,
  unplace,
  drag,
  notice,
  sparkle,
  moveDrag,
  endDrag,
  flash,
  burst,
} = useDecor()

const roomFurniture = computed(() =>
  placedIn('room').filter((item) => !decorMeta(item.id)?.pet),
)
const roomPets = computed(() => placedIn('room').filter((item) => decorMeta(item.id)?.pet))

function pickItem(uid) {
  if (blockOpen) return
  pick(uid)
}

function at(item) {
  const x = typeof item.x === 'number' ? item.x : 0.5
  return { left: `${x * 100}%` }
}

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

  if (meta.surface === 'floor') {
    if (isClose.value) {
      flash(`${meta.name} roams the room floor. Go back first.`, 'bad')
      return
    }
    const caseRect = room.value?.querySelector('[data-drop="case"]')?.getBoundingClientRect()
    const onCase = caseRect
      && clientX >= caseRect.left - 8
      && clientX <= caseRect.right + 8
      && clientY >= caseRect.top - 8
      && clientY <= caseRect.bottom + 10
    if (onCase) {
      flash(`${meta.name} can't go on a shelf.`, 'bad')
      return
    }
    const rect = room.value?.querySelector('[data-drop="floor"]')?.getBoundingClientRect()
    const near = rect
      && clientX >= rect.left - 16
      && clientX <= rect.right - 28
      && clientY >= rect.top - 36
      && clientY <= rect.bottom + 18
    if (!near) {
      flash(`${meta.name} can't sit there. Drop it on the floor.`, 'bad')
      return
    }
    if (!placeOn('room', (clientX - rect.left) / rect.width, entry)) return
    mark(clientX, rect.bottom - 6)
    flash(`${meta.name} is on the floor.`, 'ok')
    return
  }

  if (isClose.value && shelfView.value !== 'spines') {
    flash(`Switch to Spines. ${meta.name} sits on a shelf.`, 'bad')
    return
  }

  const nodes = isClose.value
    ? [...(room.value?.querySelectorAll('.room__bay[data-zone]') || [])]
    : [...(room.value?.querySelectorAll('[data-drop="case"] [data-zone]') || [])]
  let best = null
  nodes.forEach((node) => {
    const rect = node.getBoundingClientRect()
    const dx = clientX < rect.left ? rect.left - clientX : clientX > rect.right ? clientX - rect.right : 0
    const inside = clientY >= rect.top - 24 && clientY <= rect.bottom + 28
    const dy = Math.abs(clientY - rect.bottom)
    if (dx > 32 || (!inside && dy > 80)) return
    const score = dx * 2 + Math.min(dy, 90)
    if (!best || score < best.score) best = { node, rect, score }
  })
  if (!best) {
    flash(`${meta.name} sits on a shelf, not there.`, 'bad')
    return
  }
  const span = best.rect.width || 1
  if (!placeOn(best.node.dataset.zone, (clientX - best.rect.left) / span, entry)) return
  mark(
    Math.min(best.rect.right - 8, Math.max(best.rect.left + 8, clientX)),
    best.rect.bottom,
  )
  flash(`${meta.name} is on the shelf.`, 'ok')
}

function onUp(event) {
  const entry = endDrag()
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  listening = false
  if (!entry?.moved) return
  blockOpen = true
  window.setTimeout(() => {
    blockOpen = false
  }, 400)
  release(entry, event.clientX, event.clientY)
}

watch(drag, (value) => {
  if (!value || listening) return
  listening = true
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
})

// --- Zoom into the bookshelf -------------------------------------------------------------
const closeLayer = ref(null)
let zoomTween = null
let zoomFrom = { scale: 0.5, x: 0, y: 0 }
let zoomOrigin = '30% 60%'
let shelfTrigger = null

function stopZoom() {
  zoomTween?.kill()
  zoomTween = null
}

// The full shelf grows out of the bookcase that was tapped (`rect` is its place on screen).
async function openShelf(rect) {
  if (isClose.value || placing.value || blockOpen || drag.value) return
  stopZoom()
  closeReading()
  const host = room.value.getBoundingClientRect()
  zoomFrom = { scale: rect.width / host.width, x: 0, y: 0 }
  zoomOrigin = `${rect.left - host.left + rect.width / 2}px ${rect.top - host.top + rect.height / 2}px`
  shelfTrigger = document.activeElement
  isClose.value = true
  await nextTick()
  const layer = closeLayer.value
  if (!layer) return
  if (prefersReducedMotion()) {
    gsap.set(layer, { ...ZOOM_TO, transformOrigin: zoomOrigin })
    return
  }
  zoomTween = gsap.fromTo(layer, zoomFrom, {
    ...ZOOM_TO,
    ...ZOOM,
    transformOrigin: zoomOrigin,
    overwrite: 'auto',
  })
}

function closeShelf() {
  const done = async () => {
    isClose.value = false
    await nextTick()
    shelfTrigger?.focus?.()
  }
  const layer = closeLayer.value
  stopZoom()
  if (!layer || prefersReducedMotion()) {
    done()
    return
  }
  zoomTween = gsap.to(layer, {
    ...zoomFrom,
    ...ZOOM,
    transformOrigin: zoomOrigin,
    overwrite: 'auto',
    onComplete: done,
  })
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

watch(
  () => bookshelf.moveError,
  (message) => {
    if (message) flash(message, 'bad')
  },
)

onMounted(() => {
  bookshelf.load()
  loadWeather()
  weatherTimer = window.setInterval(loadWeather, WEATHER_REFRESH_MS)
})

onBeforeUnmount(() => {
  stopZoom()
  window.clearInterval(weatherTimer)
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointerdown', onOutsidePress)
})
</script>

<template>
  <section ref="room" class="home">
    <div class="home__far" :class="{ 'is-dim': isClose }" :inert="isClose">
      <RoomScene
        :books="bookshelf.books"
        :current-book="bookshelf.currentlyReading"
        :weather="sky"
        :loading="bookshelf.loading"
        :error="bookshelf.error"
        :reading-open="readingOpen"
        @open-shelf="openShelf"
        @open-book="toggleReading"
        @quote="quoteOpen = true"
        @retry="bookshelf.load"
      >
        <template #ledge="{ zone }">
          <button
            v-for="item in placedIn(zone)"
            :key="item.uid"
            type="button"
            class="placed placed--ledge"
            :style="at(item)"
            @click.stop="pickItem(item.uid)"
          >
            <span class="placed__pop" :data-decor-uid="item.uid">
              <DecorPiece :kind="item.id" />
            </span>
            <span v-if="selected === item.uid" class="placed__remove" @click.stop="unplace(item.uid)">
              Remove
            </span>
          </button>
        </template>

        <template #floor>
          <template v-if="!isClose">
            <button
              v-for="item in roomFurniture"
              :key="item.uid"
              type="button"
              class="placed placed--floor"
              :style="at(item)"
              @click.stop="pickItem(item.uid)"
            >
              <span class="placed__pop" :data-decor-uid="item.uid">
                <DecorPiece :kind="item.id" />
              </span>
              <span v-if="selected === item.uid" class="placed__remove" @click.stop="unplace(item.uid)">
                Remove
              </span>
            </button>
            <FloorLife
              :pets="roomPets"
              :has-food="hasFood"
              :has-drink="hasDrink"
              :selected="selected"
              @pick="pickItem"
              @remove="unplace"
            />
          </template>
        </template>
      </RoomScene>

      <CreditChip v-if="!isClose" class="home__credits" />
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

    <div v-show="isClose" ref="closeLayer" class="room__close">
      <header class="room__bar">
        <button type="button" class="room__back" @click="closeShelf">Back</button>
        <div class="room__tools">
          <CreditChip tone="light" />
          <div class="room__toggle" role="group" aria-label="How books are shown">
            <button
              type="button"
              class="room__toggle-btn"
              :class="{ 'is-on': shelfView === 'spines' }"
              :aria-pressed="shelfView === 'spines'"
              @click="shelfView = 'spines'"
            >
              Spines
            </button>
            <button
              type="button"
              class="room__toggle-btn"
              :class="{ 'is-on': shelfView === 'covers' }"
              :aria-pressed="shelfView === 'covers'"
              @click="shelfView = 'covers'"
            >
              Covers
            </button>
          </div>
        </div>
      </header>

      <div class="room__scroll">
        <template v-if="shelfView === 'spines'">
          <div class="room__bay" data-zone="reading">
            <Shelf v-model="reading" title="Reading" mode="draggable" group="room" emoji="" compact />
            <button v-for="item in placedIn('reading')" :key="item.uid" type="button" class="placed placed--shelf" :style="at(item)" @click.stop="pickItem(item.uid)">
              <span class="placed__pop" :data-decor-uid="item.uid"><DecorPiece :kind="item.id" /></span>
              <span v-if="selected === item.uid" class="placed__remove" @click.stop="unplace(item.uid)">Remove</span>
            </button>
          </div>
          <div class="room__bay" data-zone="tbr">
            <Shelf v-model="tbr" title="To read" mode="draggable" group="room" emoji="" compact />
            <button v-for="item in placedIn('tbr')" :key="item.uid" type="button" class="placed placed--shelf" :style="at(item)" @click.stop="pickItem(item.uid)">
              <span class="placed__pop" :data-decor-uid="item.uid"><DecorPiece :kind="item.id" /></span>
              <span v-if="selected === item.uid" class="placed__remove" @click.stop="unplace(item.uid)">Remove</span>
            </button>
          </div>
          <div class="room__bay" data-zone="read">
            <Shelf v-model="finished" title="Finished" mode="draggable" group="room" emoji="" compact />
            <button v-for="item in placedIn('read')" :key="item.uid" type="button" class="placed placed--shelf" :style="at(item)" @click.stop="pickItem(item.uid)">
              <span class="placed__pop" :data-decor-uid="item.uid"><DecorPiece :kind="item.id" /></span>
              <span v-if="selected === item.uid" class="placed__remove" @click.stop="unplace(item.uid)">Remove</span>
            </button>
          </div>
        </template>
        <template v-else>
          <div class="room__bay"><CoverRow title="Reading" :books="reading" /></div>
          <div class="room__bay"><CoverRow title="To read" :books="tbr" /></div>
          <div class="room__bay"><CoverRow title="Finished" :books="finished" /></div>
        </template>
      </div>
    </div>

    <div v-if="drag?.moved" class="drag-ghost" :style="{ left: `${drag.x}px`, top: `${drag.y}px` }">
      <DecorPiece :kind="drag.id" />
    </div>
    <div v-if="sparkle" :key="sparkle.key" class="spark" :style="{ left: `${sparkle.x}px`, top: `${sparkle.y}px` }" aria-hidden="true">
      <i v-for="n in 7" :key="n" />
    </div>
    <p v-if="notice" :key="notice.key" class="room-toast" :class="`room-toast--${notice.tone}`" role="status">
      {{ notice.text }}
    </p>

    <RoomDock />

    <QuoteOfDayModal v-if="quoteOpen" @close="quoteOpen = false" />
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

.home__far.is-dim { opacity: 0.78; }

.home__credits {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 4;
}

/* pets roam the whole strip of floor in front of the chair */
.home :deep(.life) {
  right: 18%;
  height: 100%;
}

/* shop pieces are drawn small; on this floor they stand next to a full-size armchair */
.placed--floor .placed__pop {
  zoom: 1.8;
}

.home :deep(.critter__flip) {
  zoom: 1.4;
}

.home__reading {
  position: absolute;
  inset: auto 15px 76px;
  z-index: 15;
}

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

.placed {
  position: absolute;
  z-index: 6;
  padding: 0;
  border: 0;
  background: none;
  transform: translateX(-50%);
  cursor: pointer;
}

.placed--floor { bottom: 6px; z-index: 5; pointer-events: auto; }
.placed--ledge { bottom: 0; z-index: 4; pointer-events: auto; }
.placed--shelf { bottom: 10px; z-index: 30; }

.placed--ledge :deep(.art) { height: calc(40 * var(--u)); }

.placed__pop {
  display: block;
  filter: drop-shadow(0 3px 1px rgba(63, 46, 36, 0.28));
}

.placed__remove {
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  margin-bottom: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  background: #b42318;
  color: #fff;
  font-size: 0.68rem;
  white-space: nowrap;
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

.room__close {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--rl-primary);
}

.room__bar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px 6px;
}

.room__tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.room__toggle {
  display: flex;
  padding: 2px;
  border-radius: 999px;
  background: rgba(255, 253, 249, 0.12);
}

.room__toggle-btn {
  padding: 4px 8px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 253, 249, 0.7);
  font-size: 0.72rem;
  cursor: pointer;
}

.room__toggle-btn.is-on {
  background: var(--rl-surface);
  color: var(--rl-primary);
}

.room__scroll {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  padding: 0 10px 8px;
}

.room__bay {
  position: relative;
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
}

.room__close :deep(.shelf__title),
.room__close :deep(.shelf__count),
.room__close :deep(.shelf__hint) {
  color: var(--rl-surface);
}

.room__close :deep(.shelf__plank) {
  height: 10px;
  background: linear-gradient(var(--wood), var(--wood-deep));
}

.room__back {
  padding: 4px 2px;
  border: 0;
  background: transparent;
  color: var(--rl-surface);
  font-family: var(--font-serif);
  font-size: 1rem;
  cursor: pointer;
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
