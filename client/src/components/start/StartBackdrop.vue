<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The sky behind the landing page under the hero. It follows the reader down the page: early
// evening at the top, deep night at the bottom. The sun sets, a few clouds thin out, the stars
// come out and the moon rises, and along the bottom a far row of the town's houses darkens and
// switches its lights on one by one. A soft lantern glow follows the mouse. Everything changes
// slowly with the scroll; nothing flashes or moves on its own except the clouds drifting.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { prefersReducedMotion } from '@/lib/motion'
import StartSky from './StartSky.vue'

const props = defineProps({
  // how far down the page the reader is, 0 at the top and 1 at the bottom
  progress: { type: Number, default: 0 },
})

// the sky overhead and at the horizon, from early evening to night
const SKY = [
  { at: 0, top: [93, 139, 184], low: [242, 196, 141] },
  { at: 0.35, top: [63, 95, 143], low: [217, 143, 122] },
  { at: 0.7, top: [44, 42, 84], low: [110, 72, 104] },
  { at: 1, top: [21, 18, 29], low: [47, 37, 64] },
]

// the far row of houses; each switches its lights on at its own point down the page
const HOUSES = [
  { src: 'cottage-grey', on: 0.55 },
  { src: 'cottage-green', on: 0.72 },
  { src: 'library', on: 0.48 },
  { src: 'cottage-white', on: 0.8 },
  { src: 'cafe', on: 0.42 },
  { src: 'cottage-lilac', on: 0.66 },
  { src: 'house', on: 0.6 },
  { src: 'cottage-rose', on: 0.86 },
  { src: 'salon', on: 0.5 },
  { src: 'cottage-teal', on: 0.76 },
  { src: 'cottage-brick', on: 0.62 },
]

// stars in fixed places (a small repeatable sequence), a few of them twinkling slowly
function sequence(seed) {
  let n = seed
  return () => {
    n = (n * 9301 + 49297) % 233280
    return n / 233280
  }
}
const next = sequence(17)
const STARS = Array.from({ length: 46 }, (_, i) => ({
  id: i,
  left: `${(next() * 98 + 1).toFixed(1)}%`,
  top: `${(next() * 62 + 2).toFixed(1)}%`,
  size: next() < 0.8 ? 2 : 4,
  twinkle: i % 5 === 0,
  delay: `${(-next() * 6).toFixed(1)}s`,
}))

const clamp = (n) => Math.min(1, Math.max(0, n))

function mix(key) {
  const p = clamp(props.progress)
  const i = Math.max(0, SKY.findIndex((stop) => stop.at >= p) - 1)
  const a = SKY[i]
  const b = SKY[Math.min(i + 1, SKY.length - 1)]
  const t = b.at === a.at ? 0 : (p - a.at) / (b.at - a.at)
  return `rgb(${a[key].map((c, j) => Math.round(c + (b[key][j] - c) * t)).join(',')})`
}

const sky = computed(() => ({ background: `linear-gradient(180deg, ${mix('top')} 0%, ${mix('low')} 100%)` }))
const sun = computed(() => ({ top: `${30 + props.progress * 95}%`, opacity: clamp(1.4 - props.progress * 1.8) }))
const moon = computed(() => ({ top: `${105 - clamp((props.progress - 0.45) / 0.5) * 92}%`, opacity: clamp((props.progress - 0.4) * 4) }))
const stars = computed(() => ({ opacity: clamp((props.progress - 0.3) / 0.45) }))
const clouds = computed(() => ({ opacity: clamp(1 - props.progress * 1.6) }))
// the far houses come into view once the hero's map has scrolled away
const town = computed(() => ({ opacity: clamp(props.progress * 8 - 0.4) }))
// the houses darken as night falls, and glow once their lights are on
function house(item) {
  const lit = props.progress >= item.on
  const dark = 1 - 0.7 * clamp(props.progress * 1.2)
  return {
    filter: lit
      ? 'brightness(0.95) saturate(0.95) drop-shadow(0 0 10px rgba(255, 205, 110, 0.5))'
      : `brightness(${dark.toFixed(2)}) saturate(${(0.4 + dark * 0.6).toFixed(2)})`,
  }
}

// the lantern: a soft warm light where the mouse is (not on touch screens or with reduced motion)
const lantern = ref(null)
const glow = computed(() => ({ opacity: 0.1 + props.progress * 0.16 }))
let showLantern = false

function follow(event) {
  if (!lantern.value) return
  lantern.value.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`
}

onMounted(() => {
  showLantern = window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion()
  if (showLantern) window.addEventListener('pointermove', follow, { passive: true })
  else if (lantern.value) lantern.value.hidden = true
})

onBeforeUnmount(() => window.removeEventListener('pointermove', follow))
</script>

<template>
  <div class="backdrop" :style="sky" aria-hidden="true">
    <span class="backdrop__sun" :style="sun" />
    <div class="backdrop__clouds" :style="clouds">
      <StartSky :seed="5" :count="0" />
    </div>
    <div class="backdrop__stars" :style="stars">
      <span
        v-for="star in STARS"
        :key="star.id"
        class="backdrop__star"
        :class="{ 'backdrop__star--twinkle': star.twinkle }"
        :style="{ left: star.left, top: star.top, width: `${star.size}px`, height: `${star.size}px`, animationDelay: star.delay }"
      />
    </div>
    <span class="backdrop__moon" :style="moon" />
    <div class="backdrop__town" :style="town">
      <img v-for="item in HOUSES" :key="item.src" class="backdrop__house" :src="`/town/buildings/${item.src}.png`" :style="house(item)" alt="" />
    </div>
    <span ref="lantern" class="backdrop__lantern"><span class="backdrop__glow" :style="glow" /></span>
  </div>
</template>

<style scoped>
.backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.backdrop__sun {
  position: absolute;
  left: 78%;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: radial-gradient(circle, #ffd98a 0 55%, rgba(255, 217, 138, 0.35) 56%, transparent 72%);
  box-shadow: 0 0 120px 40px rgba(255, 217, 138, 0.3);
  transform: translate(-50%, -50%);
}

.backdrop__clouds,
.backdrop__stars {
  position: absolute;
  inset: 0;
}

.backdrop__star {
  position: absolute;
  background: #fffdf2;
}

.backdrop__star--twinkle {
  animation: backdrop-twinkle 6s ease-in-out infinite;
}

@keyframes backdrop-twinkle {
  50% { opacity: 0.3; }
}

/* a crescent moon */
.backdrop__moon {
  position: absolute;
  left: 82%;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  box-shadow: inset -20px 9px 0 0 #f6e7b8, 0 0 60px 10px rgba(246, 231, 184, 0.1);
  transform: translateY(-50%);
}

/* the far row of houses along the bottom, standing on a dark strip of ground */
.backdrop__town {
  position: absolute;
  left: 50%;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding-bottom: 8px;
  transform: translateX(-50%);
  border-bottom: 8px solid rgba(20, 30, 24, 0.55);
}

.backdrop__house {
  flex: none;
  height: 78px;
  width: auto;
  image-rendering: pixelated;
  opacity: 0.85;
  transition: filter 0.9s ease;
}

/* the lantern's glow, centred on the mouse; it eases after it rather than snapping */
.backdrop__lantern {
  position: absolute;
  left: 0;
  top: 0;
  transition: transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.backdrop__glow {
  position: absolute;
  left: -220px;
  top: -220px;
  width: 440px;
  height: 440px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 214, 140, 1) 0%, rgba(255, 214, 140, 0) 65%);
}

@media (max-width: 767px) {
  .backdrop__house {
    height: 54px;
  }

  .backdrop__sun {
    width: 100px;
    height: 100px;
  }

  .backdrop__moon {
    width: 56px;
    height: 56px;
    box-shadow: inset -14px 6px 0 0 #f6e7b8;
  }
}

@media (prefers-reduced-motion: reduce) {
  .backdrop__star--twinkle {
    animation: none;
  }

  .backdrop__house {
    transition: none;
  }
}
</style>
