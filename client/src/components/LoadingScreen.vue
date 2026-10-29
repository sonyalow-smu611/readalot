<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// "Town wakes up": while the app gets ready, the real town map (public/town/map.png) wakes up.
// It starts at night with the lamps and windows lit (positions from town/map-data.json), dawn
// breaks, the camera glides out over the town, cars drive the main road and townsfolk walk the
// pavements, and the IKDA sign (with 읽다, the Korean word it comes from, "to read") pops in over a pixel book flipping its pages. Then it fades
// into the app.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import { BOOK_FRAMES, drawPixelBook } from '@/lib/pixelBook.js'
import { drawPixelCloud } from '@/lib/pixelCloud.js'
import mapData from '@/town/map-data.json'
import { MAP_H, MAP_W } from '@/town/places.js'

const emit = defineEmits(['done'])
const root = ref(null)
const map = ref(null)
const router = useRouter()
const letters = 'IKDA'.split('')

// The main road runs across the map at y 1216; cars keep left, walkers keep to the pavements.
const ROAD_Y = 1216
const CARS = [
  { art: 'red', y: ROAD_Y - 32, from: -200, to: 2600, delay: 0 },
  { art: 'teal', y: ROAD_Y + 32, from: 2600, to: -200, delay: 0.4 },
  { art: 'yellow', y: ROAD_Y - 32, from: -900, to: 2200, delay: 0.9 },
]
const WALKERS = [
  { art: 'pip', y: ROAD_Y - 76, from: 700, to: 1100 },
  { art: 'stella', y: ROAD_Y + 76, from: 1900, to: 1500 },
  { art: 'leo', y: ROAD_Y + 76, from: 300, to: 640 },
]
// clouds are drawn 3x as big, then doubled like the map's own art pixels
const CLOUD_SIZE = 3
const CLOUDS = [
  { x: 300, y: 760 },
  { x: 1500, y: 600 },
  { x: 2100, y: 1480 },
  { x: 900, y: 1560 },
]
// where the camera looks: from close on the plaza to the whole middle of town
const LOOK = { x: 1460, y: 1120 }
const VIEW = { from: { w: 900, h: 600 }, to: { w: 1800, h: 1150 } }

const cloud = drawPixelCloud(CLOUD_SIZE)
// the book is drawn 4x, so its pixels sit close to the map's
const BOOK_SCALE = 4
const book = drawPixelBook()
const bookStyle = {
  width: `${book.frameW * BOOK_SCALE}px`,
  height: `${book.frameH * BOOK_SCALE}px`,
  backgroundImage: `url(${book.src})`,
  backgroundSize: `${book.frameW * BOOK_FRAMES * BOOK_SCALE}px ${book.frameH * BOOK_SCALE}px`,
  '--sheet': `${-book.frameW * BOOK_FRAMES * BOOK_SCALE}px`,
}
let timeline = null

function camera(view) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const scale = Math.max(vw / view.w, vh / view.h)
  return { x: vw / 2 - LOOK.x * scale, y: vh / 2 - LOOK.y * scale, scale }
}

onMounted(async () => {
  await router.isReady()
  if (prefersReducedMotion() || !root.value) {
    emit('done')
    return
  }
  const q = (selector) => root.value.querySelectorAll(selector)
  gsap.set(map.value, { transformOrigin: '0 0', ...camera(VIEW.from) })
  timeline = gsap.timeline({ defaults: { force3D: false }, onComplete: () => emit('done') })
  timeline
    .to(map.value, { ...camera(VIEW.to), duration: 2.6, ease: 'power2.inOut' }, 0)
    .to(q('.boot__night'), { opacity: 0, duration: 1.8, ease: 'sine.inOut' }, 0.3)
    .to(q('.boot__light'), { opacity: 0, duration: 1.4, ease: 'sine.in' }, 0.7)
    .to(q('.boot__cloud'), { x: '+=220', duration: 2.6, ease: 'none' }, 0)
  CARS.forEach((car, i) => {
    timeline.fromTo(q('.boot__car')[i], { x: car.from }, { x: car.to, duration: 2.6 - car.delay, ease: 'none' }, car.delay)
  })
  WALKERS.forEach((walker, i) => {
    timeline.fromTo(q('.boot__walker')[i], { x: walker.from }, { x: walker.to, duration: 2.6, ease: 'none' }, 0)
  })
  timeline
    .from(q('.boot__sign'), { y: -40, scale: 0.6, autoAlpha: 0, duration: 0.6, ease: 'back.out(2)' }, 0.5)
    .from(q('.boot__letter'), { y: -30, autoAlpha: 0, duration: 0.45, stagger: 0.05, ease: 'bounce.out' }, 0.7)
    .from(q('.boot__korean'), { autoAlpha: 0, y: 8, duration: 0.35 }, 1.1)
    .from(q('.boot__note'), { autoAlpha: 0, y: 8, duration: 0.35 }, 1.3)
    .from(q('.boot__book'), { y: 40, autoAlpha: 0, duration: 0.55, ease: 'back.out(1.8)' }, 0.2)
    .to(root.value, { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, 2.6)
})

onBeforeUnmount(() => timeline?.kill())
</script>

<template>
  <div ref="root" class="boot" role="status" aria-live="polite">
    <div ref="map" class="boot__map" :style="{ width: `${MAP_W}px`, height: `${MAP_H}px` }" aria-hidden="true">
      <div class="boot__night" />
      <span
        v-for="(w, i) in mapData.windows"
        :key="`w${i}`"
        class="boot__light boot__window"
        :style="{ left: `${w.x}px`, top: `${w.y}px`, width: `${w.w}px`, height: `${w.h}px` }"
      />
      <span
        v-for="([lx, ly], i) in mapData.lamps"
        :key="`l${i}`"
        class="boot__light boot__lamp"
        :style="{ left: `${lx}px`, top: `${ly}px` }"
      />
      <img
        v-for="(car, i) in CARS"
        :key="`car${i}`"
        class="boot__car"
        :class="{ 'is-west': car.to < car.from }"
        :src="`/town/cars/${car.art}.png`"
        alt=""
        :style="{ top: `${car.y - 32}px` }"
      />
      <img
        v-for="(walker, i) in WALKERS"
        :key="`walker${i}`"
        class="boot__walker"
        :class="{ 'is-west': walker.to < walker.from }"
        :src="`/town/avatars/${walker.art}.png`"
        alt=""
        :style="{ top: `${walker.y - 116}px` }"
      />
      <img
        v-for="(c, i) in CLOUDS"
        :key="`cloud${i}`"
        class="boot__cloud"
        :src="cloud.src"
        alt=""
        :style="{ left: `${c.x}px`, top: `${c.y}px`, width: `${cloud.width * 2}px`, height: `${cloud.height * 2}px` }"
      />
    </div>

    <div class="boot__front">
      <div class="boot__sign">
        <p class="boot__brand" aria-label="IKDA">
          <span v-for="(letter, index) in letters" :key="index" class="boot__letter" aria-hidden="true">{{ letter }}</span>
        </p>
        <p class="boot__korean"><span lang="ko">읽다</span> · to read</p>
        <p class="boot__note">Waking up the town…</p>
      </div>
      <div class="boot__book" :style="bookStyle" aria-hidden="true" />
    </div>
  </div>
</template>

<style scoped>
.boot {
  position: absolute;
  inset: 0;
  z-index: 80;
  overflow: hidden;
  background: #6fb14b;
  color: #2b2230;
}

.boot__map {
  position: absolute;
  top: 0;
  left: 0;
  background: url('/town/map.png') no-repeat;
  background-size: 100% 100%;
  image-rendering: pixelated;
}

.boot__map img {
  position: absolute;
  image-rendering: pixelated;
}

/* the night the town wakes from */
.boot__night {
  position: absolute;
  inset: 0;
  background: rgba(20, 28, 74, 0.6);
}

.boot__window {
  position: absolute;
  background: rgba(255, 226, 122, 0.85);
  box-shadow: 0 0 24px 8px rgba(255, 214, 102, 0.55);
}

.boot__lamp {
  position: absolute;
  width: 220px;
  height: 220px;
  margin: -110px 0 0 -110px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 236, 160, 0.85), rgba(255, 214, 102, 0.25) 40%, transparent 70%);
}

.boot__car {
  left: 0;
  width: 116px;
  height: 64px;
}

.boot__walker {
  left: 0;
  width: 60px;
  height: 116px;
  animation: step 0.36s steps(1, end) infinite;
}

.boot__car.is-west,
.boot__walker.is-west {
  scale: -1 1;
}

.boot__cloud {
  filter: drop-shadow(0 40px 0 rgba(30, 40, 70, 0.18));
}

.boot__front {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
}

/* the sign, in the town's chip style */
.boot__sign {
  padding: 18px 34px 20px;
  border: 4px solid #2b2230;
  border-radius: 22px;
  background: #fffdf9;
  box-shadow: 0 8px 0 #2b2230, 0 24px 40px rgba(20, 28, 74, 0.35);
  text-align: center;
}

.boot__brand {
  margin: 0;
  font-family: var(--rl-font-title);
  font-size: clamp(2.6rem, 8vw, 4.75rem);
  font-weight: 700;
  line-height: 1;
  color: #2f5fb3;
  text-shadow: 0 4px 0 #f6e27a;
}

.boot__letter {
  display: inline-block;
}

/* the Korean word the name comes from, and what it means */
.boot__korean {
  margin: 8px 0 0;
  color: #2b2230;
  font-size: clamp(1.1rem, 2.6vw, 1.4rem);
  font-weight: 700;
}

.boot__korean span {
  color: #2f5fb3;
}

.boot__note {
  margin: 10px 0 0;
  color: #5a5a68;
  font-weight: 700;
}

/* a pixel book flipping a page, over and over: one step per frame (BOOK_FRAMES) */
.boot__book {
  margin-top: 14px;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  filter: drop-shadow(0 8px 0 rgba(30, 26, 36, 0.35));
  animation: flip 1.1s steps(10) infinite;
}

@keyframes flip {
  to { background-position: var(--sheet) 0; }
}

@keyframes step {
  50% { translate: 0 -4px; }
}
</style>
