<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// "Everything your reading life needs": one big book on a wooden shelf per stop, with plainer
// books leaning between them. Hovering (or focusing) a feature book takes it half off the shelf
// and shows its headline underneath; picking it asks the page to scroll to that stop.
import { computed, ref } from 'vue'

const props = defineProps({
  // [{ id, tab, headline, line, accent, card: { building, resident } }] (see stops.js)
  stops: { type: Array, required: true },
})
const emit = defineEmits(['go'])

// plain books standing between the feature books, so it reads as a full shelf
const FILLERS = [
  [{ colour: '#c9b48a', w: 22, h: 220 }, { colour: '#6d5a7a', w: 26, h: 250 }],
  [{ colour: '#3d5a5a', w: 24, h: 236 }],
  [{ colour: '#b8574a', w: 20, h: 210 }, { colour: '#d9c48a', w: 26, h: 242 }],
  [{ colour: '#4f6f8f', w: 22, h: 228 }],
]

const picked = ref('')
const shown = computed(() => props.stops.find((stop) => stop.id === picked.value) ?? null)
</script>

<template>
  <section class="features" aria-labelledby="features-title">
    <h2 id="features-title" class="features__title">Everything your reading life needs.</h2>
    <p class="features__hint">Take a book off the shelf.</p>

    <div class="features__case">
      <ul class="features__row" @mouseleave="picked = ''">
        <template v-for="(stop, i) in stops" :key="stop.id">
          <li class="features__item">
            <button
              type="button"
              class="feature-book"
              :class="{ 'is-out': picked === stop.id }"
              :style="{ '--bg': stop.accent }"
              :aria-label="`${stop.tab}: ${stop.headline}`"
              @mouseenter="picked = stop.id"
              @focus="picked = stop.id"
              @blur="picked = ''"
              @click="emit('go', stop.id)"
            >
              <img
                class="feature-book__badge"
                :src="stop.card.building ? `/town/buildings/${stop.card.building}.png` : '/room/strip/open-book.png'"
                alt=""
              />
              <span class="feature-book__title">{{ stop.tab }}</span>
              <span class="feature-book__band" />
            </button>
          </li>
          <li v-for="(filler, j) in FILLERS[i] ?? []" :key="`${stop.id}-${j}`" class="features__item features__filler" aria-hidden="true">
            <span class="filler-book" :style="{ '--bg': filler.colour, width: `${filler.w}px`, height: `${filler.h}px` }" />
          </li>
        </template>
        <li class="features__item features__filler" aria-hidden="true">
          <img class="features__plant" src="/room/strip/plant-pot-small.png" alt="" />
        </li>
      </ul>
      <div class="features__ledge" />
    </div>

    <div class="features__caption" aria-live="polite">
      <template v-if="shown">
        <p class="features__tab">{{ shown.tab }}</p>
        <p class="features__headline">{{ shown.headline }}</p>
        <p class="features__line">{{ shown.line }}</p>
      </template>
      <p v-else class="features__line">Pick a book to see what's inside.</p>
    </div>
  </section>
</template>

<style scoped>
.features {
  position: relative;
  padding: 88px 16px 64px;
  background: #1e1a24;
  text-align: center;
}

.features__title {
  margin: 0;
  font-family: var(--rl-font-title);
  font-size: clamp(30px, 5vw, 48px);
  font-weight: 700;
  color: var(--rl-surface);
}

.features__hint {
  margin: 6px 0 40px;
  color: rgba(255, 253, 249, 0.7);
  font-size: 15px;
}

/* a wooden bookcase back, with the books standing on its ledge */
.features__case {
  display: inline-block;
  max-width: 100%;
  padding: 40px 18px 0;
  background: #5c4030;
  border: 6px solid #7d5330;
  border-bottom: 0;
  box-shadow: inset 0 0 0 4px #4a3226, 10px 10px 0 rgba(0, 0, 0, 0.3);
}

.features__row {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.features__item {
  display: flex;
  align-items: flex-end;
}

.feature-book,
.filler-book {
  box-shadow: inset -6px 0 0 rgba(0, 0, 0, 0.22), inset 0 16px 0 -10px rgba(255, 253, 249, 0.35), inset 0 -16px 0 -10px rgba(255, 253, 249, 0.35);
}

.filler-book {
  display: block;
  background: var(--bg);
}

/* a big book for one feature: its building at the top, its name down the spine */
.feature-book {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 104px;
  height: 300px;
  padding: 16px 0 0;
  border: 0;
  background: var(--bg);
  cursor: pointer;
  transform-origin: 50% 100%;
  transition: transform 0.2s steps(4, end), box-shadow 0.2s steps(4, end);
}

.feature-book.is-out {
  z-index: 1;
  transform: translateY(-46px) rotate(-6deg);
  box-shadow: inset -6px 0 0 rgba(0, 0, 0, 0.22), inset 0 16px 0 -10px rgba(255, 253, 249, 0.35), inset 0 -16px 0 -10px rgba(255, 253, 249, 0.35), 10px 10px 0 rgba(0, 0, 0, 0.4);
}

.feature-book:focus-visible {
  outline: 3px solid var(--rl-surface);
  outline-offset: 3px;
}

.feature-book__badge {
  width: 64px;
  height: 54px;
  object-fit: contain;
  image-rendering: pixelated;
  padding: 4px;
  background: rgba(255, 253, 249, 0.92);
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.25);
}

.feature-book__title {
  flex: 1;
  display: flex;
  align-items: center;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  color: #fffdf9;
  font-family: var(--rl-font-title);
  font-size: 26px;
  font-weight: 700;
  white-space: nowrap;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.25);
}

.feature-book__band {
  align-self: stretch;
  height: 10px;
  margin-bottom: 20px;
  background: rgba(255, 253, 249, 0.55);
}

.features__plant {
  width: 54px;
  height: 66px;
  margin-left: 8px;
  image-rendering: pixelated;
}

.features__ledge {
  height: 18px;
  margin: 0 -18px;
  background: #a8743f;
  box-shadow: inset 0 -6px 0 #7d5330, 0 8px 0 rgba(0, 0, 0, 0.3);
}

.features__caption {
  min-height: 110px;
  max-width: 560px;
  margin: 36px auto 0;
  color: var(--rl-surface);
}

.features__tab {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(255, 253, 249, 0.7);
}

.features__headline {
  margin: 0 0 6px;
  font-family: var(--rl-font-title);
  font-size: clamp(24px, 3.4vw, 32px);
  font-weight: 700;
}

.features__line {
  margin: 0;
  font-size: 17px;
  color: rgba(255, 253, 249, 0.85);
}

/* phones: just the five feature books, a little smaller */
@media (max-width: 767px) {
  .features__filler {
    display: none;
  }

  .features__case {
    padding: 28px 10px 0;
  }

  .features__ledge {
    margin: 0 -10px;
  }

  .feature-book {
    width: 58px;
    height: 220px;
  }

  .feature-book__badge {
    width: 44px;
    height: 38px;
  }

  .feature-book__title {
    font-size: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .feature-book {
    transition: none;
  }
}
</style>
