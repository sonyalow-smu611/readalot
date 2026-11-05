<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// One shelf of My Shelf's bookcase: its books standing as the Library's bookcase stands them
// (spines with their titles up them, now and then two lying flat, the last one leaning; or covers
// face out), and a
// plank under them with a plate naming the shelf and its count. The shelf is one line that scrolls
// sideways the way the reader is used to on each device: a finger or trackpad swipe, Shift +
// wheel, a mouse drag, the scrollbar, Previous / Next buttons on the plank, and the arrow keys
// from book to book (the shelf is one tab stop). A plain wheel is left to the page.
// A tapped book slides up out of the shelf, then `select` is emitted with it. When the shelf is
// `draggable`, pulling a book up or down out of it with the mouse, or pressing and holding it with a
// finger, picks it up instead: `pickup` is emitted with the book, where it was grabbed and how it
// looks, and the bookcase carries it.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import BookCover from '@/components/BookCover.vue'
import { prefersReducedMotion } from '@/lib/motion'
import { leansLast, shelfItems } from '@/buildings/house/bookcase.js'

const props = defineProps({
  status: { type: String, required: true },
  label: { type: String, required: true },
  books: { type: Array, default: () => [] },
  // spines or covers
  mode: { type: String, default: 'spines' },
  loading: { type: Boolean, default: false },
  empty: { type: String, default: 'No books here yet.' },
  // the id of the book whose card is open: it stays slid out until the card closes
  openBook: { type: String, default: null },
  // whose books can be picked up and moved to another shelf (not a visited reader's)
  draggable: { type: Boolean, default: false },
  // the id of the book being carried from this shelf: its place stays, empty
  heldBook: { type: String, default: null },
  // a carried book is over this shelf, and would move here if let go
  target: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'pickup'])

const SKELETON_SPINES = 8
// a mouse moved this many pixels with the button down is a drag, not a click
const DRAG = 5
// Next / Previous move this share of the shelf's width
const PAGE = 0.85
// how long a book takes to slide out before its card opens (ms)
const PULL_MS = 240
// a finger held this long on a book, moving no more than HOLD_SLOP px, picks it up (ms)
const HOLD_MS = 400
const HOLD_SLOP = 8

const list = ref(null)
const width = ref(0)
const atStart = ref(true)
const atEnd = ref(true)
// the book that takes the shelf's one tab stop
const active = ref(0)
const pulling = ref(null)

const count = computed(() => props.books.length)
const regionName = computed(() => `${props.label}, ${count.value} ${count.value === 1 ? 'book' : 'books'}`)
const layout = computed(() => shelfItems(props.books, props.mode, props.status))
const leaning = computed(() => leansLast(layout.value.items, width.value, props.mode))

function nameOf(book) {
  const by = book.authors?.length ? ` by ${book.authors.join(', ')}` : ''
  return `${book.title}${by}`
}

// the books in the order they're drawn (a stack from the top down), for the arrow keys and the
// one tab stop
const order = computed(() => layout.value.items.flatMap((item) => (item.kind === 'stack' ? [...item.books].reverse() : [item.book])))
const tabIndex = (book) => (order.value[active.value]?.id === book.id ? 0 : -1)

function spineStyle(item) {
  return { width: `${item.width}px`, height: `${item.height}px`, '--spine': item.colour, color: item.ink }
}

// the k-th book of a stack, from the bottom
function flatStyle(item, k) {
  return { width: `${item.widths[k]}px`, '--spine': item.colours[k], color: item.inks[k] }
}

const isOut = (book) => pulling.value === book.id || props.openBook === book.id
const isHeld = (book) => props.heldBook === book.id

// The book slides out of the shelf, then its card opens.
function pull(book) {
  if (pulling.value) return
  if (prefersReducedMotion()) {
    emit('select', book)
    return
  }
  pulling.value = book.id
  window.setTimeout(() => {
    pulling.value = null
    emit('select', book)
  }, PULL_MS)
}

function update() {
  const el = list.value
  if (!el) return
  width.value = el.clientWidth
  const most = el.scrollWidth - el.clientWidth
  atStart.value = el.scrollLeft <= 1
  atEnd.value = el.scrollLeft >= most - 1
}

function page(direction) {
  const el = list.value
  el.scrollBy({ left: direction * el.clientWidth * PAGE, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

// --- A mouse drag scrolls the shelf sideways, or picks a book up when it pulls up or down -------
// Neither opens the book it started on.
let drag = null
let dragged = false
// a finger resting on a book, waiting to pick it up
let hold = null

function bookUnder(event) {
  const el = event.target.closest?.('[data-book-id]')
  const book = el && props.books.find((one) => one.id === el.dataset.bookId)
  return { el, book }
}

function onPointerDown(event) {
  dragged = false
  cancelHold()
  if (event.pointerType !== 'mouse') {
    holdBook(event)
    return
  }
  if (event.button !== 0) return
  drag = { x: event.clientX, y: event.clientY, left: list.value.scrollLeft, moved: false, ...bookUnder(event) }
}

// A finger (or pen) held still on a book picks it up; moving first leaves it to the browser,
// which scrolls the shelf or the page.
function holdBook(event) {
  const { el, book } = bookUnder(event)
  if (!props.draggable || !book) return
  const at = { x: event.clientX, y: event.clientY }
  hold = {
    ...at,
    timer: window.setTimeout(() => {
      hold = null
      navigator.vibrate?.(15)
      pickUp({ ...at, el, book }, { clientX: at.x, clientY: at.y })
      // the press that picked it up mustn't open it when it's let go
      dragged = true
    }, HOLD_MS),
  }
}

function cancelHold() {
  if (hold) window.clearTimeout(hold.timer)
  hold = null
}

// The book under the pointer, lifted off the shelf: what it is, where on it the pointer holds it,
// and how it looks, for the bookcase to carry.
function pickUp(drag, event) {
  const { el, book } = drag
  const rect = el.getBoundingClientRect()
  const style = getComputedStyle(el)
  const kind = el.classList.contains('shelf__cover') ? 'cover' : el.classList.contains('shelf__flat') ? 'flat' : 'spine'
  emit('pickup', {
    book,
    kind,
    width: rect.width,
    height: rect.height,
    // where the pointer holds it, from its top left corner
    grip: { x: drag.x - rect.left, y: drag.y - rect.top },
    at: { x: event.clientX, y: event.clientY },
    look: { background: style.backgroundColor, color: style.color },
  })
}

function onPointerMove(event) {
  if (hold && Math.hypot(event.clientX - hold.x, event.clientY - hold.y) > HOLD_SLOP) cancelHold()
  if (!drag) return
  const dx = event.clientX - drag.x
  const dy = event.clientY - drag.y
  if (!drag.moved && Math.hypot(dx, dy) < DRAG) return
  if (!drag.moved && props.draggable && drag.book && Math.abs(dy) > Math.abs(dx)) {
    pickUp(drag, event)
    drag = null
    // the press that picked it up mustn't open it when it's let go
    dragged = true
    return
  }
  if (!drag.moved) list.value.setPointerCapture?.(event.pointerId)
  drag.moved = true
  list.value.scrollLeft = drag.left - dx
}

function onPointerUp() {
  cancelHold()
  dragged = dragged || Boolean(drag?.moved)
  drag = null
}

function onClickCapture(event) {
  if (!dragged) return
  dragged = false
  event.preventDefault()
  event.stopPropagation()
}

// --- Keyboard: Left / Right from book to book --------------------------------------------------
function bookAt(index) {
  return list.value?.querySelectorAll('[data-book-id]')[index]
}

// Left / Right to the neighbouring book, Home / End to the first and last
function onKeydown(event) {
  const last = order.value.length - 1
  const to = { ArrowLeft: active.value - 1, ArrowRight: active.value + 1, Home: 0, End: last }[event.key]
  if (to === undefined) return
  event.preventDefault()
  active.value = Math.max(0, Math.min(last, to))
  bookAt(active.value)?.focus()
}

function onFocusIn(event) {
  const books = [...(list.value?.querySelectorAll('[data-book-id]') ?? [])]
  const index = books.indexOf(event.target)
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
onBeforeUnmount(() => {
  resize?.disconnect()
  cancelHold()
})

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
  <section class="shelf" :class="{ 'is-target': target }" :data-shelf="status" :aria-label="regionName">
    <div class="shelf__space" :style="{ height: `${layout.height + 14}px` }">
      <div v-if="loading" class="shelf__line" aria-label="Loading books">
        <span v-for="n in SKELETON_SPINES" :key="n" class="shelf__ghost" :style="{ height: `${150 + ((n * 37) % 50)}px` }" />
      </div>

      <p v-else-if="!books.length" class="shelf__empty">{{ empty }}</p>

      <ul
        v-else
        ref="list"
        class="shelf__line"
        :class="`shelf__line--${mode}`"
        @scroll.passive="update"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @click.capture="onClickCapture"
        @keydown="onKeydown"
        @focusin="onFocusIn"
        @dragstart.prevent
        @contextmenu="draggable && $event.preventDefault()"
      >
        <li
          v-for="(item, index) in layout.items"
          :key="item.kind === 'stack' ? item.books[0].id : item.book.id"
          class="shelf__item"
          :class="{ 'is-leaning': leaning && index === layout.items.length - 1 }"
        >
          <button
            v-if="item.kind === 'spine'"
            data-card
            type="button"
            class="shelf__spine"
            :class="[`shelf__spine--${item.band}`, { 'is-out': isOut(item.book), 'is-held': isHeld(item.book) }]"
            :style="spineStyle(item)"
            :data-book-id="item.book.id"
            :tabindex="tabIndex(item.book)"
            :aria-label="nameOf(item.book)"
            :title="item.book.title"
            @click="pull(item.book)"
          >
            <span class="shelf__spine-title">{{ item.book.title }}</span>
          </button>

          <button
            v-else-if="item.kind === 'cover'"
            data-card
            type="button"
            class="shelf__cover"
            :class="{ 'is-out': isOut(item.book), 'is-held': isHeld(item.book) }"
            :data-book-id="item.book.id"
            :tabindex="tabIndex(item.book)"
            :aria-label="nameOf(item.book)"
            :title="item.book.title"
            @click="pull(item.book)"
          >
            <BookCover class="shelf__cover-art" :cover-url="item.book.coverUrl" :title="item.book.title" :seed="item.book.id" />
          </button>

          <div v-else class="shelf__stack" :style="{ width: `${item.width}px` }">
            <button
              v-for="(book, k) in [...item.books].reverse()"
              :key="book.id"
              data-card
              type="button"
              class="shelf__flat"
              :class="{ 'is-out': isOut(book), 'is-held': isHeld(book) }"
              :style="flatStyle(item, item.books.length - 1 - k)"
              :data-book-id="book.id"
              :tabindex="tabIndex(book)"
              :aria-label="nameOf(book)"
              :title="book.title"
              @click="pull(book)"
            >
              <span class="shelf__flat-title">{{ book.title }}</span>
            </button>
          </div>
        </li>
      </ul>
    </div>

    <div class="shelf__plank">
      <span class="shelf__plate">{{ label }} · {{ count }}</span>
      <div v-if="!loading && books.length && !(atStart && atEnd)" class="shelf__pager">
        <button
          type="button"
          class="btn btn-secondary btn-icon btn-sm shelf__page"
          :aria-label="`Previous books in ${label}`"
          :disabled="atStart"
          @click="page(-1)"
        >
          ‹
        </button>
        <button
          type="button"
          class="btn btn-secondary btn-icon btn-sm shelf__page"
          :aria-label="`Next books in ${label}`"
          :disabled="atEnd"
          @click="page(1)"
        >
          ›
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* The space between two planks: the bookcase's back in shadow at the top, the books standing on
   the plank below. */
.shelf__space {
  position: relative;
  box-shadow: inset 0 14px 10px -10px rgba(0, 0, 0, 0.45);
}

.shelf__line {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 100%;
  margin: 0;
  /* room above for a book sliding out */
  padding: 14px 10px 0;
  list-style: none;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  cursor: grab;
}

.shelf__line--covers {
  gap: 16px;
  padding-inline: 14px;
}

.shelf__line {
  user-select: none;
  -webkit-touch-callout: none;
}

.shelf__line:active {
  cursor: grabbing;
}

.shelf__item {
  flex: none;
  display: flex;
  align-items: flex-end;
}

/* a carried book over this shelf: the space lights up, ringed in the plate's colour */
.shelf.is-target .shelf__space {
  background: rgba(255, 255, 255, 0.14);
  outline: 3px dashed var(--case-plate);
  outline-offset: -5px;
}

/* the place of the book being carried, kept but empty */
.is-held {
  opacity: 0.2;
  outline: 2px dashed var(--case-plate);
  outline-offset: -2px;
}

/* The plank the books stand on, in the bookcase's wood, with the shelf's plate on its front and
   Previous / Next at its right end. */
.shelf__plank {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 34px;
  padding: 4px 10px;
  background: var(--case-light);
  box-shadow: inset 0 -3px 0 var(--case-dark), 0 2px 0 var(--case-dark);
}

/* a small sign, like the Library's: a board with the town's dark outline and a hard shadow */
.shelf__plate {
  padding: 2px 10px;
  border: 2px solid #1e1a24;
  background: var(--case-plate);
  box-shadow: 2px 2px 0 #1e1a24;
  color: #1e1a24;
  font-family: var(--rl-font-title);
  font-size: 14px;
  line-height: 1.3;
  white-space: nowrap;
}

.shelf__pager {
  display: flex;
  gap: var(--rl-btn-gap);
}

.shelf__page {
  font-size: 18px;
}

/* A spine: the book's colour with a lighter left edge and a darker right one, a pixel outline,
   and its title written up it in big, bold letters. */
.shelf__spine {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  border: 2px solid #1e1a24;
  border-bottom-width: 0;
  background: var(--spine);
  box-shadow: inset 3px 0 0 rgba(255, 255, 255, 0.28), inset -3px 0 0 rgba(0, 0, 0, 0.22);
  cursor: pointer;
  transition: transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1);
}

/* a band near the top and one near the bottom, gold or a darker tone */
.shelf__spine--gold::before,
.shelf__spine--gold::after,
.shelf__spine--dark::before,
.shelf__spine--dark::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 4px;
  background: #d9b25f;
}

.shelf__spine--dark::before,
.shelf__spine--dark::after {
  background: rgba(0, 0, 0, 0.3);
}

.shelf__spine::before {
  top: 8px;
}

.shelf__spine::after {
  bottom: 8px;
}

.shelf__spine-title {
  max-height: 100%;
  overflow: hidden;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 16px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* the last book on a shelf with room to spare leans on the one before: its foot stands off by
   about its height x sin 8deg, so its top just touches */
.shelf__item.is-leaning {
  margin-left: 30px;
  transform: rotate(-8deg);
  transform-origin: bottom left;
}

.shelf__spine:hover,
.shelf__spine:focus-visible {
  transform: translateY(-8px);
  outline: none;
}

.shelf__spine:focus-visible,
.shelf__flat:focus-visible {
  box-shadow: 0 0 0 3px #fffbf2, 0 0 0 6px #1e1a24;
}

/* tapped: it slides up and out of the shelf, towards the reader */
.shelf__spine.is-out {
  z-index: 1;
  transform: translateY(-14px) scale(1.06);
}

/* two books lying flat, one on the other, titles across */
.shelf__stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.shelf__flat {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 10px;
  border: 2px solid #1e1a24;
  border-bottom-width: 0;
  background: var(--spine);
  box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.28), inset 0 -3px 0 rgba(0, 0, 0, 0.22);
  cursor: pointer;
  transition: transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.shelf__flat:hover,
.shelf__flat:focus-visible {
  transform: translateX(8px);
  outline: none;
}

.shelf__flat.is-out {
  transform: translateX(26px);
}

.shelf__flat-title {
  overflow: hidden;
  font-size: 14px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* a cover standing face out */
.shelf__cover {
  width: 100px;
  padding: 0;
  border: 2px solid #1e1a24;
  background: none;
  box-shadow: 3px 0 0 rgba(0, 0, 0, 0.35);
  cursor: pointer;
  transition: transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.shelf__cover-art {
  display: block;
  width: 100%;
  aspect-ratio: 2 / 3;
  height: auto;
  border-radius: 0;
  object-fit: cover;
}

.shelf__cover:hover,
.shelf__cover:focus-visible {
  transform: translateY(-8px);
  outline: none;
}

.shelf__cover:focus-visible {
  box-shadow: 0 0 0 3px #fffbf2, 0 0 0 6px #1e1a24;
}

.shelf__cover.is-out {
  transform: translateY(-14px) scale(1.04);
}

/* while the books load: dim spines */
.shelf__ghost {
  flex: none;
  width: 40px;
  border: 2px solid rgba(0, 0, 0, 0.4);
  border-bottom-width: 0;
  background: rgba(255, 255, 255, 0.12);
  animation: shelf-ghost 1.2s ease-in-out infinite alternate;
}

.shelf__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: 0;
  padding: 0 16px;
  font-size: 0.9rem;
  color: #fffbf2;
  text-align: center;
}

@keyframes shelf-ghost {
  to {
    background: rgba(255, 255, 255, 0.24);
  }
}

@media (prefers-reduced-motion: reduce) {
  .shelf__ghost {
    animation: none;
  }

  .shelf__spine,
  .shelf__flat,
  .shelf__cover {
    transition: none;
  }
}
</style>
