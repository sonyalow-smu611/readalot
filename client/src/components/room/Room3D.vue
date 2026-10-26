<!--
  The room in 3D. The reader stands in the middle of the bedroom modelled in Blender
  (client/blender) and looks around: drag to turn, pinch or scroll to zoom, or use the bar of
  places along the bottom.

  Everything you can tap is a real, labelled HTML button laid over the canvas. Each frame the
  buttons are moved onto the things they stand for, and hidden when those are out of view:
    bookshelf  turns to the reader's books     chair      opens the Currently Reading card
    a book     opens that book's details
    corkboard  opens the Quote of the Day      window, clock   live weather and time (read-only)
  Shop decorations and pets are the shop's own drawings, pinned to spots in the room.

  Until the room has loaded, and on devices that cannot draw 3D, a still picture of the first
  view stands in, with the bar of places opening things directly.
-->
<template>
  <div
    ref="root"
    class="room3d"
    :class="{ 'is-ready': ready, 'is-still': still }"
  >
    <img class="room3d__still" :src="stillArt" alt="" draggable="false" />
    <!-- the view outside, behind the canvas: it shows through the glass of the bay window -->
    <WindowView
      v-if="ready"
      class="room3d__pin room3d__outside"
      data-pin="outside"
      :scene="weather.scene"
      :night="weather.night"
    />
    <canvas
      v-show="!still"
      ref="canvas"
      class="room3d__canvas"
      tabindex="0"
      aria-label="Your room. Drag to look around. Arrow keys turn, plus and minus zoom."
    />

    <!-- buttons and drawings pinned onto the room; positioned every frame by `track` -->
    <div v-if="ready" class="room3d__layer">
      <div class="room3d__pin room3d__window" data-pin="hit:window" data-tour="window" role="img" :aria-label="windowLabel">
        <span v-if="weather.temperature !== null" class="room3d__temp">{{ weather.temperature }}°</span>
      </div>
      <div class="room3d__pin" data-pin="hit:clock" data-tour="clock" role="img" :aria-label="`Singapore time ${time}`" />

      <button
        class="room3d__pin room3d__hit"
        data-pin="hit:bookshelf"
        data-tour="shelf"
        type="button"
        :aria-label="`Bookshelf, ${books.length} books`"
        @click="tap('bookshelf')"
      />
      <!-- each shelf has a row of the bookcase, named on a brass plate on its board (drawn in
           the room); here its name for screen readers, then one button per book over its spine,
           after the bookcase so they sit on top. A book lifts out a little while pointed at. -->
      <template v-for="row in shelfRows" :key="row.status">
        <span class="visually-hidden">{{ row.label }} shelf, {{ row.count }} {{ row.count === 1 ? "book" : "books" }}</span>
        <button
          v-for="entry in row.books"
          :key="entry.book.id"
          class="room3d__pin room3d__hit room3d__book"
          :data-pin="`book:${entry.book.id}`"
          type="button"
          aria-haspopup="dialog"
          :aria-label="`${entry.book.title} by ${primaryAuthor(entry.book)}`"
          @click="tapBook(entry.book)"
          @pointerenter="liftBook(entry.book.id)"
          @pointerleave="lowerBook(entry.book.id)"
          @focus="liftBook(entry.book.id)"
          @blur="lowerBook(entry.book.id)"
        />
      </template>
      <div v-if="shelfNote" class="room3d__pin room3d__note" data-pin="hit:bookshelf" @click.stop @pointerdown.stop>
        <template v-if="error">
          <strong>Shelf unavailable</strong>
          {{ error }}
          <button class="btn btn-sm btn-outline-primary" type="button" @click="$emit('retry')">Retry</button>
        </template>
        <template v-else>
          <strong>Add your first book</strong>
          <RouterLink to="/discover">Discover books</RouterLink>
          <RouterLink to="/scan">Scan a cover</RouterLink>
        </template>
      </div>

      <button
        class="room3d__pin room3d__hit chair__book"
        data-pin="hit:chair"
        data-tour="chair"
        type="button"
        aria-haspopup="dialog"
        :aria-expanded="readingOpen"
        :aria-label="chairLabel"
        @click="tap('chair')"
      >
        <span class="room3d__hint">{{ currentBook ? 'Currently reading' : 'Nothing on the go' }}</span>
      </button>
      <button
        class="room3d__pin room3d__hit"
        data-pin="hit:corkboard"
        data-tour="quote"
        type="button"
        aria-haspopup="dialog"
        aria-label="Quote of the day"
        @click="tap('corkboard')"
      >
        <span class="room3d__hint">Quote of the day</span>
      </button>

      <!-- decorations and pets, standing on their spots -->
      <button
        v-for="item in placed"
        :key="item.uid"
        type="button"
        class="room3d__pin placed"
        :class="{ 'is-pet': isPet(item) }"
        :data-pin="`item:${item.uid}`"
        :aria-label="decorName(item)"
        @click="pickItem(item.uid, $event)"
      >
        <span class="placed__pop" :data-decor-uid="item.uid"><DecorPiece :kind="item.id" /></span>
        <span v-if="selected === item.uid" class="placed__remove" @click.stop="unplace(item.uid)">Remove</span>
      </button>

      <!-- while placing or dragging a piece: the free spots it can go on -->
      <button
        v-for="slot in freeSlots"
        :key="slot.id"
        type="button"
        class="room3d__pin room3d__slot"
        :data-pin="`slot:${slot.id}`"
        :aria-label="`Put ${movingMeta.name} ${ZONE_NAMES[slot.zone]}`"
        @click="placeAt(slot)"
      />
    </div>

    <!-- while a book comes off the shelf: a tap skips to it open, and nothing else in the room
         can be tapped or turned -->
    <button
      v-if="bookPhase === 'opening'"
      class="room3d__skip"
      type="button"
      aria-label="Skip to the open book"
      @click="opener.skip()"
      @pointerdown.stop
      @wheel.stop.prevent
    />

    <p v-if="placing" class="room3d__placing" role="status">
      Tap a glowing spot for the {{ placingMeta?.name }}.
      <button type="button" class="room3d__cancel" @click="cancelPlace">Cancel</button>
    </p>

    <nav class="room3d__places" aria-label="Places in the room">
      <button v-for="place in PLACES" :key="place.id" type="button" class="room3d__place" @click="goTo(place.id)">
        {{ place.label }}
      </button>
    </nav>

    <p v-if="still" class="room3d__readout">{{ windowLabel.replace('Window view: ', '') }} · {{ time }}</p>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import * as THREE from 'three'
import stillArt from '@/assets/room/room.webp'
import DecorPiece from '@/components/DecorPiece.vue'
import WindowView from '@/components/room/WindowView.vue'
import { decorMeta, useDecor } from '@/composables/useDecor'
import { primaryAuthor } from '@/lib/book'
import { fetchSingaporeTime } from '@/services/time.js'
import { loadRoom } from '@/lib/room3d/loadRoom.js'
import { buildBooks, disposeBooks, spineBox } from '@/lib/room3d/books.js'
import { createBookOpener } from '@/lib/room3d/bookOpen.js'
import { prefersReducedMotion } from '@/lib/motion'
import { createLighting } from '@/lib/room3d/weather.js'
import { createLook } from '@/lib/room3d/look.js'

const PLACES = [
  { id: 'bookshelf', label: 'Bookshelf' },
  { id: 'chair', label: 'Chair' },
  { id: 'window', label: 'Window' },
  { id: 'corkboard', label: 'Corkboard' },
  { id: 'clock', label: 'Clock' },
]
const ZONE_NAMES = {
  seat: 'on the window seat',
  nightstand: 'on the nightstand',
  'side-table': 'on the side table',
  room: 'on the floor',
}
const SCENE_LABELS = { sunny: 'Clear', cloudy: 'Cloudy', rain: 'Rain' }
// how tall things pinned into the room stand, in metres
const PIN_HEIGHT = { shelf: 0.24, floor: 0.55, pet: 0.34, slot: 0.16 }
const PET_SPEED = 0.35 // metres a second
// a book pointed at lifts this far up and out of its shelf (metres), easing there at `rate`
const LIFT = { up: 0.02, out: 0.05, rate: 12 }

const props = defineProps({
  books: { type: Array, default: () => [] },
  currentBook: { type: Object, default: null },
  // { scene: 'sunny' | 'cloudy' | 'rain', night, temperature }
  weather: { type: Object, required: true },
  loading: Boolean,
  error: { type: String, default: '' },
  // the Currently Reading card opened from the chair is showing
  readingOpen: Boolean,
})
// open-book: the chair's Currently Reading card; pick-book: a book tapped on the shelf;
// list-books: the bookshelf asked for on the still picture, where no book can be tapped
const emit = defineEmits(['open-book', 'pick-book', 'list-books', 'quote', 'retry'])

const { placed, placing, placingMeta, drag, selected, pick, unplace, placeOn, cancelPlace, flash } = useDecor()

const root = ref(null)
const canvas = ref(null)
const ready = ref(false)
const still = ref(false)
// the bookcase's rows, top down: { status, label, count, hidden, shelf }
const rows = shallowRef([])
// the books standing on the shelf, each with the box its spine fills: { book, box }
const shelved = shallowRef([])
// each row with the books standing on it, for their buttons
const shelfRows = computed(() =>
  rows.value.map((row) => ({ ...row, books: shelved.value.filter((entry) => entry.status === row.status) })),
)
// a book taken off the shelf: 'closed' | 'opening' | 'open' | 'closing'
const bookPhase = ref('closed')
const time = ref('--:--')
const room = shallowRef(null)

const windowLabel = computed(() => {
  const sky = `${SCENE_LABELS[props.weather.scene] ?? 'Cloudy'}${props.weather.night ? ' night' : ''}`
  return props.weather.temperature === null ? `Window view: ${sky}` : `Window view: ${sky}, ${props.weather.temperature} degrees`
})
const chairLabel = computed(() =>
  props.currentBook ? `Currently reading ${props.currentBook.title}. Show details` : 'No current book. Show details',
)
const shelfNote = computed(() => !props.loading && (props.error || !props.books.length))

function decorName(item) {
  return decorMeta(item.id)?.name || 'Decoration'
}

function isPet(item) {
  return Boolean(decorMeta(item.id)?.pet)
}

// the piece on its way into the room: picked to place, or being dragged out of the inventory
const movingMeta = computed(() => placingMeta.value ?? (drag.value?.moved ? decorMeta(drag.value.id) : null))

// spots that piece can go on, that nothing stands on yet
const freeSlots = computed(() => {
  const meta = movingMeta.value
  if (!meta || !room.value) return []
  return room.value.slots.filter(
    (slot) => (meta.surface === 'floor') === (slot.zone === 'room') && !takenSlot(slot),
  )
})

// pets wander off, so only the pieces that stay put take a spot
function takenSlot(slot) {
  return placed.value.some((item) => !isPet(item) && item.zone === slot.zone && Math.abs(item.x - slot.x) < 0.04)
}

// the spot a placed piece stands on: the slot in its zone nearest its x
function slotOf(item) {
  const slots = room.value?.slots.filter((slot) => slot.zone === item.zone) ?? []
  return slots.reduce((best, slot) => (!best || Math.abs(slot.x - item.x) < Math.abs(best.x - item.x) ? slot : best), null)
}

// --- Three.js ------------------------------------------------------------------------------
let renderer = null
let scene = null
let camera = null
let look = null
let lighting = null
let bookMeshes = null
// the books' own meshes, inside bookMeshes
let books = []
let opener = null
// the shelf changed while a book was out: re-stand the books once it is back
let relayout = false
let frame = 0
let lastTime = 0
let resize = null
const raycaster = new THREE.Raycaster()
const pets = new Map()

function canDraw3D() {
  try {
    const probe = document.createElement('canvas')
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'))
  } catch {
    return false
  }
}

async function start() {
  if (!canDraw3D()) {
    still.value = true
    return
  }
  try {
    // see-through where the sky is, so the view outside shows behind the window
    renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true, alpha: true })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap

    const loaded = await loadRoom()
    if (!renderer) return // left the page while it loaded
    room.value = loaded
    scene = loaded.scene
    camera = new THREE.PerspectiveCamera(loaded.view?.fov ?? 75, 1, 0.05, 40)
    camera.position.copy(loaded.view?.position ?? new THREE.Vector3(0, 1.45, 0.3))

    lighting = createLighting(loaded)
    scene.add(lighting.lights)
    lighting.apply(props.weather)
    placeBooks()
    if (loaded.herobook) opener = createBookOpener({ ...loaded.herobook, camera, scene })

    look = createLook(camera, root.value)
    if (loaded.view) look.setFrom(loaded.view.quaternion, loaded.view.fov)

    resize = new ResizeObserver(fit)
    resize.observe(root.value)
    fit()
    ready.value = true
    await nextTick()
    lastTime = performance.now()
    frame = requestAnimationFrame(loop)
  } catch {
    stop()
    still.value = true
  }
}

function fit() {
  const { clientWidth: width, clientHeight: height } = root.value
  if (!width || !height || !renderer) return
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

function placeBooks() {
  if (!room.value) return
  if (bookPhase.value !== 'closed') {
    relayout = true
    return
  }
  if (bookMeshes) {
    scene.remove(bookMeshes)
    disposeBooks(bookMeshes)
  }
  pointedAt = null
  const built = buildBooks(room.value.shelves, props.books)
  bookMeshes = built.group
  books = built.meshes
  rows.value = built.rows
  scene.add(bookMeshes)
  bookMeshes.updateMatrixWorld(true)
  // books stand still, so where each spine is only changes when the shelf is rebuilt
  shelved.value = books.map((mesh) => ({
    book: props.books.find((book) => book.id === mesh.userData.bookId),
    status: mesh.userData.status,
    box: spineBox(mesh),
  }))
}

// --- A book pointed at lifts up and out of its shelf -----------------------------------------
// the book under the pointer or keyboard focus, and the book that is out (it stays up until
// it is back on the shelf, then settles)
let pointedAt = null
let takenOut = null

function liftBook(id) {
  if (prefersReducedMotion()) return
  pointedAt = books.find((mesh) => mesh.userData.bookId === id) ?? null
}

function lowerBook(id) {
  if (pointedAt?.userData.bookId === id) pointedAt = null
}

// eases each book towards up (1) or down (0) on its shelf; in the shelf's own space up is +y
// and out of the bookcase +z
function liftBooks(seconds) {
  const step = 1 - Math.exp(-LIFT.rate * seconds)
  for (const mesh of books) {
    const target = mesh === pointedAt || mesh === takenOut ? 1 : 0
    const lift = mesh.userData.lift ?? 0
    if (lift === target) continue
    const next = Math.abs(target - lift) < 0.001 ? target : lift + (target - lift) * step
    mesh.userData.lift = next
    const { rest } = mesh.userData
    mesh.position.set(rest.x, rest.y + LIFT.up * next, rest.z + LIFT.out * next)
  }
}

function loop(now) {
  frame = requestAnimationFrame(loop)
  const seconds = Math.min(0.1, (now - lastTime) / 1000)
  lastTime = now
  if (document.hidden) return
  liftBooks(seconds)
  walkPets(seconds)
  turnClock()
  renderer.render(scene, camera)
  track()
}

function stop() {
  cancelAnimationFrame(frame)
  resize?.disconnect()
  look?.dispose()
  opener?.dispose()
  if (bookMeshes) disposeBooks(bookMeshes)
  renderer?.dispose()
  renderer = null
}

// --- Pinning HTML onto the room --------------------------------------------------------------
const corner = new THREE.Vector3()
const projected = new THREE.Vector3()

// Where `box` covers the screen, as a rect in px (clamped to the room), or null when it is
// behind you or out of view.
function screenRect(box) {
  const { clientWidth: width, clientHeight: height } = root.value
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity
  let inFront = 0
  for (let i = 0; i < 8; i += 1) {
    corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z)
    projected.copy(corner).project(camera)
    if (projected.z > 1) continue
    inFront += 1
    const x = ((projected.x + 1) / 2) * width
    const y = ((1 - projected.y) / 2) * height
    left = Math.min(left, x)
    right = Math.max(right, x)
    top = Math.min(top, y)
    bottom = Math.max(bottom, y)
  }
  // part of it behind you: what is in front still gets a button
  if (!inFront) return null
  left = Math.max(0, left)
  top = Math.max(0, top)
  right = Math.min(width, right)
  bottom = Math.min(height, bottom)
  if (right - left < 4 || bottom - top < 4) return null
  return { left, top, width: right - left, height: bottom - top }
}

// Where `point` is on screen, and how many px a metre is there; null when out of view or when
// furniture stands in front of it.
function screenPoint(point) {
  projected.copy(point).project(camera)
  if (projected.z > 1 || Math.abs(projected.x) > 1.2 || Math.abs(projected.y) > 1.2) return null
  const distance = camera.position.distanceTo(point)
  if (hiddenBehindFurniture(point, distance)) return null
  const { clientWidth: width, clientHeight: height } = root.value
  const perMetre = height / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / distance
  return { x: ((projected.x + 1) / 2) * width, y: ((1 - projected.y) / 2) * height, perMetre }
}

// on screen with room to spare, not just peeking in at an edge
function wellInView(point) {
  projected.copy(point).project(camera)
  return projected.z < 1 && Math.abs(projected.x) < 0.8 && Math.abs(projected.y) < 0.8
}

function hiddenBehindFurniture(point, distance) {
  const direction = point.clone().sub(camera.position).normalize()
  raycaster.set(camera.position, direction)
  raycaster.far = distance - 0.08
  return raycaster.intersectObjects(room.value.solids, false).length > 0
}

function anchorFor(key) {
  const [kind, id] = key.split(/:(.*)/)
  const spots = room.value
  if (kind === 'hit') return { box: spots.hits[id] }
  if (kind === 'outside') return { box: spots.windowView }
  if (kind === 'book') return { box: shelved.value.find((entry) => String(entry.book.id) === id)?.box }
  if (kind === 'slot') {
    const slot = spots.slots.find((entry) => entry.id === id)
    return slot && { point: slot.point, height: PIN_HEIGHT.slot }
  }
  if (kind === 'item') {
    const item = placed.value.find((entry) => String(entry.uid) === id)
    if (!item) return null
    const meta = decorMeta(item.id)
    if (meta?.pet) return pets.has(item.uid) && { point: pets.get(item.uid).position, height: PIN_HEIGHT.pet, pet: pets.get(item.uid) }
    const slot = slotOf(item)
    return slot && { point: slot.point, height: meta?.surface === 'floor' ? PIN_HEIGHT.floor : PIN_HEIGHT.shelf }
  }
  return null
}

const lift = new THREE.Vector3()

// Moves every pinned element onto the room. Reads all sizes first and writes after, so the
// browser lays the page out once a frame, not once an element.
function track() {
  const pins = [...(root.value?.querySelectorAll('[data-pin]') ?? [])]
  const moves = pins.map((el) => {
    const anchor = anchorFor(el.dataset.pin)
    if (anchor?.box) return { el, rect: screenRect(anchor.box) }
    if (!anchor?.point) return { el }
    // a pinned drawing stands on its point: check from the middle of it, so a piece standing
    // just behind the edge of a table still shows
    lift.copy(anchor.point).setY(anchor.point.y + anchor.height / 2)
    const spot = screenPoint(lift)
    return spot && { el, spot, anchor, natural: el.offsetHeight || 40 }
  })
  for (const move of moves) {
    if (!move) continue
    const { el, rect, spot, anchor, natural } = move
    show(el, rect || spot)
    if (rect) {
      Object.assign(el.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` })
    } else if (spot) {
      // drawn at its own size, then scaled to how tall it stands at that distance
      const tall = anchor.height * spot.perMetre
      el.style.left = `${spot.x}px`
      el.style.top = `${spot.y + tall / 2}px`
      el.style.setProperty('--scale', String(tall / natural))
      if (anchor.pet) el.dataset.face = anchor.pet.face
    }
  }
  // pins whose anchor went away (or never had one) stay hidden
  pins.forEach((el, i) => {
    if (!moves[i] || (!moves[i].rect && !moves[i].spot)) show(el, false)
  })
}

function show(el, visible) {
  el.style.visibility = visible ? 'visible' : 'hidden'
}

// --- Taps ------------------------------------------------------------------------------------
// A press that turned into a drag to look around is not a tap.
function tap(id) {
  if (look?.wasDrag()) return
  faceTowards(id)
  if (id === 'chair') emit('open-book')
  else if (id === 'corkboard') emit('quote')
}

// The book comes off the shelf and opens; its details are asked for once it lies open.
async function tapBook(book) {
  if (look?.wasDrag() || bookPhase.value !== 'closed') return
  const mesh = books.find((child) => child.userData.bookId === book.id)
  if (!opener || !mesh || prefersReducedMotion()) {
    emit('pick-book', book)
    return
  }
  bookPhase.value = 'opening'
  // it leaves from where it was lifted to, and comes back there
  takenOut = mesh
  await opener.open(mesh, book)
  bookPhase.value = 'open'
  emit('pick-book', book)
}

// Puts the book that is out back on the shelf, or fades it when it has been taken off the
// shelf for good. Resolves once it is gone.
async function putBack({ removed = false } = {}) {
  if (bookPhase.value === 'closed') return
  bookPhase.value = 'closing'
  await (removed ? opener.fade() : opener.close())
  bookPhase.value = 'closed'
  takenOut = null
  pointedAt = null
  if (relayout) {
    relayout = false
    placeBooks()
  }
}

function placeAt(slot) {
  const name = placingMeta.value?.name
  if (placeOn(slot.zone, slot.x)) flash(`${name} is ${ZONE_NAMES[slot.zone]}.`, 'ok')
}

function pickItem(uid) {
  if (look?.wasDrag()) return
  pick(uid)
}

// The bar of places turns to face each one. On the still picture there is nothing to turn,
// so the places that open something open it.
function goTo(id) {
  if (still.value || !ready.value) {
    if (id === 'bookshelf') emit('list-books')
    else if (id === 'chair') emit('open-book')
    else if (id === 'corkboard') emit('quote')
    return
  }
  faceTowards(id)
  canvas.value.focus({ preventScroll: true })
}

// Turns to a place, zoomed so it fills most of the view. At the bookcase it turns to the reader's
// books and their shelves' plates (an empty shelf's too), so they are big enough to pick one.
function faceTowards(id) {
  const filled = id === 'bookshelf' && books.length
  const box = filled ? new THREE.Box3().setFromObject(bookMeshes) : room.value.hits[id]
  look.lookAt(box.getCenter(new THREE.Vector3()), fovToFit(box))
}

// the field of view, in degrees, at which `box` fills about three quarters of the view
function fovToFit(box) {
  const size = box.getSize(new THREE.Vector3())
  const distance = camera.position.distanceTo(box.getCenter(new THREE.Vector3()))
  const tall = Math.max(size.y, Math.hypot(size.x, size.z) / camera.aspect) * 1.3
  return THREE.MathUtils.radToDeg(2 * Math.atan(tall / 2 / distance))
}

// A piece dragged out of the inventory and let go at (x, y): put it on the free spot nearest
// there, if one is close. Returns the spot, or null.
function dropAt(entry, x, y) {
  const meta = decorMeta(entry.id)
  if (!meta || !room.value || still.value) return null
  const rect = root.value.getBoundingClientRect()
  let best = null
  for (const slot of room.value.slots) {
    if ((meta.surface === 'floor') !== (slot.zone === 'room') || takenSlot(slot)) continue
    const spot = screenPoint(slot.point)
    if (!spot) continue
    const gap = Math.hypot(spot.x + rect.left - x, spot.y + rect.top - y)
    if (gap < 70 && (!best || gap < best.gap)) best = { slot, gap }
  }
  if (!best || !placeOn(best.slot.zone, best.slot.x, entry)) return null
  return { ...best.slot, name: ZONE_NAMES[best.slot.zone] }
}

// --- Pets ------------------------------------------------------------------------------------
// Each pet walks from one floor point to another, waits a moment, and picks the next.
function walkPets(seconds) {
  const walks = room.value.walks
  if (!walks.length) return
  const live = new Set(placed.value.filter(isPet).map((item) => item.uid))
  for (const uid of pets.keys()) if (!live.has(uid)) pets.delete(uid)
  for (const uid of live) {
    if (!pets.has(uid)) {
      const from = walks[Math.floor(Math.random() * walks.length)]
      pets.set(uid, { position: from.clone(), target: from, wait: Math.random() * 2, face: 'right' })
    }
    const pet = pets.get(uid)
    if (pet.wait > 0) {
      pet.wait -= seconds
      continue
    }
    const step = pet.target.clone().sub(pet.position)
    const left = step.length()
    if (left < 0.02) {
      pet.target = walks[Math.floor(Math.random() * walks.length)]
      pet.wait = 1 + Math.random() * 3
      continue
    }
    const before = projected.copy(pet.position).project(camera).x
    pet.position.add(step.multiplyScalar(Math.min(1, (PET_SPEED * seconds) / left)))
    const after = projected.copy(pet.position).project(camera).x
    if (Math.abs(after - before) > 1e-4) pet.face = after > before ? 'right' : 'left'
  }
}

// --- Clock -----------------------------------------------------------------------------------
const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Singapore',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})
let clockOffset = 0
let clockTimer = 0

function readClock() {
  const parts = formatter.formatToParts(new Date(Date.now() + clockOffset))
  const read = (type) => Number(parts.find((part) => part.type === type)?.value) || 0
  return { hours: read('hour'), minutes: read('minute'), seconds: read('second') }
}

function setTime() {
  const { hours, minutes } = readClock()
  time.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

// the hands are drawn pointing at 12; turning about z (the clock's face) moves them clockwise
function turnClock() {
  const { hour, minute } = room.value.clock
  if (!hour || !minute) return
  const { hours, minutes, seconds } = readClock()
  minute.rotation.z = ((minutes + seconds / 60) / 60) * Math.PI * 2
  hour.rotation.z = (((hours % 12) + minutes / 60) / 12) * Math.PI * 2
}

// Picking a piece to place turns the room to the first free spot it can go on, unless one is
// already in view, so there is always somewhere to tap.
watch(placing, async (entry) => {
  if (!entry || !ready.value) return
  await nextTick()
  const inView = freeSlots.value.some((slot) => wellInView(slot.point))
  const first = freeSlots.value[0]
  if (!inView && first) look.lookAt(first.point, 60)
})

// a new book, a new title, or a book moved to another shelf re-stands the books
watch(
  () => props.books.map((book) => `${book.id}:${book.title}:${book.status}`).join('|'),
  () => placeBooks(),
)
watch(
  () => props.weather,
  (weather) => lighting?.apply(weather),
  { deep: true },
)

onMounted(async () => {
  setTime()
  clockTimer = window.setInterval(setTime, 1000)
  start()
  const now = await fetchSingaporeTime()
  if (Number.isFinite(now.unix)) clockOffset = now.unix * 1000 - Date.now()
  setTime()
})

onBeforeUnmount(() => {
  window.clearInterval(clockTimer)
  stop()
})

defineExpose({ dropAt, putBack })
</script>

<style scoped>
.room3d {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: #e6d6c3;
  /* the room's own drag, pinch and zoom; the page must not scroll or zoom instead */
  touch-action: none;
  user-select: none;
}

/* behind the canvas; placed over the window glass by `track` */
.room3d__outside {
  pointer-events: none;
}

.room3d__still,
.room3d__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.room3d__still {
  object-fit: cover;
  object-position: 50% 60%;
  transition: opacity 0.4s ease;
}

.room3d.is-ready .room3d__still {
  opacity: 0;
  pointer-events: none;
}

.room3d__canvas {
  display: block;
  outline: none;
  cursor: grab;
}

.room3d__canvas:active {
  cursor: grabbing;
}

.room3d__canvas:focus-visible {
  box-shadow: inset 0 0 0 3px var(--rl-primary);
}

.room3d__layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.room3d__pin {
  position: absolute;
  visibility: hidden;
  pointer-events: auto;
}

/* the furniture is the picture; its button is an invisible box over it that glows when aimed at */
.room3d__hit {
  padding: 0;
  border: 0;
  border-radius: 14px;
  background: none;
  cursor: pointer;
  transition: box-shadow 0.25s ease, background-color 0.25s ease;
}

.room3d__hit:hover,
.room3d__hit:focus-visible,
.room3d__hit[aria-expanded='true'] {
  background-color: rgba(255, 246, 220, 0.12);
  box-shadow: 0 0 18px 4px rgba(255, 238, 200, 0.5);
  outline: none;
}

.room3d__book {
  border-radius: 2px;
}

/* a book answers a pointer by lifting out of its shelf (drawn in the room), not with a glow;
   keyboard focus still gets a ring round it */
.room3d__book:hover,
.room3d__book:focus-visible {
  background-color: transparent;
  box-shadow: none;
}

.room3d__book:focus-visible {
  outline: 2px solid rgba(255, 238, 200, 0.85);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .room3d__book:hover {
    background-color: rgba(255, 246, 220, 0.12);
    box-shadow: 0 0 18px 4px rgba(255, 238, 200, 0.5);
  }
}

.room3d__hint {
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

.room3d__hit:hover .room3d__hint,
.room3d__hit:focus-visible .room3d__hint {
  transform: translateX(-50%);
  opacity: 1;
}

.room3d__window,
.room3d [data-tour='clock'] {
  pointer-events: none;
}

.room3d__temp {
  position: absolute;
  top: 10%;
  right: 10%;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(44, 36, 30, 0.35);
  font-family: var(--font-serif);
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}


.room3d__note {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card);
  background: rgba(255, 253, 249, 0.92);
  font-size: 12px;
  text-align: center;
  color: var(--rl-muted);
}

.room3d__note strong {
  font-family: var(--rl-font-title);
  font-size: 14px;
  color: var(--rl-text);
}

.room3d__note a {
  font-weight: 700;
}

/* a decoration or pet: the shop drawing, standing on its spot, scaled to how tall it would be
   there (--scale, set as the room turns) */
.placed {
  padding: 0;
  border: 0;
  background: none;
  transform: translate(-50%, -100%) scale(var(--scale, 1));
  transform-origin: 50% 100%;
  cursor: pointer;
}

.placed__pop {
  display: block;
  filter: drop-shadow(0 3px 1px rgba(63, 46, 36, 0.28));
}

.placed.is-pet[data-face='left'] .placed__pop {
  transform: scaleX(-1);
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

/* a free spot for the piece being placed */
.room3d__slot {
  width: 44px;
  height: 44px;
  padding: 0;
  /* the glow stays a finger's size wherever the spot is */
  transform: translate(-50%, -75%);
  border: 2px solid rgba(255, 253, 249, 0.9);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(243, 212, 138, 0.85), rgba(243, 212, 138, 0.2) 70%);
  box-shadow: 0 0 16px 4px rgba(243, 212, 138, 0.7);
  cursor: pointer;
  animation: slot-glow 1.4s ease-in-out infinite;
}

@keyframes slot-glow {
  50% {
    box-shadow: 0 0 6px 1px rgba(243, 212, 138, 0.4);
  }
}

.room3d__skip {
  position: absolute;
  inset: 0;
  z-index: 5;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

.room3d__placing {
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

.room3d__cancel {
  padding: 3px 10px;
  border: 1px solid var(--rl-line);
  border-radius: 999px;
  background: none;
  font-size: 11px;
  font-weight: 700;
  color: var(--rl-primary);
}

/* the bar of places, along the bottom left, clear of the room menu button */
.room3d__places {
  position: absolute;
  bottom: 18px;
  left: 10px;
  right: 76px;
  z-index: 3;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}

.room3d__place {
  flex: none;
  padding: 6px 11px;
  border: 1px solid rgba(255, 253, 249, 0.6);
  border-radius: 999px;
  background: rgba(63, 46, 36, 0.55);
  font-size: 12px;
  font-weight: 700;
  color: var(--rl-surface);
  backdrop-filter: blur(4px);
}

.room3d__place:hover,
.room3d__place:focus-visible {
  background: var(--rl-primary);
}

.room3d__readout {
  position: absolute;
  top: 12px;
  left: 12px;
  margin: 0;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--rl-surface);
  font-size: 12px;
  font-weight: 700;
  color: var(--rl-primary);
}

@media (prefers-reduced-motion: reduce) {
  .room3d__slot {
    animation: none;
  }

  .room3d__hit,
  .room3d__hint,
  .room3d__still {
    transition: none;
  }
}
</style>
