<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A stop's little scene in a pixel frame: the room picture, the cafe or salon scene, or a building
// with props and townsfolk lined up on the grass in front of it (some walking in and out of its
// door), or one book held up under the scanner's corners.
// It plays along: the frame tilts towards the mouse, the room pans as the mouse moves across
// it, tapping a character or a pile makes it hop, the building squashes, and the scanner scans.
// The scene is drawn at one size and shrunk whole on a phone, so every piece keeps its place.
import { computed, onBeforeUnmount, ref } from 'vue'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import StartCafeScene from './StartCafeScene.vue'
import StartSalonScene from './StartSalonScene.vue'

const props = defineProps({
  // one stop's `art` from stops.js
  art: { type: Object, required: true },
  accent: { type: String, default: 'var(--rl-accent)' },
})

const pieces = computed(() => props.art.pieces ?? [])
// where the room picture is looking, 0 (left wall) to 100 (right wall)
const look = ref(44)
const scanning = ref(false)
const found = ref(false)
let scanTimer = 0

function size(piece) {
  return { width: `${Math.round(piece.w * piece.scale)}px`, height: `${Math.round(piece.h * piece.scale)}px` }
}

const backdropStyle = computed(() => {
  const box = size(props.art.backdrop)
  return { ...box, marginLeft: `-${Math.round((props.art.backdrop.w * props.art.backdrop.scale) / 2)}px` }
})

function lookAround(event) {
  if (prefersReducedMotion()) return
  const box = event.currentTarget.getBoundingClientRect()
  look.value = Math.round(((event.clientX - box.left) / box.width) * 100)
}

function hop(event) {
  if (prefersReducedMotion()) return
  gsap.fromTo(event.currentTarget, { y: 0 }, { y: -22, duration: 0.18, ease: 'steps(3)', yoyo: true, repeat: 1, overwrite: true })
}

function squash(event) {
  if (prefersReducedMotion()) return
  gsap.fromTo(
    event.currentTarget,
    { scaleX: 1.06, scaleY: 0.9 },
    { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'elastic.out(1.2, 0.4)', transformOrigin: '50% 100%', overwrite: true },
  )
}

function scan() {
  if (scanning.value) return
  scanning.value = true
  found.value = false
  window.clearTimeout(scanTimer)
  scanTimer = window.setTimeout(() => {
    scanning.value = false
    found.value = true
    scanTimer = window.setTimeout(() => (found.value = false), 1400)
  }, prefersReducedMotion() ? 0 : 900)
}

onBeforeUnmount(() => window.clearTimeout(scanTimer))
</script>

<template>
  <!-- the scene is a picture; its taps are for fun and the page says everything in words -->
  <div
    class="art"
    :class="{ 'art--room': art.room, 'art--scan': art.scan, 'art--spread': art.spread, 'is-scanning': scanning }"
    :style="{ '--art-accent': accent }"
    aria-hidden="true"
  >
    <div class="art__canvas">
      <img
        v-if="art.room"
        class="art__room"
        :src="art.room"
        :style="{ objectPosition: `${look}% 100%` }"
        alt=""
        @pointermove="lookAround"
        @pointerleave="look = 44"
      />
      <StartCafeScene v-else-if="art.cafe" />
      <StartSalonScene v-else-if="art.salon" />
      <template v-else>
        <img v-if="art.backdrop" class="art__backdrop art__tap" :src="art.backdrop.src" :style="backdropStyle" alt="" @click="squash" />
        <!-- townsfolk coming out of the door and walking off, or walking up and going in -->
        <span
          v-for="(walker, i) in art.walkers ?? []"
          :key="walker.id"
          class="art__walker"
          :class="{ 'art__walker--in': walker.in }"
          :style="{ '--to-x': `${walker.to}px`, animationDelay: `${i * -1.75}s` }"
        >
          <img :src="`/town/avatars/${walker.id}.png`" alt="" />
        </span>
        <div class="art__ground">
          <img v-for="(piece, i) in pieces" :key="i" class="art__tap" :src="piece.src" :style="size(piece)" alt="" @click="art.scan ? scan() : hop($event)" />
        </div>
        <template v-if="art.scan">
          <!-- a pixel book, cover facing the camera -->
          <button type="button" class="art__book art__tap" tabindex="-1" @click="scan">
            <span class="art__book-label"><span /><span /></span>
          </button>
          <svg class="art__corners" viewBox="0 0 24 24">
            <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
          </svg>
          <div class="art__beam" />
          <Transition name="art-found">
            <p v-if="found" class="art__found">Found it!</p>
          </Transition>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* The scene is 460 x 300; on a phone it shrinks to 0.7 of that, on a big screen it grows. */
.art {
  --k: 1;
  flex-shrink: 0;
  /* the frame sits outside the scene's 460 x 300 */
  box-sizing: content-box;
  width: calc(460px * var(--k));
  height: calc(300px * var(--k));
  border: 4px solid #1e1a24;
  box-shadow: 8px 8px 0 rgba(30, 26, 36, 0.35);
  overflow: hidden;
  background: #8cc05a;
  /* leans towards the mouse (--px, --py come from the page) */
  transform: perspective(900px) rotateY(calc(var(--px, 0) * 5deg)) rotateX(calc(var(--py, 0) * -5deg));
  transition: box-shadow 0.2s steps(2, end);
}

.art:hover {
  box-shadow: 12px 12px 0 rgba(30, 26, 36, 0.4);
}

@media (max-width: 520px) {
  .art {
    --k: 0.7;
  }
}

@media (min-width: 1200px) and (min-height: 700px) {
  .art {
    --k: 1.25;
  }
}

.art__canvas {
  position: relative;
  width: 460px;
  height: 300px;
  transform: scale(var(--k));
  transform-origin: 0 0;
  /* the town's grass, as a pixel checkerboard, with sky above */
  background:
    linear-gradient(180deg, #bfe3f2 0 58%, transparent 58%),
    repeating-conic-gradient(#8cc05a 0 25%, #82b752 0 50%) 0 0 / 16px 16px;
}

.art img {
  image-rendering: pixelated;
}

.art__tap {
  cursor: pointer;
}

.art__room {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: object-position 0.4s ease-out;
  cursor: ew-resize;
}

.art__backdrop {
  position: absolute;
  left: 50%;
  bottom: 64px;
}

.art__ground {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 18px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 14px;
}

/* A walker starts small in the doorway (the door's foot is at 230, 222) and grows as they come
   down the path to --to-x at the front of the scene, fading out at the end. Walking in is the
   same trip backwards. Their feet are the bottom middle of the picture. */
.art__walker {
  position: absolute;
  left: -30px;
  top: -116px;
  transform-origin: 50% 100%;
  opacity: 0;
  pointer-events: none;
  animation: art-walk 7s linear infinite;
}

.art__walker--in {
  animation-direction: reverse;
}

.art__walker img {
  display: block;
  width: 60px;
  height: 116px;
  animation: art-step 0.4s steps(2, end) infinite;
}

@keyframes art-walk {
  0% { transform: translate(230px, 222px) scale(0.42); opacity: 0; }
  8% { opacity: 1; }
  85% { opacity: 1; }
  100% { transform: translate(var(--to-x), 296px) scale(0.85); opacity: 0; }
}

@keyframes art-step {
  50% { translate: 0 -3px; }
}

.art--spread .art__ground {
  justify-content: space-between;
  padding: 0 44px;
}

.art--scan .art__canvas {
  background: repeating-conic-gradient(#f9f3e6 0 25%, #f1e7da 0 50%) 0 0 / 16px 16px;
}

.art--scan .art__ground {
  bottom: 70px;
}

.art__corners {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 280px;
  height: 280px;
  margin: -140px 0 0 -140px;
  fill: none;
  stroke: var(--art-accent);
  stroke-width: 1.4;
  stroke-linecap: square;
  stroke-linejoin: miter;
  /* taps go through the corners to the book */
  pointer-events: none;
}

/* the book: a red cloth cover with a darker spine, a cream label and a pixel drop shadow */
.art__book {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 116px;
  height: 160px;
  margin: -80px 0 0 -58px;
  padding: 0;
  border: 4px solid #1e1a24;
  background:
    linear-gradient(90deg, #7c3027 0 16px, #1e1a24 16px 20px, transparent 20px),
    linear-gradient(180deg, transparent 0 128px, #8c3a2f 128px),
    #a8483a;
  box-shadow: 6px 6px 0 rgba(30, 26, 36, 0.3);
  transform: rotate(-3deg);
}

.art__book-label {
  position: absolute;
  left: 34px;
  right: 14px;
  top: 30px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 8px;
  border: 3px solid #1e1a24;
  background: #f3eee0;
}

.art__book-label span {
  height: 4px;
  background: #574f3c;
}

.art__book-label span + span {
  width: 60%;
}

/* the scanner's line sweeping over the book, a pixel at a time; quicker while it scans */
.art__beam {
  position: absolute;
  left: 140px;
  right: 140px;
  top: 70px;
  height: 4px;
  background: var(--art-accent);
  box-shadow: 0 0 0 2px rgba(255, 253, 249, 0.6);
  pointer-events: none;
  animation: art-beam 2.4s steps(40, end) infinite alternate;
}

.is-scanning .art__beam {
  animation-duration: 0.3s;
}

@keyframes art-beam {
  to { transform: translateY(156px); }
}

.art__found {
  position: absolute;
  left: 50%;
  top: 22px;
  margin: 0;
  padding: 6px 12px;
  background: var(--art-accent);
  color: var(--rl-surface);
  font-size: 15px;
  font-weight: 700;
  box-shadow: 4px 4px 0 rgba(30, 26, 36, 0.35);
  transform: translateX(-50%);
  pointer-events: none;
}

.art-found-enter-active,
.art-found-leave-active {
  transition: opacity 0.15s steps(2, end), transform 0.15s steps(2, end);
}

.art-found-enter-from,
.art-found-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}

@media (prefers-reduced-motion: reduce) {
  .art {
    transform: none;
  }

  .art__beam {
    animation: none;
    transform: translateY(78px);
  }

  .art__walker {
    display: none;
  }
}
</style>
