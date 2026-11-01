<!--
  Scaffolded with AI assistance — see AI_USAGE.md
  One bookcase opened, filling the library: a tall bookcase in the genre's wood (BookShelves)
  against the genre's wall, under its sign. By default the books show their spines, each with its
  title written up it; Covers turns them face out instead.

  The page owns the books; this only shows them. It emits `select` with a book once that book has
  slid out of the shelf, `close` to go back to the hall and `retry` after a failed load.
-->
<template>
  <section
    ref="panel"
    class="case"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="headingId"
    tabindex="-1"
    :style="theme"
    @keydown.esc="$emit('close')"
  >
    <header class="case__head">
      <button type="button" class="btn btn-secondary case__back" @click="$emit('close')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        Back to the hall
      </button>
      <div class="case__title">
        <h2 :id="headingId" class="case__sign" :style="signStyle">
          <img v-if="icon" class="case__sign-icon" :src="icon" alt="" />
          <span class="case__sign-text">{{ category.title }}</span>
        </h2>
        <a v-if="credit" class="case__credit" :href="credit.url" target="_blank" rel="noopener noreferrer">
          {{ credit.text }}<span class="visually-hidden"> (opens in a new tab)</span>
        </a>
      </div>
      <div class="case__modes" role="group" aria-label="Show the books by">
        <button
          v-for="option in MODES"
          :key="option.value"
          type="button"
          class="btn btn-chip btn-sm"
          :class="{ active: mode === option.value }"
          :aria-pressed="mode === option.value"
          @click="mode = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </header>

    <div class="case__scroll">
      <BookShelves
        :bookcase="category"
        :books="books"
        :loading="loading"
        :error="error"
        :mode="mode"
        :open-book="openBook"
        @select="$emit('select', $event)"
        @retry="$emit('retry')"
      />
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { iconUrl } from '../hall/icons.js'
import BookShelves from './BookShelves.vue'

const props = defineProps({
  // a genre from categories.js
  category: { type: Object, required: true },
  books: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  // the id of the book whose preview is open: it stays slid out until the preview closes
  openBook: { type: String, default: null },
  // where the books came from, credited under the sign: { text, url } (the Bestsellers bookcase)
  credit: { type: Object, default: null },
})

defineEmits(['close', 'select', 'retry'])

const MODES = [
  { value: 'spines', label: 'Spines' },
  { value: 'covers', label: 'Covers' },
]

const panel = ref(null)
const mode = ref('spines')
const headingId = `case-${props.category.key}`

const icon = iconUrl(props.category.icon)

// the genre's wall behind, with its icon faintly repeated
const theme = computed(() => ({
  '--case-wall': props.category.backdrop,
  '--case-pattern': icon ? `url(${icon})` : 'none',
}))

const signStyle = computed(() => {
  const { sign } = props.category
  return {
    '--sign-board': sign.board,
    '--sign-ink': sign.ink,
    '--sign-size': sign.size ?? 1,
    '--sign-shadow': sign.shadow ?? 'none',
    fontFamily: `${sign.font}, var(--rl-font-title)`,
  }
})

onMounted(() => panel.value?.focus())
</script>

<style scoped>
/* fills the library, over the hall, with the genre's wall behind and its icon faintly repeated */
.case {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  background: var(--case-wall);
  color: var(--rl-text);
  animation: case-open 0.28s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.case::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--case-pattern);
  background-size: 18px auto;
  background-repeat: space;
  opacity: 0.12;
  image-rendering: pixelated;
  pointer-events: none;
}

.case:focus {
  outline: none;
}

/* back on the left, the toggle on the right, the genre's sign in the middle; on a phone the
   sign drops to its own line below */
.case__head {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 10px 15px 8px 12px;
}

.case__back {
  justify-self: start;
  gap: 6px;
  font-size: 14px;
}

.case__back svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.case__modes {
  justify-self: end;
  display: flex;
  gap: 8px;
}

.case__title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

/* a small plate under the sign, saying where the list comes from */
.case__credit {
  padding: 2px 8px;
  border: 2px solid #1e1a24;
  background: #fffbf2;
  font-size: 12px;
  font-weight: 700;
  color: #1e1a24;
}

.case__sign {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 6px 14px;
  border: 2px solid #1e1a24;
  background: var(--sign-board);
  box-shadow: 3px 3px 0 #1e1a24;
  color: var(--sign-ink);
  white-space: nowrap;
}

.case__sign-icon {
  width: 24px;
  height: auto;
  image-rendering: pixelated;
}

.case__sign-text {
  font-size: calc(24px * var(--sign-size));
  font-weight: 400;
  line-height: 1;
  text-shadow: var(--sign-shadow);
}

@media (max-width: 575.98px) {
  .case__head {
    grid-template-columns: 1fr auto;
  }

  .case__title {
    grid-column: 1 / -1;
    grid-row: 2;
    justify-self: center;
  }

  .case__sign-text {
    font-size: calc(19px * var(--sign-size));
  }
}

.case__scroll {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 8px 12px 28px;
}

@keyframes case-open {
  from {
    transform: scale(0.96);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .case {
    animation: none;
  }
}
</style>
