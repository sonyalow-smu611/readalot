<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The landing page a first-time visitor sees before signing in. A bar stays on top with a link
// to each stop and Sign up. It opens on a shelf of books over the town, with the tagline, a line
// saying what the app does and Sign up, then a shelf with one book per feature, then one screen
// per stop, each a different corner of town at a different time of day with townsfolk about,
// then Sign up again under the night sky. The words and scenes fade in as they arrive and away as
// they leave, and the air shifts with the mouse. Leaving through Sign up or Log in remembers it
// has been seen (lib/landing.js), so after that the router sends visitors straight to sign in.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { prefersReducedMotion } from '@/lib/motion'
import { markLandingSeen } from '@/lib/landing.js'
import { useScrollFade } from '@/composables/useScrollFade.js'
import { usePointerParallax } from '@/composables/usePointerParallax.js'
import { STOPS } from '@/components/start/stops.js'
import StartTownScene from '@/components/start/StartTownScene.vue'
import StartSky from '@/components/start/StartSky.vue'
import StartActions from '@/components/start/StartActions.vue'
import StartStop from '@/components/start/StartStop.vue'
import StartNav from '@/components/start/StartNav.vue'
import StartFeatureShelf from '@/components/start/StartFeatureShelf.vue'
import StartStreet from '@/components/start/StartStreet.vue'
import StartShelf from '@/components/start/StartShelf.vue'

const NAV = STOPS.map((stop) => ({ id: stop.id, label: stop.tab }))

const root = ref(null)
const scroller = ref(null)
useScrollFade(scroller)
usePointerParallax(root)

// the stop most in view, for the bar
const active = ref('')
let watcher = null

function go(id) {
  document.getElementById(`start-${id}`)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}

onMounted(() => {
  if (!('IntersectionObserver' in window)) return
  watcher = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) active.value = entry.target.id.replace('start-', '')
        else if (active.value === entry.target.id.replace('start-', '')) active.value = ''
      }
    },
    { root: scroller.value, threshold: 0.5 },
  )
  for (const stop of STOPS) {
    const el = document.getElementById(`start-${stop.id}`)
    if (el) watcher.observe(el)
  }
})

onBeforeUnmount(() => watcher?.disconnect())
</script>

<template>
  <div ref="root" class="start">
    <div ref="scroller" class="start__scroll">
      <StartNav :items="NAV" :active="active" @go="go" @choose="markLandingSeen" />
      <section class="start__hero" aria-labelledby="start-title">
        <StartTownScene />
        <div class="start__shade" aria-hidden="true" />
        <!-- fireflies over the town -->
        <StartSky colour="#ffe9a3" :seed="7" :count="24" :clouds="false" />
        <div class="start__pitch" data-fade>
          <StartShelf />
          <p class="start__brand">Readalot · a reading tracker</p>
          <h1 id="start-title" class="start__tagline">Keep track of every book you read.</h1>
          <p class="start__sub">
            Shelve what you're reading, find your next favourite book, and meet readers who love the
            same books, all in a cozy pixel town.
          </p>
          <StartActions @choose="markLandingSeen" />
        </div>
        <p class="start__cue" aria-hidden="true">
          Scroll to see how it works
          <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
        </p>
      </section>

      <StartFeatureShelf :stops="STOPS" @go="go" />

      <StartStop
        v-for="(stop, i) in STOPS"
        :id="stop.id"
        :key="stop.id"
        :title="stop.title"
        :tab="stop.tab"
        :line="stop.line"
        :points="stop.points"
        :accent="stop.accent"
        :art="stop.art"
        :decor="stop.decor"
        :flip="i % 2 === 1"
        :seed="i + 1"
        :sky="stop.sky"
        :sun="stop.sun"
        :scenery="stop.scenery"
      />

      <section class="start__end" aria-labelledby="start-end-title">
        <span class="start__moon" aria-hidden="true" />
        <StartSky colour="#f6d77a" :seed="11" />
        <!-- everyone in town turns out to see you off -->
        <StartStreet :houses="['cottage-green', 'library', 'cottage-white', 'cafe', 'cottage-lilac', 'salon']" :walkers="['rosie', 'maya', 'rex', 'jay', 'nova']" />
        <div class="start__pitch" data-fade>
          <img class="start__home" src="/town/buildings/house.png" alt="" aria-hidden="true" />
          <h2 id="start-end-title" class="start__tagline">Your next book is waiting.</h2>
          <StartActions @choose="markLandingSeen" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.start {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: var(--rl-primary);
}

.start__scroll {
  position: absolute;
  inset: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.start__hero,
.start__end {
  position: relative;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px 16px;
  text-align: center;
}

/* dims the town so the white words read clearly over it */
.start__shade {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(30, 26, 36, 0.7), rgba(30, 26, 36, 0.45));
}

.start__pitch {
  position: relative;
  z-index: 1;
}

/* the last screen: night over the town, with the whole street out */
.start__end {
  padding-bottom: 260px;
  overflow: hidden;
  background: linear-gradient(180deg, #1e1a24 0%, #2f2540 55%, #6b4a5c 100%);
}

/* a crescent moon over the night street */
.start__moon {
  position: absolute;
  top: 14%;
  right: 16%;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  box-shadow: inset -22px 10px 0 0 #f6e7b8, 0 0 60px 10px rgba(246, 231, 184, 0.15);
  translate: calc(var(--px, 0) * -6px) calc(var(--py, 0) * -4px);
}

@media (max-width: 767px) {
  .start__end {
    padding-bottom: 190px;
  }
}

/* your house from the town, at half size; it leans with the mouse */
.start__home {
  display: block;
  width: 266px;
  height: 210px;
  margin: 0 auto 20px;
  image-rendering: pixelated;
  filter: drop-shadow(8px 8px 0 rgba(30, 26, 36, 0.45));
  translate: calc(var(--px, 0) * 12px) calc(var(--py, 0) * 8px);
}

.start__brand {
  margin: 0 0 8px;
  color: rgba(255, 253, 249, 0.85);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.start__sub {
  max-width: 560px;
  margin: -12px auto 26px;
  color: rgba(255, 253, 249, 0.9);
  font-size: clamp(16px, 2vw, 19px);
  line-height: 1.5;
  text-shadow: 0 1px 10px rgba(30, 26, 36, 0.6);
}

.start__tagline {
  max-width: 760px;
  margin: 0 auto 28px;
  font-family: var(--rl-font-title);
  font-size: clamp(34px, 7vw, 60px);
  font-weight: 700;
  line-height: 1.12;
  color: var(--rl-surface);
  text-shadow: 0 2px 16px rgba(30, 26, 36, 0.55);
}

.start__cue {
  position: absolute;
  z-index: 1;
  bottom: 28px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
  color: rgba(255, 253, 249, 0.8);
  font-size: 13px;
}

.start__cue svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  animation: start-cue 1.6s ease-in-out infinite;
}

@keyframes start-cue {
  50% { transform: translateY(5px); }
}

@media (prefers-reduced-motion: reduce) {
  .start__cue svg {
    animation: none;
  }
}
</style>
