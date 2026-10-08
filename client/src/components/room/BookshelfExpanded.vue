<!--
  Full-screen bookshelf: one shelf per reading status, titles readable on the spines.
  Tap a book to preview it; drag it (hold first on touch) to reorder or drop it on another shelf.
-->
<template>
  <div
    class="shelf-full"
    role="dialog"
    aria-modal="true"
    aria-label="My bookshelf"
    @keydown.esc="$emit('close')"
  >
    <header class="shelf-full__bar">
      <button ref="backButton" class="shelf-full__back" type="button" aria-label="Back to my room" @click="$emit('close')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <div>
        <h2 class="shelf-full__title">My Bookshelf</h2>
        <p class="shelf-full__hint">Tap a book to preview. Hold and drag to move it.</p>
      </div>
    </header>

    <div ref="scroller" class="shelf-full__case">
      <section
        v-for="shelf in shelves"
        :key="shelf.value"
        class="shelf"
        :class="{ 'is-target': drag && drag.status === shelf.value }"
        :data-shelf="shelf.value"
      >
        <h3 class="shelf__label">
          {{ shelf.label }} <span>{{ shelf.books.length }}</span>
        </h3>
        <div class="shelf__row">
          <template v-for="book in shelf.books" :key="book.id">
            <span v-if="isDropPoint(shelf.value, book.id)" class="shelf__marker" />
            <button
              class="shelf__slot"
              :class="{ 'is-lifted': drag?.book.id === book.id }"
              type="button"
              :data-book="book.id"
              :aria-label="`${book.title}, ${shelf.label}. Open preview`"
              @pointerdown="onDown($event, book)"
              @click="onClick(book)"
              @contextmenu.prevent
            >
              <BookSpine :book="book" size="full" />
            </button>
          </template>
          <span v-if="isDropPoint(shelf.value, null)" class="shelf__marker" />
          <p v-if="!shelf.books.length" class="shelf__empty">Drop a book here</p>
        </div>
      </section>
    </div>

    <!-- the book in your hand; teleported so nothing on the page can clip it -->
    <Teleport to="body">
      <div v-if="drag" class="shelf-ghost" :style="ghostStyle">
        <BookSpine :book="drag.book" size="full" />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { STATUSES } from "../../services/shelves.js";
import BookSpine from "./BookSpine.vue";

const props = defineProps({
  // books with a `status`, already in shelf order
  books: { type: Array, default: () => [] }
});
const emit = defineEmits(["close", "preview", "move"]);

const HOLD_MS = 260; // touch: press this long before a book lifts, so swipes still scroll
const SLOP = 6; // px the pointer may wander before a press counts as a drag
const EDGE = 70; // px from the top/bottom edge where dragging auto-scrolls

const backButton = ref(null);
const scroller = ref(null);
// { book, x, y, offsetX, offsetY, status, beforeId } while a book is in hand
const drag = ref(null);

let press = null;
let holdTimer = 0;
let scrollFrame = 0;
let justDragged = false;

const shelves = computed(() =>
  STATUSES.map((status) => ({
    ...status,
    books: props.books.filter((book) => book.status === status.value)
  }))
);

const ghostStyle = computed(() => ({
  left: `${drag.value.x - drag.value.offsetX}px`,
  top: `${drag.value.y - drag.value.offsetY}px`
}));

function isDropPoint(status, bookId) {
  return (
    drag.value?.status === status &&
    drag.value.beforeId === bookId &&
    // no marker where the book already is
    !(status === drag.value.book.status && bookId === drag.value.homeBeforeId)
  );
}

function onDown(event, book) {
  if (event.button > 0 || press) return;

  justDragged = false;
  const rect = event.currentTarget.querySelector(".spine").getBoundingClientRect();
  press = {
    book,
    pointerId: event.pointerId,
    touch: event.pointerType !== "mouse",
    startX: event.clientX,
    startY: event.clientY,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top
  };

  if (press.touch) {
    holdTimer = setTimeout(() => lift(press.startX, press.startY), HOLD_MS);
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", release);
}

function onMove(event) {
  if (!press || event.pointerId !== press.pointerId) return;

  if (!drag.value) {
    const moved = Math.hypot(event.clientX - press.startX, event.clientY - press.startY) > SLOP;
    if (!moved) return;
    // a finger that moves before the hold completes is scrolling, not dragging
    if (press.touch) return release();
    lift(event.clientX, event.clientY);
  }

  drag.value.x = event.clientX;
  drag.value.y = event.clientY;
  aim();
}

function lift(x, y) {
  const shelf = shelves.value.find((item) => item.value === press.book.status);
  const index = shelf.books.findIndex((item) => item.id === press.book.id);
  const homeBeforeId = shelf.books[index + 1]?.id ?? null;

  drag.value = {
    book: press.book,
    x,
    y,
    offsetX: press.offsetX,
    offsetY: press.offsetY,
    status: press.book.status,
    beforeId: homeBeforeId,
    homeBeforeId
  };
  justDragged = true;
  navigator.vibrate?.(10);
  scrollFrame = requestAnimationFrame(autoScroll);
}

// Work out which shelf and which gap the held book is over.
function aim() {
  const { x, y, book } = drag.value;
  const shelf = document.elementFromPoint(x, y)?.closest("[data-shelf]");
  if (!shelf) return;

  const slots = [...shelf.querySelectorAll("[data-book]")].filter((slot) => slot.dataset.book !== book.id);
  const next = slots.find((slot) => {
    const rect = slot.getBoundingClientRect();
    return y < rect.top || (y <= rect.bottom && x < rect.left + rect.width / 2);
  });

  drag.value.status = shelf.dataset.shelf;
  drag.value.beforeId = next?.dataset.book ?? null;
}

function autoScroll() {
  if (!drag.value) return;

  const box = scroller.value.getBoundingClientRect();
  const speed =
    drag.value.y < box.top + EDGE ? -9 : drag.value.y > box.bottom - EDGE ? 9 : 0;

  if (speed) {
    scroller.value.scrollTop += speed;
    aim();
  }
  scrollFrame = requestAnimationFrame(autoScroll);
}

function onUp(event) {
  if (!press || event.pointerId !== press.pointerId) return;

  if (drag.value) {
    const { book, status, beforeId, homeBeforeId } = drag.value;
    if (status !== book.status || beforeId !== homeBeforeId) {
      emit("move", { id: book.id, status, beforeId });
    }
  }
  release();
}

function release() {
  clearTimeout(holdTimer);
  cancelAnimationFrame(scrollFrame);
  window.removeEventListener("pointermove", onMove);
  window.removeEventListener("pointerup", onUp);
  window.removeEventListener("pointercancel", release);
  press = null;
  drag.value = null;
}

function onClick(book) {
  // the click that ends a drag is not a tap
  if (justDragged) {
    justDragged = false;
    return;
  }
  emit("preview", book);
}

// once a book is lifted, the page underneath must not scroll with the finger
function blockScroll(event) {
  if (drag.value) event.preventDefault();
}

onMounted(() => {
  backButton.value.focus();
  scroller.value.addEventListener("touchmove", blockScroll, { passive: false });
});

onBeforeUnmount(() => {
  scroller.value?.removeEventListener("touchmove", blockScroll);
  release();
});
</script>

<style scoped>
.shelf-full {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  max-width: var(--rl-column);
  margin-inline: auto;
  background: var(--rl-canvas);
}

.shelf-full__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 15px 15px 12px;
  padding: 10px 14px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card);
  background: var(--rl-surface);
}

.shelf-full__back {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: none;
  padding: 0;
  border: 1px solid var(--rl-line);
  border-radius: 50%;
  background: var(--rl-secondary);
  color: var(--rl-primary);
}

.shelf-full__back svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.shelf-full__title {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
}

.shelf-full__hint {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--rl-muted);
}

/* the bookcase itself: wooden sides, paler back panel */
.shelf-full__case {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  margin: 0 15px;
  padding: 0 10px;
  border: 2px solid var(--rl-primary);
  border-bottom: 0;
  border-radius: 12px 12px 0 0;
  background: linear-gradient(90deg, #5c3f2c, var(--rl-wood) 10px, var(--rl-wood) calc(100% - 10px), #5c3f2c);
}

.shelf {
  --row: 198px;
  --plank: 14px;
  background: #e2d1bd;
  transition: background-color 0.15s ease;
}

.shelf.is-target {
  background: #efe3d2;
}

.shelf__label {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0;
  padding: 14px 12px 0;
  font-family: var(--rl-font-body);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rl-primary);
}

.shelf__label span {
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--rl-surface);
  font-size: 11px;
  letter-spacing: 0;
  color: var(--rl-muted);
}

/* books wrap onto as many planks as they need; the planks are painted behind each line */
.shelf__row {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--plank) 3px;
  min-height: calc(var(--row) + var(--plank));
  padding: 0 12px var(--plank);
  background: repeating-linear-gradient(
    180deg,
    transparent 0 var(--row),
    #7a573f var(--row) calc(var(--row) + 3px),
    var(--rl-wood) calc(var(--row) + 3px) calc(var(--row) + var(--plank))
  );
}

.shelf__slot {
  display: flex;
  align-items: flex-end;
  height: var(--row);
  padding: 0;
  border: 0;
  background: none;
  cursor: grab;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  user-select: none;
}

.shelf__slot :deep(.spine) {
  transition: transform 0.22s cubic-bezier(0.3, 1.5, 0.5, 1), opacity 0.15s ease;
}

.shelf__slot.is-lifted :deep(.spine) {
  opacity: 0.25;
}

.shelf__slot:focus-visible {
  outline-offset: -2px;
}

@media (hover: hover) {
  .shelf__slot:hover :deep(.spine) {
    transform: translateY(-9px) rotate(-1.500deg);
  }
}

.shelf__marker {
  align-self: flex-end;
  width: 5px;
  height: 170px;
  margin-inline: 2px;
  border-radius: 3px;
  background: var(--rl-accent);
  box-shadow: 0 0 0 2px rgba(255, 253, 249, 0.6);
}

.shelf__empty {
  position: absolute;
  inset: 0 12px var(--plank);
  display: grid;
  place-items: center;
  margin: 16px 0;
  border: 1.500px dashed var(--rl-accent);
  border-radius: var(--rl-radius-card);
  font-size: 13px;
  color: var(--rl-muted);
}

.shelf-ghost {
  position: fixed;
  z-index: 2000;
  pointer-events: none;
  transform: rotate(-5deg) scale(1.08);
  transform-origin: 50% 30%;
  filter: drop-shadow(0 10px 12px rgba(44, 36, 30, 0.4));
}

@media (prefers-reduced-motion: reduce) {
  .shelf__slot :deep(.spine) {
    transition: none;
  }
}
</style>
