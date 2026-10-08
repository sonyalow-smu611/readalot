<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A single book on the shelf in its two resting states:
//   SPINE  — cloth on the left, a narrow block of page edges on the right.
//   PEEK   — on hover (desktop) or press-and-hold (touch) the book lifts a little
//            and shows a narrow sliver of its cover.
// A tap/click lifts it into the FEATURED state, which the global <BookOpenOverlay> owns.
// While a book is the active (lifted) one it hides itself so the shelf keeps an empty gap.
// `stack` is the shelf index: later books paint in front of the ones they overlap.
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  primaryAuthor,
  spineHeight,
  spineLean,
  spineWidth,
} from '@/lib/book'
import { spineLook } from '@/services/shelves.js'
import { useBookOpen } from '@/composables/useBookOpen'

const props = defineProps({
  book: { type: Object, required: true },
  stack: { type: Number, default: 0 },
  compact: { type: Boolean, default: false },
})

const { state, open } = useBookOpen()

const root = ref(null)
const holding = ref(false)
// Set once a press has lasted long enough to count as a peek, so the following click
// does not also open the book. pointerup clears the visual before click fires.
const peeked = ref(false)
let holdTimer = null

// This book is the one currently lifted into the overlay.
const isActive = computed(() => state.book?.id === props.book.id && state.phase !== 'closed')

// Same cloth and ink as this book's spine in the room bookcase.
const look = computed(() => spineLook(props.book))

const bookStyle = computed(() => ({
  '--spine-bg': look.value.colour,
  '--spine-ink': look.value.ink,
  '--spine-lean': `${spineLean(props.book)}deg`,
  '--spine-w': `${spineWidth(props.book)}px`,
  '--book-stack': String(props.stack),
  height: props.compact ? '118px' : `${spineHeight(props.book)}px`,
  zIndex: props.stack,
}))

const spineClass = computed(() => ({
  'is-holding': holding.value,
  'is-active': isActive.value,
  'is-compact': props.compact,
}))

const author = computed(() => primaryAuthor(props.book))

// Press-and-hold shows PEEK on touch (where there's no hover); a quick tap opens the book.
const HOLD_MS = 320

function onPointerDown() {
  peeked.value = false
  holdTimer = window.setTimeout(() => {
    holding.value = true
    peeked.value = true
  }, HOLD_MS)
}

function endHold() {
  clearTimeout(holdTimer)
  holdTimer = null
  holding.value = false
}

function onClick() {
  if (peeked.value) {
    peeked.value = false
    endHold()
    return
  }
  open(props.book, root.value)
}

onBeforeUnmount(endHold)
</script>

<template>
  <button
    ref="root"
    type="button"
    class="book"
    :class="spineClass"
    :style="bookStyle"
    :aria-label="`${book.title} by ${author}`"
    @pointerdown="onPointerDown"
    @pointerup="endHold"
    @pointerleave="endHold"
    @pointercancel="endHold"
    @click="onClick"
  >
    <span class="book__peek" aria-hidden="true">
      <img v-if="book.cover" :src="book.cover" :alt="''" class="book__peek-img" loading="lazy" />
    </span>

    <span class="book__spine">
      <span class="book__title">{{ book.title }}</span>
      <span class="book__author">{{ author }}</span>
    </span>

    <span class="book__pages" aria-hidden="true"></span>
  </button>
</template>

<style scoped>
.book {
  position: relative;
  display: flex;
  align-items: stretch;
  flex: 0 0 auto;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  align-self: flex-end;
  transform: rotate(var(--spine-lean));
  transform-origin: bottom center;
  filter: drop-shadow(0 1px 1px rgba(28, 27, 25, 0.2));
  transition: transform 0.2s ease;
}

.book:hover,
.book.is-holding {
  z-index: calc(var(--book-stack, 0) + 20) !important;
  transform: translateY(-6px) rotate(var(--spine-lean));
}

.book:focus-visible {
  outline: 1px solid rgba(28, 27, 25, 0.55);
  outline-offset: 3px;
}

/* Hidden while it's the lifted book, but keeps its footprint so the shelf gap stays. */
.book.is-active {
  visibility: hidden;
}

.book__spine {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 var(--spine-w);
  width: var(--spine-w);
  height: 100%;
  padding: 8px 2px 6px;
  background: var(--spine-bg);
  border: 1px solid rgba(28, 27, 25, 0.35);
  border-right: none;
  border-radius: 2px 0 0 2px;
  overflow: hidden;
}

.book__title {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  max-height: 68%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: 0.68rem;
  line-height: 1;
  letter-spacing: 0.04em;
  color: var(--spine-ink);
}

.book__author {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  margin-top: auto;
  max-height: 22%;
  overflow: hidden;
  white-space: nowrap;
  font-family: var(--font-serif);
  font-size: 0.52rem;
  line-height: 1;
  letter-spacing: 0.03em;
  color: var(--spine-ink);
  opacity: 0.72;
}

.book.is-compact .book__spine {
  padding: 4px 1px 3px;
}

.book.is-compact .book__title {
  font-size: 0.62rem;
}

.book.is-compact .book__author {
  font-size: 0.42rem;
}

/* Fore-edge of the text block: a few millimetres of paper. */
.book__pages {
  z-index: 2;
  flex: 0 0 6px;
  width: 6px;
  height: 100%;
  background-color: var(--page-edge);
  background-image: repeating-linear-gradient(
    to bottom,
    rgba(28, 27, 25, 0.2) 0 1px,
    transparent 1px 3px
  );
  border: 1px solid rgba(28, 27, 25, 0.35);
  border-left: none;
  border-radius: 0 1px 1px 0;
  transition: width 0.2s ease, flex-basis 0.2s ease;
}

.book:hover .book__pages,
.book.is-holding .book__pages {
  flex-basis: 8px;
  width: 8px;
}

/* A narrow cover sliver, just past the page edge. */
.book__peek {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--spine-w) + 4px);
  z-index: 1;
  width: 10px;
  border: 1px solid rgba(28, 27, 25, 0.35);
  background: var(--page-edge);
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.book:hover .book__peek,
.book.is-holding .book__peek {
  opacity: 1;
  transform: translateX(6px);
}

.book__peek-img {
  width: 140%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  object-position: left center;
}

@media (prefers-reduced-motion: reduce) {
  .book,
  .book__peek,
  .book__pages {
    transition: none;
  }
}
</style>
