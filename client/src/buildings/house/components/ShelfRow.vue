<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// One shelf on My Shelf, drawn as a shelf tier (the genre page's part: a header card with its
// name, the covers, and a plank under them), whose sideways row of covers scrolls the way the reader
// is used to on each device: a finger or trackpad swipe, Shift + wheel, a mouse drag, the
// scrollbar, Previous / Next buttons, and the arrow keys from cover to cover (the row is one tab
// stop). A plain wheel is left to the page. Emits `select` with the book whose cover is clicked.
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import BookTile from '@/components/BookTile.vue'
import ShelfTier from '@/components/ShelfTier.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import { prefersReducedMotion } from '@/lib/motion'

const props = defineProps({
  title: { type: String, required: true },
  // the shelf's name, for the buttons ("Next books in To be read")
  shelf: { type: String, required: true },
  emoji: { type: String, default: '📚' },
  books: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  empty: { type: String, default: 'No books here yet.' },
})

const emit = defineEmits(['select'])

const SKELETON_CARDS = 6
// a mouse moved this many pixels with the button down is a drag, not a click
const DRAG = 5
// Next / Previous move this share of the row's width
const PAGE = 0.85

const list = ref(null)
const atStart = ref(true)
const atEnd = ref(true)
// the cover that takes the row's one tab stop
const active = ref(0)

function update() {
  const el = list.value
  if (!el) return
  const most = el.scrollWidth - el.clientWidth
  atStart.value = el.scrollLeft <= 1
  atEnd.value = el.scrollLeft >= most - 1
}

function page(direction) {
  const el = list.value
  el.scrollBy({ left: direction * el.clientWidth * PAGE, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

// --- A mouse drag scrolls the row, and doesn't open the book it started on ----------------------
let drag = null
let dragged = false

function onPointerDown(event) {
  if (event.pointerType !== 'mouse' || event.button !== 0) return
  drag = { x: event.clientX, left: list.value.scrollLeft, moved: false }
  dragged = false
}

function onPointerMove(event) {
  if (!drag) return
  const dx = event.clientX - drag.x
  if (!drag.moved && Math.abs(dx) < DRAG) return
  if (!drag.moved) list.value.setPointerCapture?.(event.pointerId)
  drag.moved = true
  list.value.scrollLeft = drag.left - dx
}

function onPointerUp() {
  dragged = Boolean(drag?.moved)
  drag = null
}

function onClickCapture(event) {
  if (!dragged) return
  dragged = false
  event.preventDefault()
  event.stopPropagation()
}

// --- Keyboard: Left / Right from cover to cover ------------------------------------------------
function coverAt(index) {
  return list.value?.querySelectorAll('.book-tile')[index]
}

// Left / Right to the neighbouring cover, Home / End to the first and last
function onKeydown(event) {
  const last = props.books.length - 1
  const to = { ArrowLeft: active.value - 1, ArrowRight: active.value + 1, Home: 0, End: last }[event.key]
  if (to === undefined) return
  event.preventDefault()
  active.value = Math.max(0, Math.min(last, to))
  coverAt(active.value)?.focus()
}

function onFocusIn(event) {
  const covers = [...(list.value?.querySelectorAll('.book-tile') ?? [])]
  const index = covers.indexOf(event.target)
  if (index < 0) return
  active.value = index
  event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

let resize = null
onMounted(() => {
  resize = new ResizeObserver(update)
  watch(
    list,
    (el, old) => {
      if (old) resize.unobserve(old)
      if (el) {
        resize.observe(el)
        update()
      }
    },
    { immediate: true },
  )
})
onBeforeUnmount(() => resize?.disconnect())

watch(
  () => props.books.length,
  async (length) => {
    if (active.value >= length) active.value = Math.max(0, length - 1)
    await nextTick()
    update()
  },
)
</script>

<template>
  <ShelfTier class="shelf-row" :label="title" :emoji="emoji" :level="2">
    <template #actions>
      <div v-if="!loading && books.length && !(atStart && atEnd)" class="shelf-row__pager">
        <button
          type="button"
          class="btn btn-secondary btn-icon shelf-row__page"
          :aria-label="`Previous books in ${shelf}`"
          :disabled="atStart"
          @click="page(-1)"
        >
          ‹
        </button>
        <button
          type="button"
          class="btn btn-secondary btn-icon shelf-row__page"
          :aria-label="`Next books in ${shelf}`"
          :disabled="atEnd"
          @click="page(1)"
        >
          ›
        </button>
      </div>
    </template>

    <div v-if="loading" class="shelf-row__list shelf-row__list--loading">
      <div v-for="n in SKELETON_CARDS" :key="n" class="shelf-row__item">
        <SkeletonBlock height="150px" radius="10px" class="mb-2" />
        <SkeletonBlock width="85%" height="10px" class="mb-1" />
        <SkeletonBlock width="55%" height="10px" />
      </div>
    </div>

    <p v-else-if="!books.length" class="shelf-row__empty">{{ empty }}</p>

    <ul
      v-else
      ref="list"
      class="shelf-row__list"
      @scroll.passive="update"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @click.capture="onClickCapture"
      @keydown="onKeydown"
      @focusin="onFocusIn"
      @dragstart.prevent
    >
      <li v-for="(book, index) in books" :key="book.id" class="shelf-row__item">
        <BookTile :book="book" :tabindex="index === active ? 0 : -1" @select="emit('select', $event)" />
      </li>
    </ul>
  </ShelfTier>
</template>

<style scoped>
.shelf-row__pager {
  display: flex;
  gap: 8px;
}

.shelf-row__page {
  font-size: 20px;
}

.shelf-row__list {
  display: flex;
  gap: 12px;
  margin: 0;
  padding: 2px 2px 10px;
  list-style: none;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  /* covers snap to just inside the padding, so the row starts unscrolled */
  scroll-padding-inline: 2px;
  scrollbar-width: thin;
  scrollbar-color: var(--rl-line) transparent;
  cursor: grab;
}

.shelf-row__list:active {
  cursor: grabbing;
}

.shelf-row__list--loading {
  overflow: hidden;
  cursor: default;
}

.shelf-row__item {
  flex: 0 0 108px;
  scroll-snap-align: start;
}

.shelf-row__item :deep(.book-tile) {
  cursor: pointer;
}

.shelf-row__item :deep(.book-tile img) {
  -webkit-user-drag: none;
}

.shelf-row__empty {
  margin: 0;
  font-size: 0.9rem;
  color: var(--rl-muted);
}
</style>
