<!--
  Scaffolded with AI assistance — see AI_USAGE.md
  A bookcase full of books: a frame in its wood, its books standing on uneven shelves
  (shelves.js), as spines with their titles written up them or as covers face out, with the
  bookcase's props among them and a rolling ladder leaning on it on a wide screen. An opened genre
  bookcase (GenreBookcase) and the search results (SearchView) both stand their books in one.

  It emits `select` with a book once that book has slid out of the shelf, and `retry` after a
  failed load.
-->
<template>
  <div class="case__frame" :style="wood">
    <div ref="inside" class="case__inside">
      <div v-if="loading" class="case__shelf" aria-label="Loading books">
        <span v-for="n in SKELETON_SPINES" :key="n" class="case__ghost" :style="{ height: `${150 + ((n * 37) % 50)}px` }" />
      </div>

      <div v-else-if="error" class="case__state">
        <p>{{ error }}</p>
        <button type="button" class="btn btn-secondary" @click="$emit('retry')">Retry</button>
      </div>

      <p v-else-if="!books.length" class="case__state">{{ emptyText }}</p>

      <template v-else>
        <div v-for="(shelf, row) in shelves" :key="row" class="case__shelf" :style="{ height: `${shelf.height}px` }">
          <template v-for="(item, index) in shelf.items" :key="`${row}-${index}`">
            <button
              v-if="item.kind === 'spine'"
              data-card
              type="button"
              class="case__spine"
              :class="[`case__spine--${item.band}`, { 'is-leaning': item.lean, 'is-out': isOut(item.book) }]"
              :style="spineStyle(item)"
              :aria-label="nameOf(item.book)"
              :title="item.book.title"
              @click="pull(item.book)"
            >
              <span class="case__spine-title">{{ item.book.title }}</span>
            </button>

            <div v-else-if="item.kind === 'stack'" class="case__stack" :style="{ width: `${item.width}px` }">
              <button
                v-for="(book, k) in [...item.books].reverse()"
                :key="book.id"
                data-card
                type="button"
                class="case__flat"
                :class="{ 'is-out': isOut(book) }"
                :style="flatStyle(item, item.books.length - 1 - k)"
                :aria-label="nameOf(book)"
                :title="book.title"
                @click="pull(book)"
              >
                <span class="case__flat-title">{{ book.title }}</span>
              </button>
            </div>

            <button
              v-else-if="item.kind === 'cover'"
              data-card
              type="button"
              class="case__cover"
              :class="{ 'is-out': isOut(item.book) }"
              :aria-label="nameOf(item.book)"
              :title="item.book.title"
              @click="pull(item.book)"
            >
              <BookCover class="case__cover-art" :cover-url="item.book.coverUrl" :title="item.book.title" :seed="item.book.id" />
            </button>

            <img v-else-if="propIcons[item.icon]" class="case__prop" :src="propIcons[item.icon]" alt="" :style="{ width: `${item.width}px` }" />
          </template>
        </div>
      </template>
    </div>
    <div class="case__ladder" aria-hidden="true" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BookCover from '@/components/BookCover.vue'
import { prefersReducedMotion } from '@/lib/motion'
import { iconUrl } from '../hall/icons.js'
import { bookItems, inkFor, packShelves } from '../shelves.js'

const props = defineProps({
  // what the bookcase is like: key (seeds its look), spines (colours), wood, props (icons);
  // a genre from categories.js, or HALL_CASE
  bookcase: { type: Object, required: true },
  books: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  // spines or covers
  mode: { type: String, default: 'spines' },
  // the id of the book whose preview is open: it stays slid out until the preview closes
  openBook: { type: String, default: null },
  emptyText: { type: String, default: 'No books on this bookcase yet.' },
})

const emit = defineEmits(['select', 'retry'])

const SKELETON_SPINES = 12
// how long a book takes to slide out before its preview opens (ms)
const PULL_MS = 240
// each shelf's own padding (.case__shelf) comes off the width the books have
const SHELF_PADDING = { spines: 20, covers: 28 }

const inside = ref(null)
const width = ref(0)
const pulling = ref(null)

const propIcons = Object.fromEntries(props.bookcase.props.map((name) => [name, iconUrl(name)]))

const wood = computed(() => {
  const { frame, light, dark, back } = props.bookcase.wood
  return { '--case-frame': frame, '--case-light': light, '--case-dark': dark, '--case-back': back }
})

const shelves = computed(() => {
  if (!width.value) return []
  const room = width.value - SHELF_PADDING[props.mode]
  return packShelves(bookItems(props.books, props.bookcase, props.mode), room, props.bookcase, props.mode)
})

function nameOf(book) {
  const by = book.authors?.length ? ` by ${book.authors.join(', ')}` : ''
  return `${book.title}${by}`
}

function spineStyle(item) {
  return { width: `${item.width}px`, height: `${item.height}px`, '--spine': item.colour, color: inkFor(item.colour) }
}

// the k-th book of a stack, from the bottom
function flatStyle(item, k) {
  return { width: `${item.widths[k]}px`, '--spine': item.colours[k], color: inkFor(item.colours[k]) }
}

const isOut = (book) => pulling.value === book.id || props.openBook === book.id

// The book slides out of the shelf, then its preview opens.
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

let resize = null
onMounted(() => {
  resize = new ResizeObserver(([entry]) => {
    width.value = Math.floor(entry.contentRect.width)
  })
  resize.observe(inside.value)
})

onBeforeUnmount(() => resize?.disconnect())
</script>

<style scoped>
/* The bookcase: a thick frame in the genre's wood with a crown on top and a plinth below, the
   town's dark outline round it and a hard shadow, like the hall's furniture. Kept narrow enough
   on a wide screen to stand tall, with several shelves, rather than two long ones. */
.case__frame {
  position: relative;
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

.case__inside {
  border: 2px solid #1e1a24;
  background: var(--case-back);
}

/* One shelf: the books stand on a plank in the genre's wood, the back in shadow at the top. */
.case__shelf {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  padding: 14px 10px 0;
  border-bottom: 12px solid var(--case-light);
  box-shadow: inset 0 14px 10px -10px rgba(0, 0, 0, 0.45), 0 2px 0 var(--case-dark);
}

.case__shelf + .case__shelf {
  margin-top: 2px;
}

.case__shelf:has(.case__cover) {
  gap: 16px;
  padding-inline: 14px;
}

/* A spine: the book's colour with a lighter left edge and a darker right one, a pixel outline,
   and its title written up it in big, bold letters. */
.case__spine {
  position: relative;
  flex: none;
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
.case__spine--gold::before,
.case__spine--gold::after,
.case__spine--dark::before,
.case__spine--dark::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 4px;
  background: #d9b25f;
}

.case__spine--dark::before,
.case__spine--dark::after {
  background: rgba(0, 0, 0, 0.3);
}

.case__spine::before {
  top: 8px;
}

.case__spine::after {
  bottom: 8px;
}

.case__spine-title {
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
.case__spine.is-leaning {
  margin-left: 30px;
  transform: rotate(-8deg);
  transform-origin: bottom left;
}

.case__spine:hover,
.case__spine:focus-visible {
  transform: translateY(-8px);
  outline: none;
}

.case__spine.is-leaning:hover,
.case__spine.is-leaning:focus-visible {
  transform: rotate(-8deg) translateY(-8px);
}

.case__spine:focus-visible,
.case__flat:focus-visible,
.case__cover:focus-visible {
  box-shadow: 0 0 0 3px #fffbf2, 0 0 0 6px #1e1a24;
}

/* tapped: it slides up and out of the shelf, towards the reader */
.case__spine.is-out {
  z-index: 1;
  transform: translateY(-28px) scale(1.06);
}

/* two books lying flat, one on the other, titles across */
.case__stack {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.case__flat {
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

.case__flat:hover,
.case__flat:focus-visible {
  transform: translateX(8px);
  outline: none;
}

.case__flat.is-out {
  transform: translateX(26px);
}

.case__flat-title {
  overflow: hidden;
  font-size: 14px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* a cover standing face out */
.case__cover {
  flex: none;
  width: 100px;
  padding: 0;
  border: 2px solid #1e1a24;
  background: none;
  box-shadow: 3px 0 0 rgba(0, 0, 0, 0.35);
  cursor: pointer;
  transition: transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.case__cover-art {
  display: block;
  width: 100%;
  aspect-ratio: 2 / 3;
  height: auto;
  border-radius: 0;
  object-fit: cover;
}

.case__cover:hover,
.case__cover:focus-visible {
  transform: translateY(-8px);
  outline: none;
}

.case__cover.is-out {
  transform: translateY(-20px) scale(1.06);
}

/* one of the genre's props, standing among the books */
.case__prop {
  flex: none;
  height: auto;
  padding: 0 8px;
  image-rendering: pixelated;
}

/* while the books load: dim spines */
.case__ghost {
  flex: none;
  width: 40px;
  border: 2px solid rgba(0, 0, 0, 0.4);
  border-bottom-width: 0;
  background: rgba(255, 255, 255, 0.12);
  animation: case-ghost 1.2s ease-in-out infinite alternate;
}

.case__state {
  margin: 0;
  padding: 40px 16px;
  text-align: center;
  color: #fffbf2;
}

.case__state p {
  margin-bottom: 12px;
}

/* A rolling ladder leaning on the right of the bookcase, on a wide screen: two rails and rungs. */
.case__ladder {
  display: none;
}

@media (min-width: 992px) {
  .case__ladder {
    position: absolute;
    top: -10px;
    right: -10px;
    bottom: -14px;
    display: block;
    width: 44px;
    border-left: 6px solid #8a5a3a;
    border-right: 6px solid #8a5a3a;
    background: repeating-linear-gradient(to bottom, transparent 0 34px, #a8744d 34px 40px, #6b4329 40px 42px);
    outline: 2px solid #1e1a24;
    transform: rotate(3deg);
    transform-origin: bottom center;
  }
}

@keyframes case-ghost {
  to {
    background: rgba(255, 255, 255, 0.24);
  }
}

@media (prefers-reduced-motion: reduce) {
  .case__ghost {
    animation: none;
  }

  .case__spine,
  .case__flat,
  .case__cover {
    transition: none;
  }
}
</style>
