<script setup>
// Far: a straight-on room. Close: the bookshelf fills the phone. Scale and translate only.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useBookshelfStore } from '@/stores/bookshelf'
import { spineColor } from '@/lib/book.js'
import { fetchWeather } from '@/services/weather.js'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import Shelf from '@/components/Shelf.vue'
import CoverRow from '@/components/CoverRow.vue'
import DecorPiece from '@/components/DecorPiece.vue'
import CreditChip from '@/components/CreditChip.vue'
import RoomDock from '@/components/RoomDock.vue'
import FloorLife from '@/components/FloorLife.vue'
import RoomClock from '@/components/RoomClock.vue'
import { decorMeta, useDecor } from '@/composables/useDecor'

const MINI_WIDTHS = [18, 16, 20, 15, 19, 17, 16, 18, 17, 20, 15, 18, 16, 19, 17, 15]
const MINI_HEIGHTS = [46, 38, 50, 40, 48, 36, 44, 42, 39, 50, 41, 46, 37, 48, 40, 44]

const ZOOM_ORIGIN = '30% 60%'
const ZOOM_FROM = { scale: 0.42, x: -18, y: 52 }
const ZOOM_TO = { scale: 1, x: 0, y: 0 }
const ZOOM = { duration: 0.55, ease: 'power3.inOut', force3D: false }

const bookshelf = useBookshelfStore()

const reading = ref(bookshelf.books.filter((book) => book.status === 'reading'))
const tbr = ref(bookshelf.books.filter((book) => book.status === 'tbr'))
const finished = ref(bookshelf.books.filter((book) => book.status === 'read'))

const PREVIEW = [
  { id: 'sunny', label: 'Sunny' },
  { id: 'cloudy', label: 'Cloudy' },
  { id: 'rain', label: 'Rain' },
]

const RAIN_DROPS = Array.from({ length: 22 }, (_, index) => {
  const column = index % 11
  const pass = Math.floor(index / 11)
  return {
    left: `${3 + column * 8.8}%`,
    width: 3 + (index % 2),
    height: 12 + (index % 4) * 2,
    delay: `${-(pass * 0.95 + column * 0.13)}s`,
    duration: `${1.35 + (index % 5) * 0.16}s`,
  }
})

const weather = ref({ scene: 'cloudy', temperature: null })
const shelfView = ref('spines')
const preview = ref('sunny')
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

const closeLayer = ref(null)
const shelfButton = ref(null)
let zoomTween = null

const scene = computed(() => {
  if (preview.value) return preview.value
  const value = weather.value.scene
  return value === 'sunny' || value === 'rain' ? value : 'cloudy'
})

const temperature = computed(() =>
  typeof weather.value.temperature === 'number' ? weather.value.temperature : null,
)

const miniBooks = computed(() => bookshelf.books.slice(0, 16))
const miniTop = computed(() => miniBooks.value.slice(0, 8))
const miniBottom = computed(() => miniBooks.value.slice(8, 16))
const isNight = computed(() => (preview.value ? false : weather.value.isDay === false))

function miniStyle(book, index) {
  return {
    width: `${MINI_WIDTHS[index % MINI_WIDTHS.length]}px`,
    height: `${MINI_HEIGHTS[index % MINI_HEIGHTS.length]}px`,
    background: `linear-gradient(90deg, rgba(255,255,255,0.28), transparent 22%, rgba(0,0,0,0.16)), var(--${spineColor(book)})`,
  }
}

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
    const caseRect = room.value?.querySelector('.room__case-frame')?.getBoundingClientRect()
    const onCase = caseRect
      && clientX >= caseRect.left - 8
      && clientX <= caseRect.right + 8
      && clientY >= caseRect.top - 8
      && clientY <= caseRect.bottom + 10
    if (onCase) {
      flash(`${meta.name} can't go on a shelf.`, 'bad')
      return
    }
    const rect = room.value?.querySelector('.room__floor')?.getBoundingClientRect()
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
    : [...(room.value?.querySelectorAll('.room__row[data-zone]') || [])]
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

function syncShelves() {
  bookshelf.applyShelf(reading.value.map((book) => book.id), 'reading')
  bookshelf.applyShelf(tbr.value.map((book) => book.id), 'tbr')
  bookshelf.applyShelf(finished.value.map((book) => book.id), 'read')
}

function stopZoom() {
  zoomTween?.kill()
  zoomTween = null
}

async function openShelf() {
  if (isClose.value || placing.value || blockOpen || drag.value) return
  stopZoom()
  isClose.value = true
  await nextTick()
  const layer = closeLayer.value
  if (!layer) return
  if (prefersReducedMotion()) {
    gsap.set(layer, { ...ZOOM_TO, transformOrigin: ZOOM_ORIGIN })
    return
  }
  zoomTween = gsap.fromTo(layer, ZOOM_FROM, {
    ...ZOOM_TO,
    ...ZOOM,
    transformOrigin: ZOOM_ORIGIN,
    overwrite: 'auto',
  })
}

function closeShelf() {
  const layer = closeLayer.value
  if (!layer || prefersReducedMotion()) {
    stopZoom()
    isClose.value = false
    shelfButton.value?.focus()
    return
  }
  stopZoom()
  zoomTween = gsap.to(layer, {
    ...ZOOM_FROM,
    ...ZOOM,
    transformOrigin: ZOOM_ORIGIN,
    overwrite: 'auto',
    onComplete: () => {
      isClose.value = false
      shelfButton.value?.focus()
    },
  })
}

onMounted(async () => {
  weather.value = await fetchWeather()
})

onBeforeUnmount(() => {
  stopZoom()
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
})
</script>

<template>
  <section ref="room" class="room">
    <div class="room__far" :class="{ 'is-dim': isClose }">
      <RoomClock v-if="!isClose" class="room__clock" />
      <CreditChip v-if="!isClose" class="room__credits" />
      <div class="room__wall">
        <div class="room__case">
          <button
            ref="shelfButton"
            type="button"
            class="room__case-hit"
            aria-label="Open bookshelf"
            @click="openShelf"
          />
          <span class="room__case-frame">
            <span class="room__row" data-zone="case-top">
              <span class="room__spines" aria-hidden="true">
                <span
                  v-for="(book, index) in miniTop"
                  :key="book.id"
                  class="room__spine"
                  :style="miniStyle(book, index)"
                />
              </span>
              <span class="room__ledge">
                <button
                  v-for="item in placedIn('case-top')"
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
              </span>
              <span class="room__plank" aria-hidden="true" />
            </span>
            <span class="room__row" data-zone="case-low">
              <span class="room__spines" aria-hidden="true">
                <span
                  v-for="(book, index) in miniBottom"
                  :key="book.id"
                  class="room__spine"
                  :style="miniStyle(book, index + 8)"
                />
              </span>
              <span class="room__ledge">
                <button
                  v-for="item in placedIn('case-low')"
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
              </span>
              <span class="room__plank" aria-hidden="true" />
            </span>
          </span>
        </div>

        <div class="room__window">
          <div class="room__frame">
            <div class="room__pane" :class="[`room__pane--${scene}`, { 'is-night': isNight }]">
              <template v-if="scene === 'sunny'">
                <span class="room__sun" aria-hidden="true" />
                <span class="room__glare" aria-hidden="true" />
                <span
                  v-for="n in 3"
                  :key="`bird-${n}`"
                  class="room__bird"
                  :class="`room__bird--${n}`"
                  aria-hidden="true"
                >
                  <svg class="room__wing" viewBox="0 0 24 12">
                    <path
                      d="M1 9 Q7 1 12 6 Q17 1 23 9"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                    />
                  </svg>
                </span>
              </template>
              <template v-if="scene === 'cloudy' || scene === 'rain'">
                <span v-for="n in 4" :key="`cloud-${n}`" class="room__cloud" :class="`room__cloud--${n}`" aria-hidden="true" />
              </template>
              <template v-if="scene === 'rain'">
                <span
                  v-for="(drop, index) in RAIN_DROPS"
                  :key="`drop-${index}`"
                  class="room__drop"
                  :style="{
                    left: drop.left,
                    width: `${drop.width}px`,
                    height: `${drop.height}px`,
                    animationDelay: drop.delay,
                    animationDuration: drop.duration,
                  }"
                  aria-hidden="true"
                />
              </template>
            </div>
          </div>
          <div class="room__sill">
            <span v-if="temperature !== null" class="room__temp">{{ temperature }}°</span>
          </div>
        </div>

        <div class="room__preview" role="group" aria-label="Preview the window">
          <button
            v-for="item in PREVIEW"
            :key="item.id"
            type="button"
            class="room__preview-btn"
            :class="{ 'is-on': preview === item.id }"
            @click="preview = item.id"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="room__floor" aria-hidden="true" />

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
    </div>

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
              @click="shelfView = 'spines'"
            >
              Spines
            </button>
            <button
              type="button"
              class="room__toggle-btn"
              :class="{ 'is-on': shelfView === 'covers' }"
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
            <Shelf v-model="reading" title="Reading" mode="draggable" group="room" emoji="" compact @change="syncShelves" />
            <button v-for="item in placedIn('reading')" :key="item.uid" type="button" class="placed placed--shelf" :style="at(item)" @click.stop="pickItem(item.uid)">
              <span class="placed__pop" :data-decor-uid="item.uid"><DecorPiece :kind="item.id" /></span>
              <span v-if="selected === item.uid" class="placed__remove" @click.stop="unplace(item.uid)">Remove</span>
            </button>
          </div>
          <div class="room__bay" data-zone="tbr">
            <Shelf v-model="tbr" title="To read" mode="draggable" group="room" emoji="" compact @change="syncShelves" />
            <button v-for="item in placedIn('tbr')" :key="item.uid" type="button" class="placed placed--shelf" :style="at(item)" @click.stop="pickItem(item.uid)">
              <span class="placed__pop" :data-decor-uid="item.uid"><DecorPiece :kind="item.id" /></span>
              <span v-if="selected === item.uid" class="placed__remove" @click.stop="unplace(item.uid)">Remove</span>
            </button>
          </div>
          <div class="room__bay" data-zone="read">
            <Shelf v-model="finished" title="Finished" mode="draggable" group="room" emoji="" compact @change="syncShelves" />
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
    <p v-if="notice" :key="notice.key" class="toast" :class="`toast--${notice.tone}`" role="status">
      {{ notice.text }}
    </p>

    <RoomDock />
  </section>
</template>

<style scoped>
.room {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  position: relative;
  background: var(--wall);
}

.room__far {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: opacity 0.55s ease;
}

.room__far.is-dim { opacity: 0.78; }

.room__clock {
  position: absolute;
  top: 10px;
  left: 12px;
  z-index: 4;
}

.room__credits {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 4;
}

.room__wall {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  background: var(--wall);
}

.room__floor {
  flex: none;
  height: 22%;
  box-sizing: border-box;
  background: var(--floor);
  border-top: 1px solid rgba(28, 27, 25, 0.4);
}

.room__case {
  position: absolute;
  left: 6%;
  bottom: 0;
  width: 50%;
  margin: 0;
  padding: 0;
}

.room__case-hit {
  position: absolute;
  inset: 0;
  z-index: 1;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.room__case-frame {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 6px 0;
  background: #e3dcd0;
  border: 1px solid rgba(28, 27, 25, 0.22);
  border-bottom: none;
  pointer-events: none;
}

.room__row { display: flex; flex-direction: column; }

.room__spines {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-inline: 2px;
}

.room__spine {
  position: relative;
  flex: none;
  margin-right: -2px;
  overflow: hidden;
  border-radius: 1px 1px 0 0;
  box-shadow: inset -1px 0 rgba(28, 27, 25, 0.22);
}

.room__cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.room__spine::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  width: 2px;
  background: var(--page-edge);
}

.room__spine:last-child { margin-right: 0; }

.room__ledge {
  position: relative;
  z-index: 3;
  height: 0;
  pointer-events: none;
}

.room__plank {
  height: 5px;
  background: var(--wood);
  box-shadow: 0 1px 0 var(--wood-deep);
}

.room__window {
  position: absolute;
  top: 8%;
  right: 7%;
  bottom: 9%;
  width: 30%;
  display: flex;
  flex-direction: column;
}

.room__frame {
  flex: 1 1 auto;
  min-height: 0;
  border: 1px solid rgba(28, 27, 25, 0.32);
  padding: 4px;
}

.room__pane {
  position: relative;
  height: 100%;
  overflow: hidden;
  container-type: size;
}

.room__pane--sunny { background: linear-gradient(to bottom, #f3d7a6, #9ec4e0); }
.room__pane--cloudy { background: linear-gradient(to bottom, #c5d0da, #8ea0b0); }
.room__pane--rain { background: linear-gradient(to bottom, #5e6c78, #3e4a54); }
.room__pane.is-night { filter: brightness(0.72); }

.room__sun {
  position: absolute;
  top: 12%;
  left: 16%;
  width: 28%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #ffe7a3;
  box-shadow:
    0 0 10px 4px rgba(255, 226, 150, 0.95),
    0 0 28px 14px rgba(255, 196, 110, 0.55);
}

.room__glare {
  position: absolute;
  inset: -10%;
  background: linear-gradient(
    118deg,
    transparent 36%,
    rgba(255, 255, 255, 0.18) 46%,
    rgba(255, 255, 255, 0.55) 50%,
    rgba(255, 255, 255, 0.16) 54%,
    transparent 64%
  );
  animation: room-glare 6.5s ease-in-out infinite;
  pointer-events: none;
}

.room__bird {
  position: absolute;
  width: 16px;
  color: #2a2824;
  animation: room-fly 9s linear infinite;
}

.room__wing {
  display: block;
  width: 100%;
  height: auto;
  animation: room-flap 0.42s ease-in-out infinite;
  transform-origin: center;
}

.room__bird--1 { top: 28%; animation-duration: 8s; }
.room__bird--2 { top: 46%; animation-duration: 11s; animation-delay: -4s; }
.room__bird--3 { top: 18%; width: 12px; animation-duration: 13s; animation-delay: -7s; }

.room__cloud {
  position: absolute;
  left: 0;
  width: 46px;
  height: 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  animation: room-drift 22s linear infinite;
}

.room__cloud::before,
.room__cloud::after {
  content: '';
  position: absolute;
  background: inherit;
  border-radius: 50%;
}

.room__cloud::before {
  width: 18px;
  height: 18px;
  top: -10px;
  left: 8px;
}

.room__cloud::after {
  width: 14px;
  height: 14px;
  top: -7px;
  left: 22px;
}

.room__cloud--1 { top: 18%; animation-duration: 26s; }
.room__cloud--2 { top: 40%; width: 58px; animation-duration: 34s; animation-delay: -12s; }
.room__cloud--3 { top: 62%; width: 36px; animation-duration: 20s; animation-delay: -6s; }
.room__cloud--4 { top: 30%; width: 28px; opacity: 0.75; animation-duration: 30s; animation-delay: -18s; }

.room__pane--rain .room__cloud {
  background: rgba(210, 216, 222, 0.55);
}

.room__drop {
  position: absolute;
  top: 0;
  border-radius: 40% 40% 46% 46%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.35),
    rgba(226, 236, 242, 0.92) 55%,
    rgba(186, 208, 220, 0.45)
  );
  animation: room-drip 1.6s linear infinite;
}

.room__sill {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: none;
  height: 16px;
  margin-inline: -3px;
  padding-inline: 5px;
  background: var(--wood);
}

.room__temp {
  font-family: var(--font-serif);
  font-size: 0.7rem;
  line-height: 1;
  color: var(--paper);
}

.room__preview {
  position: absolute;
  right: 6%;
  bottom: 4%;
  display: flex;
  gap: 4px;
}

.room__preview-btn {
  padding: 3px 7px;
  border: 0;
  border-radius: 999px;
  background: rgba(28, 27, 25, 0.08);
  color: var(--ink);
  font-size: 0.62rem;
  cursor: pointer;
}

.room__preview-btn.is-on {
  background: var(--ink);
  color: var(--paper);
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

.placed--floor { bottom: 2px; z-index: 5; }
.placed--ledge { bottom: 0; z-index: 4; pointer-events: auto; }
.placed--shelf { bottom: 10px; z-index: 30; }

.placed--ledge :deep(.art) { height: 42px; }

.placed__pop {
  display: block;
  filter: drop-shadow(0 3px 1px rgba(28, 27, 25, 0.28));
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

.surface {
  position: absolute;
  z-index: 8;
  margin: 0;
  padding: 0;
  border: 1.5px dashed rgba(28, 27, 25, 0.5);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.16);
  cursor: pointer;
}

.surface--floor {
  left: 4%;
  right: 22%;
  bottom: 0;
  height: 22%;
  border-radius: 14px 14px 0 0;
}

.surface--ledge {
  left: 0;
  right: 0;
  bottom: 0;
  height: 48px;
  pointer-events: auto;
}

.surface--plank {
  left: 6px;
  right: 6px;
  bottom: 8px;
  height: 72px;
  border-color: rgba(246, 241, 232, 0.85);
  background: rgba(246, 241, 232, 0.12);
}

.surface__ghost {
  position: absolute;
  bottom: 0;
  transform: translateX(-50%);
  pointer-events: none;
  opacity: 0.84;
  transition: left 0.08s linear;
}

.surface--ledge :deep(.art),
.surface--plank :deep(.art) { height: 44px; }

.place-hint {
  position: absolute;
  top: 54px;
  left: 12px;
  right: 12px;
  z-index: 25;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 14px;
  background: rgba(247, 244, 238, 0.96);
  box-shadow: 0 10px 24px rgba(28, 27, 25, 0.16);
}

.place-hint p {
  flex: 1;
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.35;
}

.place-hint button {
  flex: none;
  padding: 6px 10px;
  border: 0;
  border-radius: 999px;
  background: var(--ink);
  color: var(--paper);
  font-size: 0.75rem;
}

.drag-ghost {
  position: fixed;
  z-index: 40;
  transform: translate(-50%, -100%);
  pointer-events: none;
  filter: drop-shadow(0 8px 8px rgba(28, 27, 25, 0.2));
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

.toast {
  position: absolute;
  top: 58px;
  right: 10px;
  z-index: 32;
  max-width: 54%;
  margin: 0;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(247, 244, 238, 0.96);
  box-shadow: 0 12px 28px rgba(28, 27, 25, 0.18);
  color: var(--ink);
  font-size: 0.75rem;
  line-height: 1.35;
  animation: toast-life 1.7s ease forwards;
}

.toast--bad {
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
  background: #2a2118;
  transform-origin: 30% 60%;
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
  background: rgba(246, 241, 232, 0.12);
}

.room__toggle-btn {
  padding: 4px 8px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(246, 241, 232, 0.7);
  font-size: 0.72rem;
  cursor: pointer;
}

.room__toggle-btn.is-on {
  background: #f6f1e8;
  color: #2a2118;
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
  color: #f6f1e8;
}

.room__close :deep(.shelf__plank) {
  height: 10px;
  background: linear-gradient(#6d4b32, #3f2918);
}

.room__back {
  padding: 4px 2px;
  border: 0;
  background: transparent;
  color: #f6f1e8;
  font-family: var(--font-serif);
  font-size: 1rem;
  cursor: pointer;
}

@keyframes room-glare {
  0%,
  100% { transform: translateX(-18%); opacity: 0.35; }
  50% { transform: translateX(12%); opacity: 0.85; }
}

@keyframes room-fly {
  from { transform: translate(-24px, 8px); }
  to { transform: translate(130px, -16px); }
}

@keyframes room-flap {
  0%,
  100% { transform: scaleY(1); }
  50% { transform: scaleY(0.35); }
}

@keyframes room-drift {
  from { transform: translateX(-70px); }
  to { transform: translateX(150px); }
}

@keyframes room-drip {
  0% { transform: translateY(-18px); opacity: 0; }
  8% { opacity: 0.95; }
  100% { transform: translateY(100cqh); opacity: 0.55; }
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
  .room__glare,
  .room__bird,
  .room__wing,
  .room__cloud,
  .room__drop,
  .spark i,
  .toast,
  .toast--bad,
  .surface__ghost {
    animation: none;
    transition: none;
  }
}
</style>
