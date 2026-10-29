<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// One stop on the landing page's tour, a screen of its own set in a different corner of town at
// a different time of day: its own sky and sun, clouds and sparkles in the air, and along the
// bottom a street of houses or a strip of the town map with townsfolk about. On top: its scene,
// its tab, its name, one line and a few things you can do there. Room trinkets bob in the corners and spin when tapped. The sky and street stay
// put while the words and scene fade (data-fade).
import { gsap, prefersReducedMotion } from '@/lib/motion'
import StartSky from './StartSky.vue'
import StartStopArt from './StartStopArt.vue'
import StartBookcase from './StartBookcase.vue'
import StartStreet from './StartStreet.vue'
import StartMapBand from './StartMapBand.vue'

defineProps({
  // the stop's id; the screen is #start-<id> so the bar and the cards can scroll to it
  id: { type: String, required: true },
  title: { type: String, required: true },
  line: { type: String, required: true },
  // the part of the app it opens, as on the town's place card (e.g. "My Room")
  tab: { type: String, required: true },
  // the building's colour from town/places.js
  accent: { type: String, required: true },
  // the stop's scene (see stops.js)
  art: { type: Object, required: true },
  points: { type: Array, default: () => [] },
  // up to four small sprites ({ src, w, h, scale }) floating in the screen's corners
  decor: { type: Array, default: () => [] },
  // put the scene on the right on a laptop, so the stops zigzag down the page
  flip: { type: Boolean, default: false },
  // where this screen's sparkles start
  seed: { type: Number, default: 1 },
  // the sky's top, middle and horizon colours
  sky: { type: Array, required: true },
  // { x, y, size, colour }: where the sun hangs
  sun: { type: Object, required: true },
  // along the bottom: { type: 'street', houses, walkers } or { type: 'map', focus, people }
  scenery: { type: Object, required: true },
})

function spin(event) {
  if (prefersReducedMotion()) return
  gsap.fromTo(event.currentTarget, { rotation: 0, scale: 1.3 }, { rotation: 360, scale: 1, duration: 0.6, ease: 'steps(8)', overwrite: true })
}
</script>

<template>
  <section
    :id="`start-${id}`"
    class="stop"
    :class="{ 'stop--flip': flip, 'stop--wide': art.bookcase }"
    :style="{ '--stop-accent': accent, '--sky-top': sky[0], '--sky-mid': sky[1], '--sky-low': sky[2] }"
    :aria-label="title"
  >
    <span
      class="stop__sun"
      :style="{ left: sun.x, top: sun.y, width: `${sun.size}px`, height: `${sun.size}px`, '--sun': sun.colour }"
      aria-hidden="true"
    />
    <StartSky :seed="seed" />
    <StartStreet v-if="scenery.type === 'street'" :houses="scenery.houses" :walkers="scenery.walkers" />
    <StartMapBand v-else :focus="scenery.focus" :people="scenery.people" />
    <!-- trinkets are only for fun, so they stay out of the tab order and away from screen readers -->
    <button
      v-for="(piece, i) in decor.slice(0, 4)"
      :key="i"
      type="button"
      class="stop__decor"
      :class="`stop__decor--${i}`"
      tabindex="-1"
      aria-hidden="true"
      @click="spin"
    >
      <img :src="piece.src" :style="{ width: `${piece.w * piece.scale}px`, height: `${piece.h * piece.scale}px`, animationDelay: `${i * -0.8}s` }" alt="" />
    </button>
    <div class="stop__body" data-fade>
      <StartBookcase v-if="art.bookcase" />
      <StartStopArt v-else :art="art" :accent="accent" />
      <div class="stop__words">
        <span class="stop__tab">{{ tab }}</span>
        <h2 class="stop__title">{{ title }}</h2>
        <p class="stop__line">{{ line }}</p>
        <ul v-if="points.length" class="stop__points">
          <li v-for="point in points" :key="point">{{ point }}</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stop {
  --stop-a: color-mix(in srgb, var(--stop-accent) 80%, #1e1a24);
  --stop-b: color-mix(in srgb, var(--stop-accent) 70%, #1e1a24);
  position: relative;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  /* room for the bar on top and the street along the bottom */
  padding: 88px 16px 260px;
  overflow: hidden;
  /* this corner of town's sky, darkest overhead and glowing at the horizon */
  background: linear-gradient(180deg, var(--sky-top) 0%, var(--sky-mid) 50%, var(--sky-low) 100%);
}

/* the sun, a soft disc with a halo, hanging back behind everything */
.stop__sun {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, var(--sun) 0 55%, color-mix(in srgb, var(--sun) 40%, transparent) 56%, transparent 72%);
  box-shadow: 0 0 120px 40px color-mix(in srgb, var(--sun) 35%, transparent);
  transform: translate(-50%, -50%);
  translate: calc(var(--px, 0) * -6px) calc(var(--py, 0) * -4px);
  pointer-events: none;
}

/* a soft light behind the scene */
.stop::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 55% 45% at 50% 42%, rgba(255, 244, 222, 0.16), transparent 70%);
}

@media (max-width: 767px) {
  .stop {
    padding-bottom: 190px;
  }

  /* on a phone the words fill the middle, so the sun keeps to the top corner */
  .stop__sun {
    left: 84% !important;
    top: 92px !important;
    width: 64px !important;
    height: 64px !important;
  }
}

/* Room trinkets: each bobs a pixel at a time, sits at its own depth for the mouse parallax,
   and spins when tapped. Only where there's room for them. */
.stop__decor {
  position: absolute;
  z-index: 1;
  display: none;
  padding: 6px;
  border: 0;
  background: none;
  cursor: pointer;
  translate: calc(var(--px, 0) * -40px) calc(var(--py, 0) * -26px);
}

.stop__decor img {
  display: block;
  image-rendering: pixelated;
  filter: drop-shadow(4px 4px 0 rgba(30, 26, 36, 0.35));
  animation: stop-bob 3.2s steps(4, end) infinite alternate;
}

.stop__decor--0 { left: 7%; top: 14%; }
.stop__decor--1 { right: 8%; top: 20%; }
/* the lower two float above the street */
.stop__decor--2 { left: 10%; bottom: 300px; }
.stop__decor--3 { right: 6%; bottom: 330px; }

@keyframes stop-bob {
  to { transform: translateY(-8px); }
}

@media (min-width: 992px) {
  .stop__decor {
    display: block;
  }
}

.stop__body {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  width: 100%;
  max-width: 1000px;
}

.stop__words {
  max-width: 440px;
  text-align: center;
  color: var(--rl-surface);
  translate: calc(var(--px, 0) * 6px) calc(var(--py, 0) * 4px);
}

.stop__tab {
  display: inline-block;
  padding: 4px 12px;
  background: var(--rl-surface);
  color: var(--stop-accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  box-shadow: 3px 3px 0 rgba(30, 26, 36, 0.35);
}

.stop__title {
  margin: 12px 0 6px;
  font-family: var(--rl-font-title);
  font-size: clamp(30px, 6vw, 44px);
  font-weight: 700;
  text-shadow: 3px 3px 0 rgba(30, 26, 36, 0.3);
}

.stop__line {
  margin: 0 0 14px;
  font-size: 18px;
  line-height: 1.45;
  color: rgba(255, 253, 249, 0.92);
}

.stop__points {
  display: inline-flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  text-align: left;
  font-size: 16px;
}

/* square pixel bullets */
.stop__points li::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 10px;
  vertical-align: 2px;
  background: var(--rl-surface);
  box-shadow: 2px 2px 0 rgba(30, 26, 36, 0.35);
}

@media (min-width: 992px) {
  .stop__body {
    flex-direction: row;
    justify-content: center;
    gap: 64px;
  }

  .stop--flip .stop__body {
    flex-direction: row-reverse;
  }

  .stop__words {
    text-align: left;
  }
}

/* the bookshelf stop: the bookcase big and in the middle, the words beside it */
@media (min-width: 992px) {
  .stop--wide .stop__body {
    max-width: 1180px;
    gap: 48px;
  }

  .stop--wide .stop__words {
    max-width: 340px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stop__decor img {
    animation: none;
  }
}
</style>
