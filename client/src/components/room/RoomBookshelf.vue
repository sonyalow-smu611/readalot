<template>
  <!-- Tapping anywhere on the bookcase opens it; the corner button does the same for keyboards. -->
  <div
    ref="root"
    class="bookcase"
    :class="{ 'bookcase--open': canOpen }"
    data-drop="case"
    @click="open"
  >
    <span class="bookcase__back">
      <span v-for="(row, r) in shelves" :key="row.key" class="bookcase__shelf" :data-zone="ZONES[r]">
        <span class="bookcase__label">{{ row.label }}</span>
        <span class="bookcase__books">
          <BookSpine
            v-for="(book, i) in row.books"
            :key="book.id"
            :book="book"
            size="mini"
            :style="{ '--i': i + r * 2 }"
          />
        </span>
        <!-- decorations stand on the plank, in front of the books -->
        <span class="bookcase__ledge"><slot name="ledge" :zone="ZONES[r]" /></span>
      </span>
    </span>

    <button
      v-if="canOpen"
      class="bookcase__expand"
      type="button"
      :aria-label="`Open bookshelf, ${books.length} books`"
      @click.stop="open"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" /></svg>
    </button>

    <div v-if="error" class="bookcase__empty" @click.stop>
      <strong>Shelf unavailable</strong>
      {{ error }}
      <button class="btn btn-sm btn-outline-primary" type="button" @click="$emit('retry')">Retry</button>
    </div>
    <div v-else-if="!loading && !books.length" class="bookcase__empty" @click.stop>
      <template v-if="readonly">No books on this shelf yet.</template>
      <template v-else>
        <strong>Add your first book</strong>
        <RouterLink to="/discover">Discover books</RouterLink>
        <RouterLink to="/scan">Scan a cover</RouterLink>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { roomRows } from "../../services/shelves.js";
import BookSpine from "./BookSpine.vue";

const props = defineProps({
  books: { type: Array, default: () => [] },
  loading: Boolean,
  error: { type: String, default: "" },
  readonly: Boolean
});
const emit = defineEmits(["open", "retry"]);

// drop zones for shelf decorations, top shelf first
const ZONES = ["case-top", "case-mid", "case-low"];

const root = ref(null);
const canOpen = computed(() => props.books.length > 0);

// the opener gets the bookcase's place on screen, so the full shelf can grow out of it
function open() {
  if (canOpen.value) emit("open", root.value.getBoundingClientRect());
}

// The bookcase always has three shelves, even when fewer rows have books.
const shelves = computed(() => {
  const rows = roomRows(props.books);
  while (rows.length < 3) rows.push({ key: `empty-${rows.length}`, label: "", books: [] });
  return rows;
});
</script>

<style scoped>
.bookcase {
  position: relative;
  display: block;
  padding: calc(10 * var(--u));
  border: 2px solid var(--rl-primary);
  border-radius: calc(10 * var(--u));
  background: linear-gradient(90deg, #5c3f2c, var(--rl-wood) 12%, var(--rl-wood) 88%, #5c3f2c);
  box-shadow: 0 calc(6 * var(--u)) calc(10 * var(--u)) rgba(63, 46, 36, 0.22);
  text-align: left;
}

.bookcase--open {
  cursor: pointer;
  transition: transform 0.25s ease;
}

.bookcase__back {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-top: calc(4 * var(--u));
  border: calc(5 * var(--u)) solid #af8f71;
  border-bottom: 0;
  border-radius: calc(4 * var(--u));
  background: linear-gradient(180deg, rgba(63, 46, 36, 0.12), transparent 14%), #e2d1bd;
}

.bookcase__shelf {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  border-bottom: calc(12 * var(--u)) solid var(--rl-wood);
  /* shadow each plank casts on the back panel below it */
  box-shadow: 0 calc(15 * var(--u)) calc(6 * var(--u)) calc(-6 * var(--u)) rgba(63, 46, 36, 0.22);
}

.bookcase__label {
  display: block;
  min-height: calc(13 * var(--u));
  padding: calc(4 * var(--u)) calc(6 * var(--u)) 0;
  overflow: hidden;
  font-size: max(8px, calc(8 * var(--u)));
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: 1.1;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--rl-primary);
}

.bookcase__books {
  display: flex;
  flex: 1;
  align-items: flex-end;
  gap: calc(2 * var(--u));
  padding-inline: calc(6 * var(--u));
}

.bookcase__books :deep(.spine) {
  transition: transform 0.3s cubic-bezier(0.3, 1.5, 0.5, 1);
}

/* a short row ends with a book leaning on its neighbours */
.bookcase__books :deep(.spine:last-child:nth-child(n + 3):nth-child(-n + 6)) {
  transform: rotate(-9deg) translateX(calc(3 * var(--u)));
}

.bookcase__ledge {
  position: relative;
  z-index: 3;
  height: 0;
  margin-inline: calc(6 * var(--u));
}

.bookcase__expand {
  position: absolute;
  top: calc(-9 * var(--u));
  right: calc(-9 * var(--u));
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid var(--rl-line);
  border-radius: 50%;
  background: var(--rl-surface);
  color: var(--rl-primary);
  box-shadow: 0 2px 6px rgba(63, 46, 36, 0.2);
}

.bookcase__expand svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.bookcase__empty {
  position: absolute;
  inset: 50% 14% auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  transform: translateY(-50%);
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card);
  background: var(--rl-surface);
  font-size: 12px;
  text-align: center;
  color: var(--rl-muted);
}

.bookcase__empty strong {
  font-family: var(--rl-font-title);
  font-size: 14px;
  color: var(--rl-text);
}

.bookcase__empty a {
  font-weight: 700;
}

/* Hover: the whole shelf ripples once, then the book under the pointer slides out
   and its neighbours lean away. Touch devices skip this and go straight to the tap. */
@media (hover: hover) {
  .bookcase--open:hover {
    transform: translateY(calc(-1 * var(--u)));
  }

  .bookcase--open:hover :deep(.spine) {
    animation: spine-ripple 0.7s ease backwards;
    animation-delay: calc(var(--i) * 40ms);
  }

  .bookcase__books :deep(.spine:hover) {
    animation: none;
    transform: translateY(-22%) rotate(-3deg);
  }

  .bookcase__books :deep(.spine:hover + .spine) {
    transform: rotate(6deg) translateX(8%);
  }

  .bookcase__books :deep(.spine:has(+ .spine:hover)) {
    transform: rotate(-5deg) translateX(-8%);
  }

  .bookcase--open:hover .bookcase__expand {
    background: var(--rl-primary);
    color: var(--rl-surface);
  }
}

@keyframes spine-ripple {
  40% {
    transform: translateY(-10%) rotate(-2deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bookcase--open,
  .bookcase__books :deep(.spine) {
    animation: none !important;
    transition: none;
  }
}
</style>
