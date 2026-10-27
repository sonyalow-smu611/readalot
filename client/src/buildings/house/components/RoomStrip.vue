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
          <canvas v-show="ready" ref="canvas" class="strip__canvas" />
          <!-- the cats from the furniture library, drawn over the room as they walk about -->
          <canvas v-show="ready" ref="catCanvas" class="strip__canvas strip__pets" aria-hidden="true" />
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
              role="img"
              :aria-label="`Singapore time ${time}`"
              :style="boxStyle(spots.clock)"
            />

            <button
              class="strip__pin strip__hit"
              data-tour="shelf"
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
                <RouterLink to="/discover">Discover books</RouterLink>
                <RouterLink to="/scan">Scan a cover</RouterLink>
              </template>
            </div>

            <button
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
              class="strip__pin strip__hit"
              data-tour="quote"
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
                v-if="artOf(item)"
                type="button"
                class="strip__pin strip__hit placed-art"
                :aria-label="decorName(item)"
                :style="boxStyle(artOf(item).box)"
                @click="pickItem(item.uid)"
              >
                <span v-if="selected === item.uid" class="placed__remove" @click.stop="unplace(item.uid)">Remove</span>
              </button>
              <button
                v-else-if="isPet(item)"
                type="button"
                class="strip__pin placed-cat"
                :data-pet="item.uid"
                :aria-label="decorName(item)"
                :style="catStyle(item)"
                @click="pickItem(item.uid)"
              >
                <span v-if="selected === item.uid" class="placed__remove" @click.stop="unplace(item.uid)">Remove</span>
              </button>
            </template>

            <!-- while placing or dragging a piece: the free spots it can go on -->
            <button
              v-for="slot in freeSlots"
              :key="slot.id"
              type="button"
              class="strip__pin strip__slot"
              :class="{ 'is-wall': slot.zone === 'wall' }"
              :aria-label="`Put ${movingMeta.name} ${slotName(slot)}`"
              :style="pointStyle(slot.at)"
              @click="placeAt(slot)"
            />
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
      v-if="bookPhase === 'opening'"
      class="strip__skip"
      type="button"
      aria-label="Skip to the open book"
      @click="flight.skip()"
      @pointerdown.stop
      @wheel.stop.prevent
    />

    <p v-if="editable && placing" class="strip__placing" role="status">
      Tap a glowing spot for the {{ placingMeta?.name }}.
      <button type="button" class="strip__cancel" @click="cancelPlace">Cancel</button>
    </p>

    <PlacesMenu class="strip__menu" :places="PARTS" @go="goTo" />
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
import { decorMeta, fitsZone, useDecor } from '@/composables/useDecor'
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
// spots with room for one piece, which a new one swaps with: never taken
const ONE_SPOT = new Set(['chair', 'curtains', 'bed'])
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
  // the furniture standing in the room: [{ uid, id, zone, x }]
  furniture: { type: Array, default: () => [] },
  // the reader's own room: pieces can be put on spots, picked and taken down
  editable: { type: Boolean, default: false },
  // whose room it is, for screen readers ("Your room", "Emma's room")
  roomName: { type: String, default: 'Your room' },
  // what the corkboard opens: the Quote of the Day, or a visited reader's notice board
  boardLabel: { type: String, default: 'Quote of the day' },
  // how many visitors' notes are on the corkboard (up to three are drawn on it)
  notes: { type: Number, default: 0 },
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

const { placing, placingMeta, drag, selected, pick, unplace, placeOn, cancelPlace, flash } = useDecor()
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

// the piece on its way into the room: picked to place, or being dragged out of the inventory
const movingMeta = computed(() => placingMeta.value ?? (drag.value?.moved ? decorMeta(drag.value.id) : null))

// spots that piece can go on, that nothing stands on yet (none in someone else's room)
const freeSlots = computed(() => {
  const meta = movingMeta.value
  if (!meta || !props.editable) return []
  return SLOTS.filter((slot) => fitsZone(meta, slot.zone) && !takenSlot(slot))
})

// where a spot is, said the way the room says it ("on the side table", "on the wall by the window")
function slotName(slot) {
  return slot.name ?? ZONE_NAMES[slot.zone]
}

// pets wander off, so only the pieces that stay put take a spot. The reading nook, the window and
// the bed are never taken: a new chair (curtains, bedding) swaps with the one there.
function takenSlot(slot) {
  if (ONE_SPOT.has(slot.zone)) return false
  return placed.value.some((item) => !isPet(item) && item.zone === slot.zone && Math.abs(item.x - slot.x) < 0.04)
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
  const slot = sprite && slotOf(item)
  if (!slot) return null
  const { w, h } = SPRITES[sprite]
  const wall = item.zone === 'wall'
  const x = Math.round(slot.at.x - w / 2)
  const y = wall ? Math.round(slot.at.y - h / 2) : (slot.base ?? slot.at.y) - h
  // the floor's spots are in front of the furniture; the small surfaces are on top of it; a
  // reading chair stands in for the armchair
  const layer = wall ? 'wall' : item.zone === 'room' ? 'front' : 'furniture'
  return { sprite, box: { x, y, w, h }, layer, replaces: item.zone === 'chair' ? 'armchair' : null }
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

// where a pet is and what it's doing: it starts somewhere along the floor, sitting
function petState(uid) {
  if (!pets.has(uid)) {
    const x = WALK.from + Math.random() * (WALK.to - WALK.from)
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

function placeAt(slot) {
  const meta = placingMeta.value
  if (placeOn(slot.zone, slot.x)) flash(`${meta.name} ${meta.plural ? 'are' : 'is'} ${slotName(slot)}.`, 'ok')
}

function switchLamp(id) {
  if (scroll?.wasDrag()) return
  emit('toggle-lamp', id)
}

function pickItem(uid) {
  if (!props.editable || scroll?.wasDrag()) return
  pick(uid)
}

// A piece dragged out of the inventory and let go at (x, y): put it on the free spot nearest
// there, if one is close. Returns the spot, or null.
function dropAt(entry, x, y) {
  const meta = decorMeta(entry.id)
  if (!props.editable || !meta || !ready.value) return null
  const stage = scroller.value.firstElementChild.getBoundingClientRect()
  const { unit } = size.value
  let best = null
  for (const slot of SLOTS) {
    if (!fitsZone(meta, slot.zone) || takenSlot(slot)) continue
    const gap = Math.hypot(stage.left + slot.at.x * unit - x, stage.top + (offset.value + slot.at.y) * unit - y)
    if (gap < 70 && (!best || gap < best.gap)) best = { slot, gap }
  }
  if (!best || !placeOn(best.slot.zone, best.slot.x, entry)) return null
  return { ...best.slot, name: slotName(best.slot) }
}

// --- Moving along the room --------------------------------------------------------------------
let scroll = null

// slides so art x `at` is in the middle of the view
function centreOn(at) {
  scroll.glideTo(at * size.value.unit - scroller.value.clientWidth / 2)
}

function inView(x) {
  const left = scroller.value.scrollLeft / size.value.unit
  return x > left + 10 && x < left + scroller.value.clientWidth / size.value.unit - 10
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

// Picking a piece to place slides to the first free spot it can go on, unless one is in view.
watch(placing, async (entry) => {
  if (!entry || !ready.value) return
  await nextTick()
  if (!freeSlots.value.some((slot) => inView(slot.at.x)) && freeSlots.value[0]) centreOn(freeSlots.value[0].at.x)
})

watch([shelf, lifted, out, extras, () => props.notes, () => props.theme,() => props.weather.scene, () => props.weather.night], () => paint())

watch(() => props.lamps, () => paint(), { deep: true })

let resize = null
onMounted(async () => {
  setTime()
  clockTimer = window.setInterval(setTime, 1000)
  scroll = createScroll(scroller.value, { locked: () => bookPhase.value !== 'closed', onMove: onScroll })
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

.placed__remove {
  position: absolute;
  bottom: 100%;
  left: 50%;
  margin-bottom: 4px;
  padding: 3px 8px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: #b42318;
  font-size: 0.68rem;
  white-space: nowrap;
  color: #fff;
}

/* a piece of furniture from the library: drawn in the room, its button an invisible box under
   the room's own tappable parts (a chair's box takes in the book on the coffee table) */
.placed-art {
  z-index: 0;
  overflow: visible;
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

/* a free spot for the piece being placed */
.strip__slot {
  width: 44px;
  height: 44px;
  padding: 0;
  transform: translate(-50%, -75%);
  border: 2px solid rgba(255, 253, 249, 0.9);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(243, 212, 138, 0.85), rgba(243, 212, 138, 0.2) 70%);
  box-shadow: 0 0 16px 4px rgba(243, 212, 138, 0.7);
  cursor: pointer;
  animation: slot-glow 1.4s ease-in-out infinite;
}

/* a spot on the wall: the piece hangs centred on it */
.strip__slot.is-wall {
  transform: translate(-50%, -50%);
}

@keyframes slot-glow {
  50% {
    box-shadow: 0 0 6px 1px rgba(243, 212, 138, 0.4);
  }
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

.strip__placing {
  position: absolute;
  top: 58px;
  left: 50%;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 6px 6px 6px 12px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: var(--rl-surface);
  font-size: 12px;
  white-space: nowrap;
  color: var(--rl-text);
  box-shadow: 0 4px 12px rgba(63, 46, 36, 0.2);
}

.strip__cancel {
  padding: 3px 10px;
  border: 1px solid var(--rl-line);
  border-radius: 999px;
  background: none;
  font-size: 11px;
  font-weight: 700;
  color: var(--rl-primary);
}

/* the Places menu, in the top left corner (the coins are in the top right) */
.strip__menu {
  position: absolute;
  top: 10px;
  left: 12px;
  z-index: 7;
}

@media (prefers-reduced-motion: reduce) {
  .strip__slot {
    animation: none;
  }

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
