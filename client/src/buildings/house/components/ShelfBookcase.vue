<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// My Shelf's bookcase, drawn the way the Library draws an opened bookcase (a thick frame in its
// wood with the town's dark outline and a hard shadow, a dark back), with exactly three shelves:
// one per reading status, top to bottom. The page owns the books and filters them; this only
// stands them up. Emits `select` with a book once it has slid out of its shelf.
// When `draggable`, a book picked up off a shelf is carried under the pointer, the shelf under it
// lights up, and letting go over another shelf emits `move` with { book, status }. Let go anywhere
// else, or press Escape, and it goes back. Held near the top or bottom of the page's scrolling
// area, the book scrolls the page, so a shelf out of view can be reached on a phone.
import { computed, onBeforeUnmount, ref } from 'vue'
import BookCover from '@/components/BookCover.vue'
import BookcaseShelf from '@/buildings/house/components/BookcaseShelf.vue'

const props = defineProps({
  // [{ status, label, books }], top to bottom
  shelves: { type: Array, required: true },
  // spines or covers
  mode: { type: String, default: 'spines' },
  loading: { type: Boolean, default: false },
  // what an empty shelf says
  empty: { type: String, default: 'No books here yet.' },
  // the id of the book whose card is open: it stays slid out until the card closes
  openBook: { type: String, default: null },
  // the bookcase's colours (bookcaseColours in bookcase.js): frame, its light and dark edges, the
  // back, and the shelves' plates
  wood: { type: Object, required: true },
  // whether books can be moved from shelf to shelf (the reader's own shelf)
  draggable: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'move'])

// a carried book this close to the top or bottom of the scrolling area scrolls it (px), at up to
// EDGE_SPEED px a frame
const EDGE = 60
const EDGE_SPEED = 14

const root = ref(null)
// the book being carried: what pickup told us, which shelf it came from, and where the pointer is
const held = ref(null)
// the status of the shelf a carried book would land on now, or null
const target = ref(null)

const woodStyle = computed(() => {
  const { frame, light, dark, back, plate } = props.wood
  return { '--case-frame': frame, '--case-light': light, '--case-dark': dark, '--case-back': back, '--case-plate': plate }
})

const heldStyle = computed(() => {
  const { width, height, grip, at, look } = held.value
  return {
    width: `${width}px`,
    height: `${height}px`,
    left: `${at.x - grip.x}px`,
    top: `${at.y - grip.y}px`,
    background: look.background,
    color: look.color,
  }
})

// the shelf of this bookcase under (x, y), if any
function shelfAt(x, y) {
  const shelf = document.elementFromPoint(x, y)?.closest('[data-shelf]')
  return shelf && root.value?.contains(shelf) ? shelf.dataset.shelf : null
}

// the nearest box around the bookcase that scrolls up and down (the page)
function scroller() {
  for (let el = root.value?.parentElement; el; el = el.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight) return el
  }
  return null
}

// --- Scrolling the page while a book is held near its top or bottom edge -----------------------
let edgeFrame = 0

function edgeScroll() {
  edgeFrame = 0
  const area = scroller()
  if (!held.value || !area) return
  const box = area.getBoundingClientRect()
  const top = Math.max(box.top, 0)
  const bottom = Math.min(box.bottom, window.innerHeight)
  const { y } = held.value.at
  let step = 0
  if (y < top + EDGE) step = -EDGE_SPEED * Math.min(1, (top + EDGE - y) / EDGE)
  else if (y > bottom - EDGE) step = EDGE_SPEED * Math.min(1, (y - (bottom - EDGE)) / EDGE)
  if (!step) return
  const before = area.scrollTop
  area.scrollTop += step
  if (area.scrollTop === before) return
  aim()
  edgeFrame = window.requestAnimationFrame(edgeScroll)
}

// the browser mustn't pan the page under a finger carrying a book
function holdStill(event) {
  if (event.cancelable) event.preventDefault()
}

function onPickup(from, detail) {
  held.value = { ...detail, from }
  target.value = null
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onDrop)
  window.addEventListener('pointercancel', putBack)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('touchmove', holdStill, { passive: false })
}

// Escape: the book goes back where it was
function onKeydown(event) {
  if (event.key === 'Escape') putBack()
}

function onMove(event) {
  held.value.at = { x: event.clientX, y: event.clientY }
  aim()
  if (!edgeFrame) edgeFrame = window.requestAnimationFrame(edgeScroll)
}

// which shelf the carried book would land on now (none when it's over its own)
function aim() {
  const { x, y } = held.value.at
  const over = shelfAt(x, y)
  target.value = over === held.value.from ? null : over
}

function onDrop(event) {
  onMove(event)
  const { book } = held.value
  const status = target.value
  putBack()
  if (status) emit('move', { book, status })
}

function putBack() {
  held.value = null
  target.value = null
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onDrop)
  window.removeEventListener('pointercancel', putBack)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('touchmove', holdStill)
  window.cancelAnimationFrame(edgeFrame)
  edgeFrame = 0
}

onBeforeUnmount(putBack)
</script>

<template>
  <div ref="root" class="bookcase" :style="woodStyle">
    <div class="bookcase__inside">
      <BookcaseShelf
        v-for="shelf in shelves"
        :key="shelf.status"
        :status="shelf.status"
        :label="shelf.label"
        :books="shelf.books"
        :mode="mode"
        :loading="loading"
        :empty="empty"
        :open-book="openBook"
        :draggable="draggable"
        :held-book="held?.from === shelf.status ? held.book.id : null"
        :target="target === shelf.status"
        @select="emit('select', $event)"
        @pickup="onPickup(shelf.status, $event)"
      />
    </div>

    <!-- the book being carried, under the pointer -->
    <Teleport to="body">
      <div v-if="held" class="bookcase__held" :class="`bookcase__held--${held.kind}`" :style="heldStyle" aria-hidden="true">
        <BookCover v-if="held.kind === 'cover'" class="bookcase__held-cover" :cover-url="held.book.coverUrl" :title="held.book.title" :seed="held.book.id" />
        <span v-else class="bookcase__held-title">{{ held.book.title }}</span>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* The bookcase: a thick frame in its wood, the town's dark outline round it and a hard shadow,
   like the Library's. Kept narrow on a wide screen so it stands like furniture. */
.bookcase {
  max-width: 680px;
  margin: 0 auto;
  padding: 22px 16px 26px;
  border: 2px solid #1e1a24;
  background: var(--case-frame);
  box-shadow:
    inset 0 4px 0 var(--case-light),
    inset 4px 0 0 var(--case-light),
    inset 0 -4px 0 var(--case-dark),
    inset -4px 0 0 var(--case-dark),
    5px 5px 0 rgba(30, 26, 36, 0.35);
}

.bookcase__inside {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: 2px solid #1e1a24;
  background: var(--case-back);
}

/* The carried book: a copy of it, tilted a little, with a hard pixel shadow, over everything and
   never in the pointer's way. */
.bookcase__held {
  position: fixed;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #1e1a24;
  box-shadow: 6px 6px 0 rgba(30, 26, 36, 0.35);
  transform: rotate(-4deg);
  pointer-events: none;
}

.bookcase__held--spine .bookcase__held-title {
  max-height: 100%;
  overflow: hidden;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 16px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookcase__held--flat {
  justify-content: flex-start;
  padding: 0 10px;
}

.bookcase__held--flat .bookcase__held-title {
  overflow: hidden;
  font-size: 14px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookcase__held-cover {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 0;
  object-fit: cover;
}
</style>
