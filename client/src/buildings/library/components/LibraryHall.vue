<!--
  Scaffolded with AI assistance — see AI_USAGE.md
  The library hall, side on: one wide pixel-art picture the reader moves along sideways, in the
  style of My Room. One bookcase per category; tapping a bookcase asks the page to open it,
  tapping the help desk asks the page to search, and tapping the book scanner asks it to scan.

  The hall is painted onto one canvas at art resolution (hall/paint.js) and stretched by a whole
  number of device pixels with hard edges, so it is never blurred. Each bookcase and the desk is a
  real, labelled button over the picture. If the device cannot draw on a canvas, the buttons and
  their name plates still stand on a plain wall.
-->
<template>
  <div ref="root" class="hall">
    <div
      ref="scroller"
      class="hall__scroller"
      role="region"
      tabindex="0"
      aria-label="The library hall. Swipe, drag or use the arrow keys to look around."
    >
      <div class="hall__stage" :style="stageStyle">
        <canvas v-if="drawable" ref="canvas" class="hall__canvas" :style="roomStyle" />

        <div class="hall__layer" :style="roomStyle">
          <button
            class="hall__hit"
            data-place="desk"
            type="button"
            aria-label="Help desk: search for any book"
            :style="boxStyle(desk)"
            @click="$emit('desk')"
          >
            <span class="hall__plate hall__plate--desk" aria-hidden="true">Help desk</span>
          </button>

          <button
            class="hall__hit"
            data-place="scanner"
            type="button"
            aria-haspopup="dialog"
            :aria-expanded="scanning"
            aria-label="Book scanner: scan a book cover"
            :style="boxStyle(scanner)"
            @click="$emit('scan')"
          >
            <span class="hall__plate" aria-hidden="true"><span class="hall__plate-emoji">📷</span>Scanner</span>
          </button>

          <button
            v-for="box in cases"
            :key="box.category"
            class="hall__hit"
            :data-place="box.category"
            type="button"
            aria-haspopup="dialog"
            :aria-expanded="active === box.category"
            :aria-label="`${box.meta.title} bookcase`"
            :style="boxStyle(box)"
            @click="$emit('open-shelf', box.category)"
          >
            <span class="hall__plate" aria-hidden="true">
              <span class="hall__plate-emoji">{{ box.meta.emoji }}</span>{{ box.meta.label }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- the weather outside, as in My Room: it lights the hall and shows through the windows -->
    <div class="hall__weather" role="img" :aria-label="weatherLabel">
      <span class="hall__weather-icon" :class="`is-${weatherIcon}`" aria-hidden="true" />
      <span v-if="weather.temperature !== null">{{ weather.temperature }}°</span>
    </div>

    <nav class="hall__places" aria-label="Places in the library">
      <button v-for="part in PARTS" :key="part.id" type="button" class="hall__place" @click="goTo(part)">
        {{ part.label }}
      </button>
    </nav>
  </div>
</template>

<script>
// How far along the hall the reader was when they left (art x at the left of the view), so
// coming back from a book's page finds the hall where it was. Kept for this visit only.
let lastLeft = 0
</script>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { categoryByKey } from '../categories.js'
import { HALL, PARTS, bookcases, deskBox, scannerBox } from '../hall/layout.js'
import { paintHall } from '../hall/paint.js'
import { createScroll } from '../hall/scroll.js'

const props = defineProps({
  // the key of the bookcase that is open, if any
  active: { type: String, default: null },
  // the book scanner is open
  scanning: { type: Boolean, default: false },
  // the live weather: { scene: 'sunny' | 'cloudy' | 'rain', night, temperature (°C or null) }
  weather: { type: Object, default: () => ({ scene: 'sunny', night: false, temperature: null }) },
})

// open-shelf: a bookcase was tapped (with its category key); desk: the help desk was tapped;
// scan: the book scanner was tapped
defineEmits(['open-shelf', 'desk', 'scan'])

// px kept clear along the bottom for the bar of places: spare height goes to floor there first
const BAR = 64

const root = ref(null)
const scroller = ref(null)
const canvas = ref(null)
const drawable = canDraw()

const cases = bookcases().map((box) => ({ ...box, meta: categoryByKey(box.category) }))
const desk = deskBox()
const scanner = scannerBox()

const SCENE_LABELS = { sunny: 'Sunny', cloudy: 'Cloudy', rain: 'Rain' }
const weatherLabel = computed(() => {
  const { scene, night, temperature } = props.weather
  const sky = `${SCENE_LABELS[scene] ?? 'Cloudy'}${night ? ' night' : ''}`
  return temperature === null ? `Weather outside: ${sky}` : `Weather outside: ${sky}, ${temperature} degrees`
})
const weatherIcon = computed(() => {
  const { scene, night } = props.weather
  if (scene === 'rain') return 'rain'
  if (night) return 'moon'
  return scene === 'cloudy' ? 'cloud' : 'sun'
})

// The size the hall is drawn at: `scale` device pixels per art pixel, `unit` CSS px per art pixel,
// `rows` art pixels tall (the hall, plus more floor below and more wall above), `above` the rows
// of wall above the hall as designed.
const size = ref({ scale: 1, unit: 1, rows: HALL.height, above: 0 })

const stageStyle = computed(() => ({ width: `${HALL.width * size.value.unit}px` }))
const roomStyle = computed(() => ({
  width: `${HALL.width * size.value.unit}px`,
  height: `${size.value.rows * size.value.unit}px`,
  '--unit': `${size.value.unit}px`,
}))

// a box in art pixels as CSS, inside the stage
function boxStyle(box) {
  const { unit, above } = size.value
  return {
    left: `${box.x * unit}px`,
    top: `${(above + box.y) * unit}px`,
    width: `${box.w * unit}px`,
    height: `${box.h * unit}px`,
  }
}

// The whole number of device pixels per art pixel at which the hall's height fits. Height to
// spare becomes more floor below the hall (clear of the bar of places), then more wall above.
function measure() {
  const el = root.value
  if (!el) return
  const ratio = window.devicePixelRatio || 1
  const tall = Math.round(el.clientHeight * ratio)
  const scale = Math.max(1, Math.floor(tall / HALL.height))
  const unit = scale / ratio
  const rows = Math.max(HALL.height, Math.floor(tall / scale))
  const spare = rows - HALL.height
  const below = Math.min(spare, Math.ceil(BAR / unit))
  const next = { scale, unit, rows, above: spare - below }
  const before = size.value
  if (next.unit === before.unit && next.rows === before.rows && next.above === before.above) return
  // keep the same part of the hall in the middle of the view
  const middle = (scroller.value.scrollLeft + scroller.value.clientWidth / 2) / before.unit
  size.value = next
  nextTick(() => {
    scroll?.glideTo(middle * next.unit - scroller.value.clientWidth / 2, { instant: true })
    paint()
  })
}

function paint() {
  const el = canvas.value
  if (!el) return
  el.width = HALL.width
  el.height = size.value.rows
  paintHall(el.getContext('2d'), { offset: size.value.above, weather: props.weather })
}

// a change in the weather repaints the windows and the light
watch(() => [props.weather.scene, props.weather.night], paint)

function canDraw() {
  try {
    return Boolean(document.createElement('canvas').getContext('2d'))
  } catch {
    return false
  }
}

// --- Moving along the hall ----------------------------------------------------------------------
let scroll = null

// the bar of places slides so that part of the hall is in the middle of the view
function goTo(part) {
  scroll.glideTo(part.at * size.value.unit - scroller.value.clientWidth / 2)
  scroller.value.focus({ preventScroll: true })
}

let resize = null
onMounted(async () => {
  scroll = createScroll(scroller.value)
  measure()
  resize = new ResizeObserver(measure)
  resize.observe(root.value)
  await nextTick()
  paint()
  if (lastLeft) scroll.glideTo(lastLeft * size.value.unit, { instant: true })
})

onBeforeUnmount(() => {
  if (scroller.value) lastLeft = scroller.value.scrollLeft / size.value.unit
  resize?.disconnect()
  scroll?.dispose()
})
</script>

<style scoped>
.hall {
  position: relative;
  height: 100%;
  overflow: hidden;
  /* the wall's colour, behind the hall's top edge on any screen */
  background: #efdcb8;
  user-select: none;
}

.hall__scroller {
  position: absolute;
  inset: 0;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  /* a swipe moves the hall sideways and never scrolls the page */
  touch-action: pan-x;
  outline: none;
  cursor: grab;
}

.hall__scroller::-webkit-scrollbar {
  display: none;
}

.hall__scroller.is-dragging {
  cursor: grabbing;
}

.hall__scroller:focus-visible {
  box-shadow: inset 0 0 0 3px var(--rl-primary);
}

.hall__stage {
  position: relative;
  height: 100%;
}

.hall__canvas,
.hall__layer {
  position: absolute;
  left: 0;
  bottom: 0;
}

.hall__canvas {
  display: block;
  image-rendering: pixelated;
}

/* the furniture is the picture; its button is an invisible box over it that glows when aimed at */
.hall__hit {
  position: absolute;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  transition: box-shadow 0.2s ease, background-color 0.2s ease;
}

.hall__hit:hover,
.hall__hit:focus-visible,
.hall__hit[aria-expanded='true'] {
  background-color: rgba(255, 246, 220, 0.16);
  box-shadow: 0 0 0 2px rgba(255, 246, 220, 0.85), 0 0 14px 4px rgba(255, 224, 138, 0.55);
  outline: none;
}

/* a bookcase's name plate, hung on its crown: a cream plate with the town's dark outline */
.hall__plate {
  position: absolute;
  top: 0;
  left: 50%;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  transform: translate(-50%, -60%);
  padding: 1px 6px;
  border: max(1px, var(--unit)) solid #1e1a24;
  background: #f9f3e6;
  box-shadow: inset 0 calc(-1 * max(1px, var(--unit))) 0 #e6dccb;
  font-family: var(--rl-font-body);
  font-size: 10px;
  font-weight: 800;
  line-height: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  color: #3b342a;
  pointer-events: none;
}

.hall__plate-emoji {
  font-size: 11px;
  letter-spacing: 0;
}

.hall__plate--desk {
  top: auto;
  bottom: 30%;
  transform: translate(-50%, 0);
  background: #d9b25f;
  box-shadow: inset 0 calc(-1 * max(1px, var(--unit))) 0 #b08a3c;
}

/* the weather chip: the town's chips (TownHud), under the search bar */
.hall__weather {
  position: absolute;
  top: 60px;
  left: 12px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 12px 0 8px;
  border: 1px solid var(--rl-line);
  border-radius: 999px;
  background: var(--rl-surface);
  box-shadow: 0 4px 14px rgba(63, 46, 36, 0.15);
  font-family: var(--font-serif);
  font-size: 14px;
  font-weight: 700;
  color: var(--rl-text);
  pointer-events: none;
}

/* a little pixel icon for the sky: sun, moon, cloud or rain (the same as My Room's) */
.hall__weather-icon {
  width: 18px;
  height: 18px;
  image-rendering: pixelated;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}

.hall__weather-icon.is-sun {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 9' shape-rendering='crispEdges'%3E%3Cpath fill='%23e3b04b' d='M3 0h3v1h1v1h1v1h1v3h-1v1h-1v1h-1v1h-3v-1h-1v-1h-1v-1h-1v-3h1v-1h1v-1h1z'/%3E%3Cpath fill='%23ffe08a' d='M3 1h3v1h1v1h1v3h-1v1h-1v1h-3v-1h-1v-1h-1v-3h1v-1h1z'/%3E%3C/svg%3E");
}

.hall__weather-icon.is-moon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 9' shape-rendering='crispEdges'%3E%3Cpath fill='%23c9c0ad' d='M3 0h3v1h-2v1h-1v5h1v1h3v1h-4v-1h-1v-1h-1v-5h1v-1h1z'/%3E%3Cpath fill='%23f4efe2' d='M3 2h1v5h-1zM4 1h2v1h-2zM4 7h4v1h-4z'/%3E%3C/svg%3E");
}

.hall__weather-icon.is-cloud {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 9' shape-rendering='crispEdges'%3E%3Cpath fill='%23b9b09d' d='M3 1h3v1h1v1h1v1h1v2h-9v-2h1v-1h1v-1h1z'/%3E%3Cpath fill='%23fdf7ec' d='M3 2h3v1h1v1h1v1h-7v-1h1v-1h1z'/%3E%3C/svg%3E");
}

.hall__weather-icon.is-rain {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 9' shape-rendering='crispEdges'%3E%3Cpath fill='%235a5a68' d='M3 0h3v1h1v1h1v1h1v2h-9v-2h1v-1h1v-1h1z'/%3E%3Cpath fill='%237fb6d9' d='M1 6h1v2h-1zM4 6h1v2h-1zM7 6h1v2h-1z'/%3E%3C/svg%3E");
}

/* the bar of places: the town's chips, white with a fine line */
.hall__places {
  position: absolute;
  bottom: 18px;
  left: 10px;
  right: 10px;
  z-index: 3;
  display: flex;
  gap: 6px;
  margin-bottom: -14px;
  padding: 2px 0 14px;
  overflow-x: auto;
  scrollbar-width: none;
}

.hall__places::-webkit-scrollbar {
  display: none;
}

.hall__place {
  flex: none;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid var(--rl-line);
  border-radius: 999px;
  background: var(--rl-surface);
  box-shadow: 0 4px 14px rgba(63, 46, 36, 0.12);
  font-size: 13px;
  font-weight: 700;
  color: var(--rl-text);
}

.hall__place:focus-visible {
  outline: 3px solid var(--library-accent, var(--rl-primary));
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .hall__hit {
    transition: none;
  }
}
</style>
