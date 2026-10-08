<template>
  <div class="chair">
    <svg class="chair__art" viewBox="0 0 160 170" aria-hidden="true">
      <defs>
        <linearGradient :id="`${uid}-back`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#B8946C" />
          <stop offset="1" stop-color="#93714E" />
        </linearGradient>
        <linearGradient :id="`${uid}-arm`" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#8A6A49" />
          <stop offset="0.45" stop-color="#AD8961" />
          <stop offset="1" stop-color="#8A6A49" />
        </linearGradient>
        <linearGradient :id="`${uid}-seat`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#CBAE8B" />
          <stop offset="1" stop-color="#B0906B" />
        </linearGradient>
      </defs>

      <ellipse cx="80" cy="159" rx="72" ry="9" fill="#3F2E24" opacity="0.2" />

      <!-- legs -->
      <path d="M26 140h12l-2 20h-7zM122 140h12l-3 20h-7z" fill="#5C3F2C" />
      <path d="M52 142h8l-1 14h-5zM100 142h8l-2 14h-5z" fill="#4A3223" />

      <!-- back rest and its cushion -->
      <path
        d="M30 104V46Q30 10 80 10Q130 10 130 46V104Z"
        :fill="`url(#${uid}-back)`"
        stroke="#5C4030"
        stroke-width="2.5"
      />
      <path d="M41 100V50Q41 23 80 23Q119 23 119 50V100Z" fill="#C6A682" />
      <path d="M41 60Q80 50 119 60" fill="none" stroke="#A98A66" stroke-width="1.2" />
      <g fill="#8A6A49">
        <circle cx="60" cy="44" r="1.8" />
        <circle cx="80" cy="40" r="1.8" />
        <circle cx="100" cy="44" r="1.8" />
      </g>

      <!-- seat cushion and front panel -->
      <path d="M38 122h84v18q0 6-6 6H44q-6 0-6-6z" fill="#93714E" stroke="#5C4030" stroke-width="2.5" />
      <path
        d="M36 104Q80 94 124 104V120Q80 130 36 120Z"
        :fill="`url(#${uid}-seat)`"
        stroke="#5C4030"
        stroke-width="2.5"
        stroke-linejoin="round"
      />
      <path d="M40 116Q80 125 120 116" fill="none" stroke="#9C7C58" stroke-width="1.2" />

      <!-- rolled arms -->
      <g stroke="#5C4030" stroke-width="2.5">
        <path d="M12 86Q12 68 27 68Q42 68 42 86V140Q42 146 36 146H18Q12 146 12 140Z" :fill="`url(#${uid}-arm)`" />
        <path d="M118 86Q118 68 133 68Q148 68 148 86V140Q148 146 142 146H124Q118 146 118 140Z" :fill="`url(#${uid}-arm)`" />
      </g>
      <!-- arm fronts: lighter panel with a piped edge -->
      <g fill="#BFA07D" stroke="#7E6245" stroke-width="1.2">
        <path d="M17 88Q17 74 27 74Q37 74 37 88V136Q37 140 33 140H21Q17 140 17 136Z" />
        <path d="M123 88Q123 74 133 74Q143 74 143 88V136Q143 140 139 140H127Q123 140 123 136Z" />
      </g>

      <!-- throw draped over the right arm -->
      <path
        d="M117 76Q132 60 150 74V118l-5 5-5-5-5 5-5-5-5 5-4-4-4 4Z"
        fill="#B7705A"
        stroke="#7F4636"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <path d="M118 86Q133 74 150 86M118 98Q133 87 150 98" fill="none" stroke="#F1E7DA" stroke-width="2" opacity="0.85" />
    </svg>

    <!-- the open book is the way into the current read -->
    <RouterLink class="chair__book" :to="book ? `/books/${book.id}` : '/discover'" :aria-label="label">
      <svg viewBox="0 0 64 46" aria-hidden="true">
        <path d="M1 9L32 13 63 9V35L32 40 1 35Z" fill="#3F2E24" />
        <path d="M4 6Q18 0 32 8V36Q18 29 4 33Z" fill="#FFFDF9" stroke="#6B4A34" stroke-width="1.2" />
        <path d="M32 8Q46 0 60 6V33Q46 29 32 36Z" fill="#FFFDF9" stroke="#6B4A34" stroke-width="1.2" />
        <g fill="none" stroke="#BEB5AB" stroke-width="1" stroke-linecap="round">
          <path d="M9 11Q18 7 27 11M9 16Q18 12 27 16M9 21Q18 17 27 21M9 26Q16 23 22 25" />
          <path d="M37 11Q46 7 55 11M37 16Q46 12 55 16M37 21Q46 17 55 21M37 26Q46 22 55 26" />
        </g>
        <!-- loose page that turns on hover -->
        <path class="chair__page" d="M32 8Q46 1 59 7V32Q46 28 32 36Z" fill="#F8F2E9" stroke="#6B4A34" stroke-width="1" />
        <path d="M30 34v10l2.5-2.5L35 44V34Z" fill="#B7705A" />
      </svg>
      <span class="chair__hint">{{ book ? "Continue reading" : "Find a book" }}</span>
    </RouterLink>
  </div>
</template>

<script setup>
import { computed, useId } from "vue";

const props = defineProps({
  // the book currently being read, or null
  book: { type: Object, default: null }
});

const uid = useId();
const label = computed(() =>
  props.book ? `Open your current book, ${props.book.title}` : "No current book. Find one to read"
);
</script>

<style scoped>
.chair {
  position: relative;
}

.chair__art {
  display: block;
  width: 100%;
  height: auto;
}

/* book sits on the seat cushion, leaning on the back rest */
.chair__book {
  position: absolute;
  top: 46%;
  left: 29%;
  width: 42%;
  transition: transform 0.25s ease;
}

.chair__book svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
  filter: drop-shadow(0 2px 2px rgba(63, 46, 36, 0.35));
}

.chair__page {
  transform-origin: 32px 22px;
  animation: page-flutter 7s ease-in-out infinite;
}

.chair__hint {
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

.chair__book:hover,
.chair__book:focus-visible {
  transform: translateY(-3px) scale(1.06);
}

.chair__book:hover .chair__hint,
.chair__book:focus-visible .chair__hint {
  transform: translateX(-50%);
  opacity: 1;
}

.chair__book:hover .chair__page,
.chair__book:focus-visible .chair__page {
  animation: page-turn 0.7s ease-in-out forwards;
}

@keyframes page-flutter {
  0%,
  88%,
  100% {
    transform: scaleX(1);
  }
  94% {
    transform: scaleX(0.6) skewY(-5deg);
  }
}

@keyframes page-turn {
  50% {
    transform: scaleX(0.05) skewY(-10deg);
  }
  100% {
    transform: scaleX(-1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .chair__book,
  .chair__hint {
    transition: none;
  }

  .chair__page {
    animation: none !important;
  }
}
</style>
