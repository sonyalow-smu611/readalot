<!--
  My Room, side on: one wide pixel-art picture of the room (a dollhouse with its front wall
  taken off) that the reader moves along sideways. Swipe, drag, scroll or use the arrow keys;
  the Places menu slides to each part of the room.

  The room is painted onto one canvas at art resolution from the layout (strip/layout.js) and
  stretched by a whole number of device pixels with hard edges, so it is never blurred. Everything
  you can tap is a real, labelled button over the picture:
    bookshelf  opens My Shelf, every book       a book    takes it off the shelf and opens it
    the book on the coffee table  the Currently Reading card
    corkboard  the Quote of the Day             window, clock   live weather and time (read-only)
  Furniture from the Shop is painted into the room too; its cats walk about on a canvas of their own.

  Until the room's pictures have loaded, and when they cannot (or the device cannot draw on a
  canvas), a still picture of the room stands in, with the Places menu opening things directly.
-->
<template>
  <div
    ref="root"
    class="strip"
    :class="{ 'is-ready': ready, 'is-locked': bookPhase !== 'closed' }"
    :style="{ '--room-wall': theme.wall }"
  >
    <div
      ref="scroller"
      class="strip__scroller"
      data-tour="room"
      role="region"
      tabindex="0"
      :aria-label="`${roomName}. Swipe, drag or use the arrow keys to look around.`"
      :data-cut="Math.max(0, -size.above)"
      @scroll.passive="onScroll"
    >
      <div class="strip__stage" :style="stageStyle">
        <!-- the room, standing on the bottom of the view: everything inside is placed in art
             pixels from its top left -->
        <div class="strip__room" :style="canvasStyle">
          <img v-if="!ready" class="strip__still" :src="stillArt" alt="" draggable="false" :style="stillStyle" />
          <!-- the view outside, behind the canvas: it shows through the window's glass -->
          <WindowView class="strip__outside" :style="boxStyle(glass)" :scene="weather.scene" :night="weather.night" />
          <canvas v-show="ready" ref="canvas" class="strip__canvas" data-testid="room-canvas" />
          <!-- the cats from the furniture library, drawn over the room as they walk about -->
          <canvas v-show="ready" ref="catCanvas" class="strip__canvas strip__pets" data-testid="room-cats" aria-hidden="true" />
          <!-- the weather outside, floating just above the window it's seen through -->
          <div class="strip__weather" role="img" :aria-label="windowLabel" :style="weatherStyle">
            <span class="strip__weather-icon" :class="`is-${weatherIcon}`" aria-hidden="true" />
            <span v-if="weather.temperature !== null">{{ weather.temperature }}°</span>
          </div>

          <div v-if="ready" class="strip__layer">
            <div class="strip__pin strip__window" data-tour="window" :style="boxStyle(spots.window)" />
            <div
              class="strip__pin"
              data-tour="clock"
              data-tour-mask="room:clock"
              role="img"
              :aria-label="`Singapore time ${time}`"
              :style="boxStyle(spots.clock)"
            />

            <button
              data-hit
              class="strip__pin strip__hit"
              data-tour="shelf"
              data-tour-mask="room:bookshelf"
              type="button"
              :aria-label="`Bookshelf, ${books.length} books`"
              :style="boxStyle(spots.bookshelf)"
              @click="tap('bookshelf')"
            />
            <!-- each row of the bookshelf, named on a plate on its board (and, for screen readers,
                 how many books it holds), then a button over each spine -->
            <template v-for="(row, index) in shelfRows" :key="row.status">
              <span class="strip__pin strip__plate" :style="plateStyle(rows[index])">
                {{ row.label }}<span class="visually-hidden"> shelf, {{ row.count }} {{ row.count === 1 ? "book" : "books" }}</span>
              </span>
              <button
                data-hit
                v-for="spine in row.spines"
                :key="spine.book.id"
                class="strip__pin strip__hit strip__book"
                :data-pin="`book:${spine.book.id}`"
                type="button"
                aria-haspopup="dialog"
                :aria-label="`${spine.book.title} by ${primaryAuthor(spine.book)}`"
                :style="boxStyle(spineBox(spine))"
                @click="tapBook(spine)"
                @pointerenter="liftBook(spine.book.id)"
                @pointerleave="lowerBook(spine.book.id)"
                @focus="liftBook(spine.book.id)"
                @blur="lowerBook(spine.book.id)"
              />
            </template>
            <div v-if="shelfNote" class="strip__pin strip__note" :style="noteStyle" @click.stop @pointerdown.stop>
              <template v-if="error">
                <strong>Shelf unavailable</strong>
                {{ error }}
                <button class="btn btn-sm btn-outline-primary" type="button" @click="$emit('retry')">Retry</button>
              </template>
              <strong v-else-if="!editable">No books on these shelves yet</strong>
              <template v-else>
                <strong>Add your first book</strong>
                <RouterLink class="btn btn-secondary btn-sm" to="/discover">Discover books</RouterLink>
                <RouterLink class="btn btn-secondary btn-sm" to="/scan">Scan a cover</RouterLink>
              </template>
            </div>

            <button
              data-hit
              class="strip__pin strip__hit chair__book"
              data-tour="chair"
              type="button"
              aria-haspopup="dialog"
              :aria-expanded="readingOpen"
              :aria-label="chairLabel"
              :style="boxStyle(spots.chair)"
              @click="tap('chair')"
            >
              <span class="strip__tip">{{ currentBook ? 'Currently reading' : 'Nothing on the go' }}</span>
            </button>
            <button
              data-hit
              class="strip__pin strip__hit"
              data-tour="quote"
              data-tour-mask="room:corkboard"
              type="button"
              aria-haspopup="dialog"
              :aria-label="boardLabel"
              :style="boxStyle(spots.corkboard)"
              @click="tap('corkboard')"
            >
              <span class="strip__tip">{{ boardLabel }}</span>
            </button>

            <!-- the lamps: a tap switches each one off or on -->
            <button
              data-hit
              v-for="lamp in LAMPS"
              :key="lamp.id"
              type="button"
              class="strip__pin strip__hit placed-art strip__lamp"
              :aria-label="lamp.name"
              :aria-pressed="lamps[lamp.id] !== false"
              :style="boxStyle(lampBoxes[lamp.id])"
              @click="switchLamp(lamp.id)"
            />

            <!-- the furniture placed in the room: drawn in the room itself, each with an invisible
                 button over it (a cat's follows it as it walks) -->
            <template v-for="item in placed" :key="item.uid">
              <button
                data-hit
                v-if="artOf(item)"
                type="button"
                class="strip__pin strip__hit placed-art"
                :class="{
                  'is-carried': carrying?.uid === item.uid,
                  'is-editable': showEditable && selected !== item.uid,
                  'is-selected': selected === item.uid,
                }"
                :aria-label="decorName(item)"
                :aria-pressed="editable ? selected === item.uid : undefined"
                :data-selected="selected === item.uid || undefined"
                :style="boxStyle(artOf(item).box)"
                @pointerdown="holdItem($event, item)"
                @click="pickItem(item.uid)"
              >
                <span v-if="showEditable && selected !== item.uid" class="placed__pencil" aria-hidden="true">✎</span>
                <template v-if="selected === item.uid">
                  <span
                    v-if="standsAnywhere(item.zone)"
                    data-button
                    role="button"
                    tabindex="0"
                    class="placed__badge placed__move"
                    :aria-label="`Move ${decorName(item)}`"
                    @pointerdown.stop
                    @click.stop="startMove(item)"
                    @keydown.enter.space.stop.prevent="startMove(item)"
                  >✥</span>
                  <span
                    data-button
                    role="button"
                    tabindex="0"
                    class="placed__badge placed__remove"
                    :aria-label="`Remove ${decorName(item)}`"
                    @pointerdown.stop
                    @click.stop="askRemove(item)"
                    @keydown.enter.space.stop.prevent="askRemove(item)"
                  >×</span>
                </template>
              </button>
              <button
                data-hit
                v-else-if="isPet(item)"
                type="button"
                class="strip__pin placed-cat"
                :class="{ 'is-selected': selected === item.uid }"
                :data-pet="item.uid"
                :aria-label="decorName(item)"
                :aria-pressed="editable ? selected === item.uid : undefined"
                :data-selected="selected === item.uid || undefined"
                :style="catStyle(item)"
                @click="pickItem(item.uid)"
              >
                <span
                  v-if="selected === item.uid"
                  data-button
                  role="button"
                  tabindex="0"
                  class="placed__badge placed__remove"
                  :aria-label="`Remove ${decorName(item)}`"
                  @pointerdown.stop
                  @click.stop="askRemove(item)"
                  @keydown.enter.space.stop.prevent="askRemove(item)"
                >×</span>
              </button>
            </template>

            <!-- while placing a piece (or dragging one in from the inventory): where it can go,
                 lit. A chair, curtains or bedding light the piece they take the place of. -->
            <div
              v-for="target in placeTargets"
              :key="target.key"
              class="strip__pin strip__target"
              :class="{ 'is-swap': target.swap }"
              :data-target="target.key"
              :style="boxStyle(target.box)"
            >
              <span v-if="target.label" class="strip__target-label">{{ target.label }}</span>
            </div>

            <!-- while placing a piece: a tap anywhere in the room puts it there (the keyboard has
                 "Place in the middle" by the prompt) -->
            <div v-if="editable && placing" class="strip__pin strip__drop" @click="tapPlace" />
          </div>
        </div>
      </div>
    </div>

    <Transition name="strip-hint">
      <p v-if="hinting" class="strip__hint" aria-hidden="true">{{ hintText }}</p>
    </Transition>

    <!-- while a book comes off the shelf: a tap skips to it open, and nothing else in the room
         can be tapped or moved -->
    <button
      data-hit
      v-if="bookPhase === 'opening'"
      class="strip__skip"
      type="button"
      aria-label="Skip to the open book"
      @click="flight.skip()"
      @pointerdown.stop
      @wheel.stop.prevent
    />

    <p v-if="editable && placing" class="strip__placing" role="status">
      <span class="strip__placing-text">{{ placingPrompt }}</span>
      <button type="button" class="btn btn-primary btn-sm" @click="placeInView">Place in the middle</button>
      <button type="button" class="btn btn-secondary btn-sm" @click="cancelPlace">Cancel</button>
    </p>

    <!-- moving a placed piece from its card: arrow buttons (or the arrow keys), Done, Cancel -->
    <div v-if="moving" class="strip__placing strip__moving" role="group" :aria-label="`Moving ${moving.name}`">
      <span class="strip__placing-text">Moving {{ moving.name }}</span>
      <button type="button" class="btn btn-secondary btn-icon" aria-label="Move left" @click="nudge(-1, 0)">←</button>
      <template v-if="moving.zone === 'wall'">
        <button type="button" class="btn btn-secondary btn-icon" aria-label="Move up" @click="nudge(0, -1)">↑</button>
        <button type="button" class="btn btn-secondary btn-icon" aria-label="Move down" @click="nudge(0, 1)">↓</button>
      </template>
      <button type="button" class="btn btn-secondary btn-icon" aria-label="Move right" @click="nudge(1, 0)">→</button>
      <button type="button" class="btn btn-primary btn-sm" @click="stopMove(true)">Done</button>
      <button type="button" class="btn btn-secondary btn-sm" @click="stopMove(false)">Cancel</button>
    </div>

    <!-- a picked piece (or one being dragged): what can be done with it -->
    <p v-if="pickedHint" class="strip__placing strip__picked" role="status">{{ pickedHint }}</p>

    <PlacesMenu class="strip__menu" :places="PARTS" @go="goTo" />

    <!-- the × on a picked piece asks first -->
    <RemovePieceModal v-if="removing" :name="decorName(removing)" @close="removing = null" @remove="confirmRemove" />
  </div>
</template>

<script>
// How far along the room was when the reader left it (art x at the left of the view), so coming
// back (from My Shelf, a book's page) finds the room where it was. Kept for this visit only.
let lastLeft = 0
</script>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, toRef, watch } from 'vue'
import stillArt from '@/buildings/house/assets/room-still.png'
import WindowView from '@/buildings/house/components/WindowView.vue'
import PlacesMenu from '@/buildings/house/components/PlacesMenu.vue'
import RemovePieceModal from '@/buildings/house/components/RemovePieceModal.vue'
import { decorMeta, useDecor } from '@/composables/useDecor'
import { furnitureSprite } from '@/buildings/house/furniture.js'
import { primaryAuthor } from '@/lib/book'
import { prefersReducedMotion } from '@/lib/motion'
import { fetchSingaporeTime } from '@/services/time.js'
import { LAMPS } from '@/buildings/house/lamps.js'
import { PARTS, PIECES, ROOM, SLOTS, SPRITES, WALK, boxOf, glassOf, hotspots, shelfRows as rowBoxes } from '@/buildings/house/strip/layout.js'
import { layoutBooks, spineBox } from '@/buildings/house/strip/books.js'
import { paintCats, paintRoom, spriteIds } from '@/buildings/house/strip/paint.js'
import { createScroll } from '@/buildings/house/strip/scroll.js'
import { createFlight } from '@/buildings/house/strip/flight.js'
import { FLOOR, SURFACES, WALL, boxAt, landingFor, nudged, wallObstacles } from '@/buildings/house/strip/placement.js'

const ZONE_NAMES = {
  seat: 'on the window seat',
  nightstand: 'on the nightstand',
  'side-table': 'on the side table',
  room: 'on the floor',
}
const SCENE_LABELS = { sunny: 'Clear', cloudy: 'Cloudy', rain: 'Rain' }
// the most plain wall that may be cut off the top of the room to fill a wide window, in art
// pixels: the bunting hangs below it
const CUT = 24
const PET_SPEED = 26 // art pixels a second
// a cat's steps: how long each frame of its walk shows, in seconds; how often it falls asleep
// when it stops, and for how long it rests (seconds)
const CAT_STEP = 0.2
const CAT_NAPS = 0.25
const CAT_REST = { sit: [1, 4], sleep: [6, 10] }
// the box a cat's button covers, in art pixels
const CAT_BOX = { w: 28, h: 18 }
const HINT_KEY = 'readalot.roomHint'
// px kept clear along the bottom for the round room menu button: spare height goes to floor there
// first
const BAR = 64
const HINT_MS = 4500

const props = defineProps({
  books: { type: Array, default: () => [] },
  currentBook: { type: Object, default: null },
  // { scene: 'sunny' | 'cloudy' | 'rain', night, temperature }
  weather: { type: Object, required: true },
  loading: Boolean,
  error: { type: String, default: '' },
  // the Currently Reading card opened from the coffee table is showing
  readingOpen: Boolean,
  // the furniture standing in the room: [{ uid, id, zone, x, at }] (`at`, the point it stands on,
  // for a piece that can stand anywhere; without it, a piece stands on the spot in its zone nearest x)
  furniture: { type: Array, default: () => [] },
  // the reader's own room: pieces can be put on spots, picked and taken down
  editable: { type: Boolean, default: false },
  // whose room it is, for screen readers ("Your room", "Emma's room")
  roomName: { type: String, default: 'Your room' },
  // what the corkboard opens: the Quote of the Day, or a visited reader's notice board
  boardLabel: { type: String, default: 'Quote of the day' },
  // how many visitors' notes are on the corkboard (up to eight are drawn on it, then a "+N" tag)
  notes: { type: Number, default: 0 },
  // how many of those are new since the reader last opened their board: they're highlighted
  newNotes: { type: Number, default: 0 },
  // the house's look (from themes.js): its wall and floor colours and its own curtains, bedding,
  // lamps and rug
  theme: { type: Object, required: true },
  // each lamp on or off: { 'floor-lamp': true, … }
  lamps: { type: Object, default: () => ({}) },
})
// open-book: the Currently Reading card; pick-book: a book tapped on the shelf; open-shelf: the
// bookshelf itself tapped (or asked for before the room has loaded), for My Shelf
// toggle-lamp: a lamp tapped, with its id
const emit = defineEmits(['open-book', 'pick-book', 'open-shelf', 'quote', 'retry', 'toggle-lamp'])

const { placing, placingMeta, selected, drag, inventoryOpen, menuOpen, pick, unplace, placeOn, moveTo, saveRoom, cancelPlace, flash } = useDecor()
const placed = toRef(props, 'furniture')

const root = ref(null)
const scroller = ref(null)
const canvas = ref(null)
const catCanvas = ref(null)
const ready = ref(false)
const time = ref('--:--')
// a book taken off the shelf: 'closed' | 'opening' | 'open' | 'closing'
const bookPhase = ref('closed')
const hinting = ref(false)
const hintText = window.matchMedia?.('(pointer: fine)').matches ? 'Drag or scroll to look around' : 'Swipe to look around'

// the size the room is drawn at: `scale` device pixels per art pixel, `unit` CSS px per art
// pixel, `rows` art pixels tall (the room, more floor below it, more wall above), `above` the
// rows of wall above the room as designed
const size = ref({ scale: 1, unit: 1, rows: ROOM.height, above: 0 })
const offset = computed(() => size.value.above)

const glass = glassOf()
// the box each lamp fills, for its switch
const lampBoxes = Object.fromEntries(LAMPS.map(({ id }) => [id, boxOf(PIECES.find((piece) => piece.id === id))]))
// the top of the curtain rod: the weather chip sits just above it, centred on the window
const rod = PIECES.find((piece) => piece.sprite === 'curtain-rod')
const ABOVE_ROD = rod.y - SPRITES['curtain-rod'].h - 3
const spots = hotspots()
const rows = rowBoxes()
const shelf = computed(() => layoutBooks(rows, props.books))
const shelfRows = computed(() =>
  shelf.value.rows.map((row) => ({ ...row, spines: shelf.value.spines.filter((spine) => spine.status === row.status) })),
)
// the book pointed at, and the one off the shelf
const lifted = ref(null)
const out = ref(null)

const windowLabel = computed(() => {
  const sky = `${SCENE_LABELS[props.weather.scene] ?? 'Cloudy'}${props.weather.night ? ' night' : ''}`
  return props.weather.temperature === null ? `Window view: ${sky}` : `Window view: ${sky}, ${props.weather.temperature} degrees`
})
const weatherIcon = computed(() => (props.weather.scene === 'rain' ? 'rain' : props.weather.night ? 'moon' : props.weather.scene === 'cloudy' ? 'cloud' : 'sun'))
const chairLabel = computed(() =>
  props.currentBook ? `Currently reading ${props.currentBook.title}. Show details` : 'No current book. Show details',
)
const shelfNote = computed(() => !props.loading && (props.error || !props.books.length))

// --- Sizes and positions ----------------------------------------------------------------------
const stageStyle = computed(() => ({ width: `${ROOM.width * size.value.unit}px` }))
const canvasStyle = computed(() => ({
  width: `${ROOM.width * size.value.unit}px`,
  height: `${size.value.rows * size.value.unit}px`,
}))
const stillStyle = computed(() => ({
  height: `${ROOM.height * size.value.unit}px`,
  bottom: `${(size.value.rows - size.value.above - ROOM.height) * size.value.unit}px`,
}))

// a box in art pixels (room coordinates) as CSS, inside the stage
function boxStyle(box) {
  if (!box) return { display: 'none' }
  const { unit } = size.value
  return {
    left: `${box.x * unit}px`,
    top: `${(offset.value + box.y) * unit}px`,
    width: `${box.w * unit}px`,
    height: `${box.h * unit}px`,
  }
}

function pointStyle(point) {
  const { unit } = size.value
  return { left: `${point.x * unit}px`, top: `${(offset.value + point.y) * unit}px` }
}

const weatherStyle = computed(() => pointStyle({ x: glass.x + glass.w / 2, y: ABOVE_ROD }))

// a row's name plate, centred on the board the row stands on (its box in the layout), at its
// left end, clear of the row below
const BOARD = 5 // art pixels thick
function plateStyle(row) {
  const { unit } = size.value
  return {
    left: `${(row.x + 2) * unit}px`,
    top: `${(offset.value + row.base + BOARD / 2) * unit}px`,
    '--unit': `${unit}px`,
  }
}

const noteStyle = computed(() => {
  const row = rows[1]
  return boxStyle({ x: row.x + 4, y: rows[0].y, w: row.w - 8, h: rows[2].base - rows[0].y })
})

// Works out the whole number of device pixels per art pixel at which the room's height fits.
// Height to spare becomes more floor below the room (clear of the room menu button), then more wall.
// On a wide window where the room would come out narrower than the window, it's drawn one size
// up instead if that only cuts plain wall (above the bunting) off the top; otherwise it's centred.
function measure() {
  const el = root.value
  if (!el) return
  const ratio = window.devicePixelRatio || 1
  const tall = Math.round(el.clientHeight * ratio)
  const wide = Math.round(el.clientWidth * ratio)
  let scale = Math.max(1, Math.floor(tall / ROOM.height))
  if (scale * ROOM.width < wide && (scale + 1) * (ROOM.height - CUT) <= tall) scale += 1
  const unit = scale / ratio
  const rows = Math.floor(tall / scale)
  const spare = rows - ROOM.height
  const below = spare < 0 ? 0 : Math.min(spare, Math.ceil(BAR / unit))
  const next = { scale, unit, rows: Math.max(rows, 0), above: spare - below }
  const before = size.value
  if (next.scale === before.scale && next.rows === before.rows && next.unit === before.unit && next.above === before.above) return
  // keep the same part of the room in the middle of the view (as it was before the window
  // changed size: by now the view may already be narrower or wider)
  const middle = viewMiddle ?? (scroller.value.scrollLeft + scroller.value.clientWidth / 2) / before.unit
  size.value = next
  nextTick(() => {
    scroll?.glideTo(middle * next.unit - scroller.value.clientWidth / 2, { instant: true })
    paint()
  })
}

// --- Painting ---------------------------------------------------------------------------------
const images = shallowRef({})
let painting = 0
let lastMinute = -1

function paint() {
  if (painting) return
  painting = requestAnimationFrame(() => {
    painting = 0
    const el = canvas.value
    if (!el || !ready.value) return
    if (el.width !== ROOM.width) el.width = ROOM.width
    if (el.height !== size.value.rows) el.height = size.value.rows
    paintRoom(el.getContext('2d'), {
      images: images.value,
      offset: offset.value,
      weather: props.weather,
      spines: shelf.value.spines,
      lifted: lifted.value,
      out: out.value,
      time: readClock(),
      extras: extras.value,
      notes: props.notes,
      newNotes: props.newNotes,
      theme: props.theme,
      lamps: props.lamps,
    })
  })
}

// every sprite loads before the room shows, so nothing pops in; false when any could not
async function loadSprites() {
  const loaded = {}
  let failed = false
  await Promise.all(
    spriteIds().map(
      (id) =>
        new Promise((resolve) => {
          const image = new Image()
          image.onload = () => {
            loaded[id] = image
            resolve()
          }
          image.onerror = () => {
            failed = true
            resolve()
          }
          image.src = `/room/strip/${id}.png`
        }),
    ),
  )
  images.value = loaded
  return !failed
}

function canDraw() {
  try {
    return Boolean(document.createElement('canvas').getContext('2d'))
  } catch {
    return false
  }
}

// --- Furniture and cats -----------------------------------------------------------------------
function decorName(item) {
  return decorMeta(item.id)?.name || 'Decoration'
}

// a cat: it walks about, drawn from its own sheet of frames
function isPet(item) {
  return Boolean(decorMeta(item.id)?.pet)
}

// where a spot is, said the way the room says it ("on the side table", "on the wall by the window")
function slotName(slot) {
  return slot.name ?? ZONE_NAMES[slot.zone]
}

// the wall, the floor and the small surfaces: a piece there can stand anywhere it fits
function standsAnywhere(zone) {
  return zone === 'wall' || zone === 'room' || SURFACES.some((surface) => surface.zone === zone)
}

// What a piece moving in the room (or `uid`, being moved) must keep clear of (see placement.js):
// the other pieces standing anywhere (not cats, which walk about), and on the wall the room's own
// pieces, with a new chair (curtains, bedding) in place of the room's own.
function rulesFor(uid) {
  const others = placed.value
    .filter((item) => item.uid !== uid && !isPet(item) && standsAnywhere(item.zone))
    .map((item) => artOf(item)?.box)
    .filter(Boolean)
  const standIns = placed.value.flatMap((item) => swapsOf(item) ?? [artOf(item)]).filter((art) => art?.replaces)
  return { others, obstacles: wallObstacles(standIns.map((art) => art.replaces), standIns.map((art) => art.box)) }
}

// the spot a placed piece stands on: the slot in its zone nearest its x
function slotOf(item) {
  const slots = SLOTS.filter((slot) => slot.zone === item.zone)
  return slots.reduce((best, slot) => (!best || Math.abs(slot.x - item.x) < Math.abs(best.x - item.x) ? slot : best), null)
}

// A piece that takes the place of the room's own (curtains, bedding): each of its sprites, drawn
// where the piece it replaces stands, in that piece's layer. null for any other piece.
function swapsOf(item) {
  const swaps = decorMeta(item.id)?.swaps
  if (!swaps) return null
  return Object.entries(swaps).map(([id, sprite]) => {
    const piece = PIECES.find((own) => own.id === id)
    const { w, h } = SPRITES[sprite]
    return { sprite, box: { x: piece.x, y: piece.y - h, w, h }, layer: piece.layer, replaces: id }
  })
}

// A placed piece: its sprite, the box it fills in the room (hung centred on a wall spot, or
// standing on its spot) and the layer it's drawn in. null for cats, which walk about. A piece
// that takes the place of the room's own is the first of them (its button covers that one).
function artOf(item) {
  const swaps = swapsOf(item)
  if (swaps) return swaps[0]
  const sprite = !isPet(item) && furnitureSprite(item.id)
  if (!sprite) return null
  const wall = item.zone === 'wall'
  let box
  if (item.at) box = boxAt(sprite, item.zone, item.at)
  else {
    const slot = slotOf(item)
    if (!slot) return null
    box = boxAt(sprite, item.zone, wall ? slot.at : { x: slot.at.x, y: slot.base ?? slot.at.y })
  }
  // the floor is in front of the furniture; the small surfaces are on top of it; a reading chair
  // stands in for the armchair
  const layer = wall ? 'wall' : item.zone === 'room' ? 'front' : 'furniture'
  return { sprite, box, layer, replaces: item.zone === 'chair' ? 'armchair' : null }
}

// what the room paints for them, after its own pieces in each layer
const extras = computed(() =>
  placed.value
    .flatMap((item) => swapsOf(item) ?? [artOf(item)])
    .filter(Boolean)
    .map(({ sprite, box, layer, replaces }) => ({ sprite, x: box.x, y: box.y + box.h, layer, replaces })),
)

const pets = new Map()

function between([low, high]) {
  return low + Math.random() * (high - low)
}

// where a pet is and what it's doing: it starts where it was put down (or, put down before it was
// put anywhere in particular, somewhere along the floor), sitting
function petState(uid) {
  if (!pets.has(uid)) {
    const start = placed.value.find((item) => item.uid === uid)?.at?.x
    const x = start ?? WALK.from + Math.random() * (WALK.to - WALK.from)
    pets.set(uid, { x, target: x, wait: Math.random() * 2, face: 'right', mode: 'sit', clock: 0 })
  }
  return pets.get(uid)
}

function catStyle(item) {
  const { unit } = size.value
  return {
    ...pointStyle({ x: petState(item.uid).x, y: WALK.y }),
    width: `${CAT_BOX.w * unit}px`,
    height: `${CAT_BOX.h * unit}px`,
  }
}

// Each pet walks to a spot along the floor, then stops a while: sitting, or now and then
// curled up asleep for longer. Then it picks the next spot.
function walkPets(seconds) {
  const live = new Set(placed.value.filter(isPet).map((item) => item.uid))
  for (const uid of pets.keys()) if (!live.has(uid)) pets.delete(uid)
  const span = WALK.to - WALK.from
  for (const uid of live) {
    const pet = petState(uid)
    pet.clock += seconds
    if (pet.wait > 0) pet.wait -= seconds
    else if (Math.abs(pet.target - pet.x) < 1) {
      pet.target = WALK.from + Math.random() * span
      pet.mode = Math.random() < CAT_NAPS ? 'sleep' : 'sit'
      pet.wait = between(CAT_REST[pet.mode])
    } else {
      const step = Math.sign(pet.target - pet.x) * Math.min(Math.abs(pet.target - pet.x), PET_SPEED * seconds)
      pet.x += step
      pet.face = step > 0 ? 'right' : 'left'
      pet.mode = 'walk'
    }
    const el = root.value?.querySelector(`[data-pet="${uid}"]`)
    if (el) {
      el.style.left = `${pet.x * size.value.unit}px`
      el.dataset.face = pet.face
    }
  }
}

// The cats' canvas, the same size as the room's: each cat's frame for what it's doing (a walk
// steps between two frames).
let catsShown = false
function drawCats() {
  const el = catCanvas.value
  if (!el || !ready.value) return
  const cats = placed.value.filter(isPet)
  if (!cats.length && !catsShown) return
  if (el.width !== ROOM.width) el.width = ROOM.width
  if (el.height !== size.value.rows) el.height = size.value.rows
  paintCats(el.getContext('2d'), {
    images: images.value,
    offset: offset.value,
    weather: props.weather,
    cats: cats.map((item) => {
      const pet = petState(item.uid)
      const frame = pet.mode === 'walk' ? (Math.floor(pet.clock / CAT_STEP) % 2 ? 'step' : 'walk') : pet.mode
      return { sprite: furnitureSprite(item.id), frame, x: pet.x, face: pet.face }
    }),
  })
  catsShown = cats.length > 0
}

let frame = 0
let lastTime = 0
function loop(now) {
  frame = requestAnimationFrame(loop)
  const seconds = Math.min(0.1, (now - lastTime) / 1000)
  lastTime = now
  if (document.hidden) return
  // with reduced motion the pets stay where they are (sitting), but are still drawn
  if (!prefersReducedMotion()) walkPets(seconds)
  drawCats()
}

// The piece picked to place, put down at screen (x, y), or as near as it fits.
function putPlacing(x, y) {
  const meta = placingMeta.value
  const spot = dropAt(placing.value, x, y)
  if (!spot) return
  if (spot.miss) flash(spot.miss, 'bad')
  else flash(`${meta.name} ${meta.plural ? 'are' : 'is'} ${spot.name}.`, 'ok')
}

function tapPlace(event) {
  if (scroll?.wasDrag()) return
  putPlacing(event.clientX, event.clientY)
}

// the middle of the room in view
function placeInView() {
  const view = scroller.value.getBoundingClientRect()
  putPlacing(view.left + view.width / 2, view.top + view.height / 2)
}

// what placing a piece on a slot records: where along its zone, and the point, when it can stand anywhere
function spotOf(slot) {
  return standsAnywhere(slot.zone) ? { x: slot.x, at: slot.at } : { x: slot.x }
}

function switchLamp(id) {
  if (scroll?.wasDrag()) return
  emit('toggle-lamp', id)
}

function pickItem(uid) {
  if (!props.editable || scroll?.wasDrag() || justCarried) return
  pick(uid)
}

// --- A picked piece: highlighted, with a × to take it out (and ✥ to move it) ----------------
// The × asks first (RemovePieceModal). A tap anywhere but the picked piece, or Escape, lets it go.
// the piece being asked about: a placed item, or null
const removing = ref(null)

// the line at the top while a piece is picked or carried
const pickedHint = computed(() => {
  if (!props.editable || placing.value || moving.value) return ''
  const carried = carrying.value && placed.value.find((one) => one.uid === carrying.value.uid)
  if (carried) return `Let go to put ${decorName(carried)} down`
  const item = selected.value != null && placed.value.find((one) => one.uid === selected.value)
  if (!item) return ''
  if (!isPet(item) && standsAnywhere(item.zone)) return `Drag ${decorName(item)} to move it, or tap × to remove it`
  return `Tap × to put ${decorName(item)} back in your inventory`
})

function askRemove(item) {
  removing.value = item
}

function confirmRemove() {
  const item = removing.value
  removing.value = null
  if (item) unplace(item.uid)
}

function onPickedOutside(event) {
  // the dialog answers for itself; a tap on the picked piece is its own click (it lets go)
  if (removing.value || event.target.closest?.('[data-selected]')) return
  selected.value = null
}

function onPickedKey(event) {
  if (event.key !== 'Escape' || removing.value) return
  selected.value = null
}

function stopWatchingPicked() {
  window.removeEventListener('pointerdown', onPickedOutside)
  window.removeEventListener('keydown', onPickedKey)
}

watch(selected, (uid) => {
  stopWatchingPicked()
  if (uid == null || !props.editable) return
  window.addEventListener('pointerdown', onPickedOutside)
  window.addEventListener('keydown', onPickedKey)
})

// where a piece standing anywhere is, said the way the room says it ("on the wall", "on the side table")
function zoneName(zone) {
  return zone === 'wall' ? 'on the wall' : ZONE_NAMES[zone]
}

// the art point under screen point (x, y)
function artPoint(x, y) {
  const stage = scroller.value.firstElementChild.getBoundingClientRect()
  const { unit } = size.value
  return { x: (x - stage.left) / unit, y: (y - stage.top) / unit - offset.value }
}

// The room's own pieces a Shop chair, curtains or bedding takes the place of, and what the room
// says when one is let go anywhere else.
const SWAP_INTO = {
  chair: { pieces: ['armchair'], miss: 'Put the chair on the armchair' },
  curtains: { pieces: ['window', 'curtain-left', 'curtain-right'], miss: 'Hang the curtains at the window' },
  bed: { pieces: ['bed'], miss: 'Put the bedding on the bed' },
}
// how far off those pieces one may be let go and still swap in, in art px
const SWAP_REACH = 24
// what the lit piece is called, and the part of the room (PARTS) the view slides to
const SWAP_TARGETS = {
  chair: { name: 'the armchair', part: 'chair' },
  curtains: { name: 'the window', part: 'window' },
  bed: { name: 'the bed', part: 'bed' },
}
// how tall the lit strip over a small surface is, in art px: room for what stands on it
const SURFACE_LIT = 26

// the box round several boxes
function around(boxes) {
  const x = Math.min(...boxes.map((box) => box.x))
  const y = Math.min(...boxes.map((box) => box.y))
  const right = Math.max(...boxes.map((box) => box.x + box.w))
  const bottom = Math.max(...boxes.map((box) => box.y + box.h))
  return { x, y, w: right - x, h: bottom - y }
}

// the piece being placed: picked in the inventory, or dragged out of it into the room
const placingNow = computed(() => {
  const entry = placing.value ?? (drag.value?.moved ? drag.value : null)
  return entry ? decorMeta(entry.id) : null
})

// What lights up while a piece is being placed, [{ key, box, label, swap }]: for a chair, curtains
// or bedding, the room's own piece they take the place of; for anything else, every area it can go.
const placeTargets = computed(() => {
  const meta = placingNow.value
  if (!props.editable || !ready.value || !meta) return []
  if (SWAP_INTO[meta.surface]) {
    const boxes = SWAP_INTO[meta.surface].pieces.map((id) => boxOf(PIECES.find((piece) => piece.id === id)))
    return [{ key: meta.surface, box: around(boxes), label: `Put it on ${SWAP_TARGETS[meta.surface].name}`, swap: true }]
  }
  if (meta.pet || meta.surface === 'floor') {
    return [{ key: 'floor', box: { x: FLOOR.left, y: ROOM.floor - 4, w: FLOOR.right - FLOOR.left, h: ROOM.height - ROOM.floor + 4 } }]
  }
  if (meta.surface === 'wall') {
    return [{ key: 'wall', box: { x: WALL.left, y: WALL.top, w: WALL.right - WALL.left, h: WALL.bottom - WALL.top } }]
  }
  if (meta.surface === 'shelf') {
    return SURFACES.map((surface) => ({
      key: surface.zone,
      box: { x: surface.left, y: surface.y - SURFACE_LIT, w: surface.right - surface.left, h: SURFACE_LIT },
    }))
  }
  return []
})

// what the prompt says while placing: where to tap, so a chair isn't tapped just anywhere
const placingPrompt = computed(() => {
  const meta = placingMeta.value
  if (!meta) return ''
  if (SWAP_INTO[meta.surface]) return `Tap ${SWAP_TARGETS[meta.surface].name} to put the ${meta.name} there.`
  if (meta.pet || meta.surface === 'floor') return `Tap anywhere on the lit floor for the ${meta.name}.`
  if (meta.surface === 'wall') return `Tap anywhere on the lit wall for the ${meta.name}.`
  if (meta.surface === 'shelf') return `Tap the window seat, side table or nightstand for the ${meta.name}.`
  return `Tap where the ${meta.name} should go.`
})

// a piece that takes the place of one of the room's own: the room slides over to that piece
watch(placingNow, (meta, before) => {
  if (!meta || meta === before || !ready.value || !SWAP_INTO[meta.surface]) return
  if (placing.value) centreOn(PARTS.find((part) => part.id === SWAP_TARGETS[meta.surface].part).at)
})

// With the room menu or the inventory open, the pieces already in the room show they can be
// tapped (to move or take down).
const showEditable = computed(() => props.editable && (menuOpen.value || inventoryOpen.value) && !placing.value && !drag.value)

function onSwapTarget(surface, point) {
  return SWAP_INTO[surface].pieces.some((id) => {
    const box = boxOf(PIECES.find((piece) => piece.id === id))
    return point.x >= box.x - SWAP_REACH && point.x <= box.x + box.w + SWAP_REACH &&
      point.y >= box.y - SWAP_REACH && point.y <= box.y + box.h + SWAP_REACH
  })
}

// A piece from the inventory put down at screen (x, y). Wall art, plants and the succulents land
// there, or as near as they fit (placement.js); a chair, curtains or bedding swaps in when it's on
// (or near) the piece it takes the place of; a cat goes on the free spot nearest there, if one is
// close. Returns { name } (where it went), { miss } (what to tell the reader when it didn't go
// anywhere), or null when the room can't take pieces.
function dropAt(entry, x, y) {
  const meta = decorMeta(entry.id)
  if (!props.editable || !meta || !ready.value) return null
  const point = artPoint(x, y)
  const rules = rulesFor(null)
  if (!meta.pet && ['wall', 'floor', 'shelf'].includes(meta.surface)) {
    const landing = landingFor(meta, point.x, point.y, rules)
    if (!landing || !placeOn(landing.zone, { x: Math.round((landing.at.x / ROOM.width) * 100) / 100, at: landing.at }, entry)) {
      return { miss: 'Not enough room there' }
    }
    return { name: zoneName(landing.zone) }
  }
  if (SWAP_INTO[meta.surface]) {
    const slot = SLOTS.find((one) => one.zone === meta.surface)
    if (!onSwapTarget(meta.surface, point) || !placeOn(slot.zone, spotOf(slot), entry)) return { miss: SWAP_INTO[meta.surface].miss }
    return { name: slotName(slot) }
  }
  // a cat: on the floor below where it's let go, within the line it walks along
  const at = { x: Math.round(Math.max(WALK.from, Math.min(WALK.to, point.x))), y: WALK.y }
  if (!placeOn('room', { x: Math.round((at.x / ROOM.width) * 100) / 100, at }, entry)) return { miss: `Put the ${meta.name} on the floor` }
  return { name: ZONE_NAMES.room }
}

// --- Moving a placed piece by pressing and holding it ----------------------------------------
// A press held still for HOLD_MS on wall art, a plant or the succulents picks the piece up; it
// follows the pointer, shown where it would land (as near as it fits), and is put down where it's
// let go. Let go where nothing fits, it goes back where it was. A press that moves sooner is a
// drag to look around the room, as anywhere else.
const HOLD_MS = 300
const HOLD_SLOP = 8 // px a press may wander and still be held
const DRAG_SLOP = 4 // px a press on a picked piece moves before the piece follows (less is a tap)
// the piece being carried: { uid, zone, at } (where it was picked up), and `landing`, where it would go now
const carrying = ref(null)
let hold = null
let justCarried = false

// A picked (highlighted) piece needs no hold: it follows the pointer as soon as the press moves,
// and the room doesn't slide under it (it also has touch-action: none).
function holdItem(event, item) {
  if (!props.editable || isPet(item) || !standsAnywhere(item.zone) || (event.button != null && event.button !== 0)) return
  const start = { x: event.clientX, y: event.clientY }
  if (selected.value === item.uid) {
    event.stopPropagation()
    hold = { start, item, now: true }
  } else {
    hold = { start, timer: window.setTimeout(() => pickUp(item), HOLD_MS) }
  }
  justCarried = false
  window.addEventListener('pointermove', onHoldMove)
  window.addEventListener('pointerup', onHoldUp)
  window.addEventListener('pointercancel', onHoldUp)
  window.addEventListener('touchmove', stopTouchScroll, { passive: false })
}

function pickUp(item) {
  hold = null
  selected.value = null
  carrying.value = { uid: item.uid, zone: item.zone, at: item.at, landing: { zone: item.zone, at: item.at } }
}

// while a piece is carried on a touch screen, the finger moves the piece, not the room
function stopTouchScroll(event) {
  if (carrying.value && event.cancelable) event.preventDefault()
}

function onHoldMove(event) {
  if (hold) {
    const wandered = Math.hypot(event.clientX - hold.start.x, event.clientY - hold.start.y)
    if (!hold.now) {
      if (wandered > HOLD_SLOP) endHold()
      return
    }
    if (wandered <= DRAG_SLOP) return
    pickUp(hold.item)
  }
  const carried = carrying.value
  if (!carried) return
  const item = placed.value.find((one) => one.uid === carried.uid)
  const point = artPoint(event.clientX, event.clientY)
  const landing = landingFor(decorMeta(item.id), point.x, point.y, rulesFor(item.uid))
  carrying.value = { ...carried, landing }
  if (landing) moveTo(item.uid, landing.zone, landing.at)
}

function onHoldUp() {
  const carried = carrying.value
  endHold()
  if (!carried) return
  justCarried = true
  // the click that ends the press doesn't also pick the piece
  window.setTimeout(() => {
    justCarried = false
  })
  // put down, it stays picked: drag it again, or tap × or elsewhere
  selected.value = carried.uid
  const meta = decorMeta(placed.value.find((one) => one.uid === carried.uid)?.id)
  if (!carried.landing) {
    moveTo(carried.uid, carried.zone, carried.at)
    flash('Not enough room there', 'bad')
    return
  }
  saveRoom()
  flash(`${meta.name} ${meta.plural ? 'are' : 'is'} ${zoneName(carried.landing.zone)}.`, 'ok')
}

function endHold() {
  if (hold) window.clearTimeout(hold.timer)
  hold = null
  carrying.value = null
  window.removeEventListener('pointermove', onHoldMove)
  window.removeEventListener('pointerup', onHoldUp)
  window.removeEventListener('pointercancel', onHoldUp)
  window.removeEventListener('touchmove', stopTouchScroll)
}

// --- Moving a placed piece from its card ----------------------------------------------------
// Move on a piece's card: the arrow buttons or keys nudge it NUDGE art px at a time, never into a
// place it doesn't fit (it stops as close as it fits). Done keeps it there; Cancel or Escape puts
// it back where it was.
const NUDGE = 4
// the piece being moved: { uid, name, zone, at } (where it was when Move was tapped)
const moving = ref(null)

function startMove(item) {
  selected.value = null
  moving.value = { uid: item.uid, name: decorName(item), zone: item.zone, at: item.at }
  window.addEventListener('keydown', onMoveKey, true)
}

function nudge(dx, dy) {
  const item = placed.value.find((one) => one.uid === moving.value?.uid)
  if (!item) return
  const meta = decorMeta(item.id)
  const rules = rulesFor(item.uid)
  for (let step = NUDGE; step > 0; step -= 1) {
    const next = nudged(meta, item.zone, item.at, dx * step, dy * step, rules)
    if (next) {
      moveTo(item.uid, item.zone, next)
      return
    }
  }
}

function stopMove(keep) {
  const current = moving.value
  if (!current) return
  if (!keep) moveTo(current.uid, current.zone, current.at)
  else saveRoom()
  moving.value = null
  window.removeEventListener('keydown', onMoveKey, true)
}

const KEY_STEPS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
function onMoveKey(event) {
  if (event.key === 'Escape') stopMove(false)
  else if (KEY_STEPS[event.key]) nudge(...KEY_STEPS[event.key])
  else return
  // the keys move the piece, not the room
  event.preventDefault()
  event.stopPropagation()
}

// --- Moving along the room --------------------------------------------------------------------
let scroll = null

// slides so art x `at` is in the middle of the view
function centreOn(at) {
  scroll.glideTo(at * size.value.unit - scroller.value.clientWidth / 2)
}

// The Places menu slides to each part. Before the room has loaded, the places that open
// something open it.
function goTo(id) {
  if (!ready.value) {
    if (id === 'bookshelf') emit('open-shelf')
    else if (id === 'chair') emit('open-book')
    else if (id === 'corkboard') emit('quote')
    return
  }
  centreOn(PARTS.find((part) => part.id === id).at)
  scroller.value.focus({ preventScroll: true })
}

// the art x in the middle of the view, kept as the room scrolls
let viewMiddle = null

function onScroll() {
  if (hinting.value) hideHint()
  const el = scroller.value
  viewMiddle = (el.scrollLeft + el.clientWidth / 2) / size.value.unit
}

// --- Taps -------------------------------------------------------------------------------------
function tap(id) {
  if (id === 'bookshelf') emit('open-shelf')
  else if (id === 'chair') emit('open-book')
  else if (id === 'corkboard') emit('quote')
}

// --- A book off the shelf -----------------------------------------------------------------------
let flight = null
// the shelf changed while a book was out: its spines are laid out again once it is back
function liftBook(id) {
  if (prefersReducedMotion() || bookPhase.value !== 'closed') return
  lifted.value = id
}

function lowerBook(id) {
  if (lifted.value === id) lifted.value = null
}

// The book comes off the shelf and opens; its details are asked for once it lies open.
async function tapBook(spine) {
  if (bookPhase.value !== 'closed') return
  const { book } = spine
  if (prefersReducedMotion()) {
    emit('pick-book', book)
    return
  }
  const button = root.value.querySelector(`[data-pin="book:${book.id}"]`)
  const host = root.value.getBoundingClientRect()
  const rect = button.getBoundingClientRect()
  bookPhase.value = 'opening'
  lifted.value = null
  out.value = book.id
  await flight.open(
    { left: rect.left - host.left, top: rect.top - host.top, width: rect.width, height: rect.height },
    book,
    { colour: spine.colour, ink: spine.ink },
  )
  bookPhase.value = 'open'
  emit('pick-book', book)
}

// Puts the book that is out back on the shelf, or fades it when it has been taken off the shelf
// for good. Resolves once it is gone.
async function putBack({ removed = false } = {}) {
  if (bookPhase.value === 'closed') return
  bookPhase.value = 'closing'
  await (removed ? flight.fade() : flight.close())
  bookPhase.value = 'closed'
  out.value = null
}

// --- Hint ---------------------------------------------------------------------------------------
let hintTimer = 0
function showHint() {
  try {
    if (localStorage.getItem(HINT_KEY)) return
    localStorage.setItem(HINT_KEY, '1')
  } catch {
    // no storage: show it anyway
  }
  hinting.value = true
  hintTimer = window.setTimeout(hideHint, HINT_MS)
}

function hideHint() {
  hinting.value = false
  window.clearTimeout(hintTimer)
}

// --- Clock --------------------------------------------------------------------------------------
const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Singapore',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
let clockOffset = 0
let clockTimer = 0

function readClock() {
  const parts = formatter.formatToParts(new Date(Date.now() + clockOffset))
  const read = (type) => Number(parts.find((part) => part.type === type)?.value) || 0
  return { hours: read('hour'), minutes: read('minute') }
}

function setTime() {
  const { hours, minutes } = readClock()
  time.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  if (minutes !== lastMinute) {
    lastMinute = minutes
    paint()
  }
}

watch([shelf, lifted, out, extras, () => props.notes, () => props.newNotes, () => props.theme,() => props.weather.scene, () => props.weather.night], () => paint())

watch(() => props.lamps, () => paint(), { deep: true })

let resize = null
onMounted(async () => {
  setTime()
  clockTimer = window.setInterval(setTime, 1000)
  scroll = createScroll(scroller.value, { locked: () => bookPhase.value !== 'closed' || Boolean(carrying.value), onMove: onScroll })
  flight = createFlight(root.value)
  measure()
  resize = new ResizeObserver(measure)
  resize.observe(root.value)
  const loaded = canDraw() && (await loadSprites())
  // the still picture stays, and the Places menu opens things instead
  if (!root.value || !loaded) return
  ready.value = true
  await nextTick()
  paint()
  lastTime = performance.now()
  frame = requestAnimationFrame(loop)
  if (lastLeft) scroll.glideTo(lastLeft * size.value.unit, { instant: true })
  showHint()
  const now = await fetchSingaporeTime()
  if (Number.isFinite(now.unix)) clockOffset = now.unix * 1000 - Date.now()
  lastMinute = -1
  setTime()
})

onBeforeUnmount(() => {
  if (ready.value && scroller.value) lastLeft = scroller.value.scrollLeft / size.value.unit
  window.clearInterval(clockTimer)
  window.clearTimeout(hintTimer)
  cancelAnimationFrame(frame)
  cancelAnimationFrame(painting)
  resize?.disconnect()
  scroll?.dispose()
  flight?.dispose()
  endHold()
  window.removeEventListener('keydown', onMoveKey, true)
  stopWatchingPicked()
  // the pick is shared (useDecor): coming back to the room finds nothing picked
  if (props.editable) selected.value = null
})

defineExpose({ dropAt, putBack })
</script>

<style scoped>
.strip {
  position: relative;
  height: 100%;
  overflow: hidden;
  /* the wall's colour, behind the room's top edge on any screen */
  background: var(--room-wall, #f9dec1);
  user-select: none;
}

.strip__scroller {
  position: absolute;
  inset: 0;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  /* a swipe moves the room sideways and never scrolls the page */
  touch-action: pan-x;
  outline: none;
  cursor: grab;
}

.strip__scroller::-webkit-scrollbar {
  display: none;
}

.strip__scroller.is-dragging {
  cursor: grabbing;
}

.strip__scroller:focus-visible {
  box-shadow: inset 0 0 0 3px var(--rl-primary);
}

.strip.is-locked .strip__scroller {
  overflow-x: hidden;
}

/* a room narrower than the window (a very wide, short one) sits in the middle of it */
.strip__stage {
  position: relative;
  height: 100%;
  margin-inline: auto;
}

.strip__room {
  position: absolute;
  left: 0;
  bottom: 0;
}

/* the picture: stretched a whole number of times with hard edges */
.strip__canvas,
.strip__still {
  position: absolute;
  left: 0;
  bottom: 0;
  display: block;
  width: 100%;
  image-rendering: pixelated;
}

.strip__canvas {
  height: 100%;
}

.strip__outside {
  position: absolute;
  pointer-events: none;
}

.strip__canvas {
  z-index: 1;
}

.strip__pets {
  pointer-events: none;
}

.strip__layer {
  position: absolute;
  inset: 0;
  z-index: 2;
}

.strip__pin {
  position: absolute;
}

/* the furniture is the picture; its button is an invisible box over it that glows when aimed at */
.strip__hit {
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  transition: box-shadow 0.2s ease, background-color 0.2s ease;
}

.strip__hit:hover,
.strip__hit:focus-visible,
.strip__hit[aria-expanded='true'] {
  background-color: rgba(255, 246, 220, 0.16);
  box-shadow: 0 0 0 2px rgba(255, 246, 220, 0.85), 0 0 14px 4px rgba(255, 224, 138, 0.55);
  outline: none;
}

.strip__book {
  border-radius: 0;
}

/* a book answers a pointer by lifting out of its row (drawn in the room), not with a glow;
   keyboard focus still gets a ring round it */
.strip__book:hover,
.strip__book:focus-visible {
  background-color: transparent;
  box-shadow: none;
}

.strip__book:focus-visible {
  outline: 2px solid rgba(255, 246, 220, 0.95);
  outline-offset: 1px;
}

@media (prefers-reduced-motion: reduce) {
  .strip__book:hover {
    background-color: rgba(255, 246, 220, 0.16);
    box-shadow: 0 0 0 2px rgba(255, 246, 220, 0.85);
  }
}

.strip__tip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  margin-bottom: 6px;
  padding: 3px 9px;
  transform: translateX(-50%) translateY(4px);
  border-radius: 999px;
  background: var(--rl-primary);
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  color: var(--rl-surface);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.strip__hit:hover .strip__tip,
.strip__hit:focus-visible .strip__tip {
  transform: translateX(-50%);
  opacity: 1;
}

.strip__window {
  pointer-events: none;
}

/* a row's name plate on its board: a small cream plate with the room's dark outline */
.strip__plate {
  z-index: 1;
  transform: translateY(-50%);
  padding: 0 5px;
  border: max(1px, var(--unit)) solid #1e1a24;
  background: #f9f3e6;
  box-shadow: inset 0 calc(-1 * max(1px, var(--unit))) 0 #e6dccb;
  font-family: var(--rl-font-body);
  font-size: 9px;
  font-weight: 800;
  line-height: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  color: #3b342a;
  pointer-events: none;
}

.strip__note {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card);
  background: rgba(255, 253, 249, 0.94);
  font-size: 12px;
  text-align: center;
  color: var(--rl-muted);
}

.strip__note strong {
  font-family: var(--rl-font-title);
  font-size: 14px;
  color: var(--rl-text);
}

.strip__note a {
  font-weight: 700;
}

/* a picked piece: lit with a solid edge and a soft glow, a × on its top right (and a ✥ on its
   top left to move it) */
.placed-art.is-selected,
.placed-cat.is-selected {
  z-index: 1;
  outline: 3px solid var(--house-accent, var(--rl-accent));
  outline-offset: 2px;
  border-radius: 4px;
  box-shadow: 0 0 0 6px rgb(255 255 255 / 35%), 0 0 16px 4px rgb(255 209 102 / 65%);
}

.placed__badge {
  position: absolute;
  top: -12px;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 2px solid #2b2133;
  border-radius: 50%;
  color: #2b2133;
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 2px 0 #2b2133;
}

/* a bigger invisible area round the badge, so a finger finds it */
.placed__badge::before {
  content: '';
  position: absolute;
  inset: -10px;
}

.placed__badge:focus-visible {
  outline: 2px solid #2b2133;
  outline-offset: 2px;
}

.placed__remove {
  right: -12px;
  background: #ff6b6b;
  color: #fff;
}

.placed__move {
  left: -12px;
  background: #ffd166;
}

@media (hover: hover) {
  .placed__badge:hover {
    filter: brightness(1.08);
  }
}

.placed__badge:active {
  transform: translateY(1px);
  box-shadow: 0 1px 0 #2b2133;
}

/* a piece of furniture from the library: drawn in the room, its button an invisible box under
   the room's own tappable parts (a chair's box takes in the book on the coffee table) */
.placed-art {
  z-index: 0;
  overflow: visible;
  -webkit-touch-callout: none;
  user-select: none;
}

/* a piece picked up to move: outlined while it's carried */
.placed-art.is-carried {
  outline: 2px dashed var(--house-accent, var(--rl-accent));
  outline-offset: 2px;
  cursor: grabbing;
}

.strip__hit:not(.placed-art) {
  z-index: 1;
}

/* a cat's button: an invisible box over the cat, following it as it walks */
.placed-cat {
  padding: 0;
  border: 0;
  background: none;
  transform: translate(-50%, -100%);
  cursor: pointer;
}

/* while placing a piece: where it can go, lit with a dashed edge; the piece a chair, curtains or
   bedding take the place of glows and says so */
.strip__target {
  z-index: 2;
  border: 3px dashed rgb(43 33 51 / 60%);
  border-radius: 6px;
  background: repeating-linear-gradient(45deg, rgb(255 209 102 / 38%) 0 10px, rgb(255 255 255 / 18%) 10px 20px);
  box-shadow: inset 0 0 0 2px rgb(255 255 255 / 70%);
  pointer-events: none;
  animation: strip-target 1.2s ease-in-out infinite alternate;
}

.strip__target.is-swap {
  border-color: #ffd166;
  background: rgb(255 209 102 / 30%);
  box-shadow: 0 0 0 3px rgb(43 33 51 / 45%), 0 0 18px 4px rgb(255 209 102 / 70%);
}

.strip__target-label {
  position: absolute;
  left: 50%;
  bottom: 100%;
  margin-bottom: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  background: #2b2133;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  transform: translateX(-50%);
}

@keyframes strip-target {
  from {
    opacity: 0.65;
  }
}

/* with the inventory open: each placed piece outlined, with a pencil, to show it can be tapped */
.placed-art.is-editable {
  outline: 2px dashed rgb(255 255 255 / 90%);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgb(43 33 51 / 30%);
}

.placed__pencil {
  position: absolute;
  top: -10px;
  right: -10px;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 2px solid #2b2133;
  border-radius: 50%;
  background: #ffd166;
  color: #2b2133;
  font-size: 12px;
  line-height: 1;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .strip__target {
    animation: none;
  }
}

/* while placing a piece: the whole room takes the tap that puts it down, over the room's buttons */
.strip__drop {
  inset: 0;
  z-index: 3;
  cursor: crosshair;
}

/* the weather chip: the town's chips (TownHud), its bottom middle on the point above the rod */
.strip__weather {
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -100%);
  white-space: nowrap;
  pointer-events: none;
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
}

/* a little pixel icon for the sky: sun, moon, cloud or rain */
.strip__weather-icon {
  width: 18px;
  height: 18px;
  image-rendering: pixelated;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}

.strip__weather-icon.is-sun {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 9' shape-rendering='crispEdges'%3E%3Cpath fill='%23e3b04b' d='M3 0h3v1h1v1h1v1h1v3h-1v1h-1v1h-1v1h-3v-1h-1v-1h-1v-1h-1v-3h1v-1h1v-1h1z'/%3E%3Cpath fill='%23ffe08a' d='M3 1h3v1h1v1h1v3h-1v1h-1v1h-3v-1h-1v-1h-1v-3h1v-1h1z'/%3E%3C/svg%3E");
}

.strip__weather-icon.is-moon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 9' shape-rendering='crispEdges'%3E%3Cpath fill='%23c9c0ad' d='M3 0h3v1h-2v1h-1v5h1v1h3v1h-4v-1h-1v-1h-1v-5h1v-1h1z'/%3E%3Cpath fill='%23f4efe2' d='M3 2h1v5h-1zM4 1h2v1h-2zM4 7h4v1h-4z'/%3E%3C/svg%3E");
}

.strip__weather-icon.is-cloud,
.strip__weather-icon.is-rain {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 9' shape-rendering='crispEdges'%3E%3Cpath fill='%23b9b09d' d='M3 1h3v1h1v1h1v1h1v2h-9v-2h1v-1h1v-1h1z'/%3E%3Cpath fill='%23fdf7ec' d='M3 2h3v1h1v1h1v1h-7v-1h1v-1h1z'/%3E%3C/svg%3E");
}

.strip__weather-icon.is-rain {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 9' shape-rendering='crispEdges'%3E%3Cpath fill='%235a5a68' d='M3 0h3v1h1v1h1v1h1v2h-9v-2h1v-1h1v-1h1z'/%3E%3Cpath fill='%237fb6d9' d='M1 6h1v2h-1zM4 6h1v2h-1zM7 6h1v2h-1z'/%3E%3C/svg%3E");
}

.strip__hint {
  position: absolute;
  top: 54px;
  left: 50%;
  z-index: 4;
  margin: 0;
  padding: 7px 14px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: rgba(44, 36, 30, 0.72);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  color: var(--rl-surface);
  pointer-events: none;
}

.strip-hint-enter-active,
.strip-hint-leave-active {
  transition: opacity 0.4s ease;
}

.strip-hint-enter-from,
.strip-hint-leave-to {
  opacity: 0;
}

.strip__skip {
  position: absolute;
  inset: 0;
  z-index: 5;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

/* The placing prompt and the moving bar: on the Places button's row, in the room to its right
   (--places-room keeps clear of the button), centred there on a wide screen. On a phone the words
   wrap above the buttons rather than run under the Places button or off the screen. */
.strip__placing {
  --places-room: 124px;
  position: absolute;
  top: calc(var(--building-back-space, 0px) + 6px);
  left: max(var(--places-room), calc(50% - 280px));
  z-index: 6;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--rl-btn-gap);
  width: min(560px, calc(100% - var(--places-room) - 12px));
  margin: 0;
  padding: 8px 10px;
  border-radius: 16px;
  background: var(--rl-surface);
  font-size: 12px;
  line-height: 1.3;
  text-align: center;
  color: var(--rl-text);
  box-shadow: 0 4px 12px rgba(63, 46, 36, 0.2);
}

.strip__placing-text {
  flex: 1 1 100%;
}

/* the picked piece's line: centred under the top-left buttons (clear of the coins and their
   messages), it says, never takes a tap */
.strip__picked {
  top: calc(var(--building-back-space, 0px) + 120px);
  left: 50%;
  width: max-content;
  max-width: calc(100% - 24px);
  transform: translateX(-50%);
  font-weight: 700;
  text-align: center;
  pointer-events: none;
}

/* a picked piece: a press on it drags it, not the room */
.placed-art.is-selected {
  touch-action: none;
  cursor: grab;
}

@media (min-width: 720px) {
  .strip__placing-text {
    flex: 0 1 auto;
  }
}

/* the Places menu, in the top left corner (the coins are in the top right) */
.strip__menu {
  position: absolute;
  top: calc(var(--building-back-space, 0px) + 10px);
  left: 12px;
  /* its list opens over the Daily task tab (36), under the room's dialogs (40 and up) */
  z-index: 37;
}

@media (prefers-reduced-motion: reduce) {
  .strip__hit,
  .strip__tip {
    transition: none;
  }
}
</style>

<style>
/* the book taken off the shelf (strip/flight.js), drawn over the room */
.flight {
  position: absolute;
  z-index: 4;
  perspective: 700px;
  pointer-events: none;
}

.flight__book {
  position: relative;
  width: 100%;
  height: 100%;
  box-shadow: 0 10px 24px rgba(44, 36, 30, 0.3);
}

.flight__pages {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8%;
  padding: 14% 16%;
  border: 2px solid #1e1a24;
  background: #f9f3e6;
}

.flight__pages i {
  display: block;
  height: 2px;
  background: #d9c2a2;
}

.flight__cover {
  position: absolute;
  inset: 0;
  transform-origin: left center;
  transform-style: preserve-3d;
}

.flight__cloth,
.flight__picture,
.flight__inside {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 2px solid #1e1a24;
  backface-visibility: hidden;
}

.flight__cloth {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 18% 10% 12%;
  font-family: var(--font-serif);
  text-align: center;
  overflow: hidden;
}

.flight__title {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}

.flight__author {
  font-size: 10px;
  font-style: italic;
}

.flight__picture {
  object-fit: cover;
  opacity: 0;
}

.flight__picture.is-loaded {
  opacity: 1;
}

.flight__inside {
  transform: rotateY(180deg);
  background: #e6dccb;
}
</style>
