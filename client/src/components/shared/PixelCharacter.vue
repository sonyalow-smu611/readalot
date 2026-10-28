<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The reader's town character, alive: it breathes, blinks now and then, hops when `hop` changes
// and every so often walks on the spot. The same pixel sprite as the map (CharacterSprite), so
// what the reader styles is what walks round town. mirror draws it the other way round (the
// salon's mirror). Still with reduced motion.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import CharacterSprite from '@/components/shared/CharacterSprite.vue'
import { prefersReducedMotion } from '@/lib/motion'

const props = defineProps({
  character: { type: Object, required: true },
  // whole numbers only, so every pixel stays square
  scale: { type: Number, default: 4 },
  label: { type: String, default: '' },
  decorative: { type: Boolean, default: false },
  // bump to make it hop
  hop: { type: Number, default: 0 },
  mirror: { type: Boolean, default: false },
})

const BLINK_MS = 140
const HOP_MS = 420
const STEP_MS = 1300

const blinking = ref(false)
const hopping = ref(false)
const stepping = ref(false)
let blinkTimer = 0
let stepTimer = 0
let hopTimer = 0
let still = true

// between about 2.5 and 5.5 seconds, so it doesn't look mechanical
const wait = (from, spread) => from + Math.random() * spread

function blinkSoon() {
  blinkTimer = window.setTimeout(() => {
    blinking.value = true
    blinkTimer = window.setTimeout(() => {
      blinking.value = false
      blinkSoon()
    }, BLINK_MS)
  }, wait(2500, 3000))
}

function stepSoon() {
  stepTimer = window.setTimeout(() => {
    stepping.value = true
    stepTimer = window.setTimeout(() => {
      stepping.value = false
      stepSoon()
    }, STEP_MS)
  }, wait(6000, 5000))
}

watch(
  () => props.hop,
  () => {
    if (still) return
    hopping.value = false
    window.clearTimeout(hopTimer)
    // restart the animation even if it was mid-hop
    requestAnimationFrame(() => {
      hopping.value = true
      hopTimer = window.setTimeout(() => (hopping.value = false), HOP_MS)
    })
  },
)

onMounted(() => {
  still = prefersReducedMotion()
  if (still) return
  blinkSoon()
  stepSoon()
})

onBeforeUnmount(() => {
  window.clearTimeout(blinkTimer)
  window.clearTimeout(stepTimer)
  window.clearTimeout(hopTimer)
})
</script>

<template>
  <div
    class="pixel-character"
    :class="{ 'is-hopping': hopping, 'is-stepping': stepping && !hopping, 'is-mirrored': mirror }"
    :style="{ '--px': `${Math.max(1, Math.round(scale))}px` }"
  >
    <div class="pixel-character__body">
      <CharacterSprite
        :character="character"
        :scale="scale"
        :label="label"
        :decorative="decorative"
        :blink="blinking"
      />
    </div>
  </div>
</template>

<style scoped>
.pixel-character {
  display: inline-block;
}

.pixel-character.is-mirrored {
  transform: scaleX(-1);
}

/* breathing: the body rises one pixel and settles, in whole pixels */
.pixel-character__body {
  animation: pixel-breathe 2.4s steps(1, end) infinite;
}

.is-stepping .pixel-character__body {
  animation: pixel-step 0.32s steps(1, end) 4;
}

.is-hopping .pixel-character__body {
  animation: pixel-hop 0.42s steps(6, end);
}

@keyframes pixel-breathe {
  0%,
  55% {
    transform: translateY(0);
  }
  60%,
  95% {
    transform: translateY(calc(var(--px) * -1));
  }
}

/* walking on the spot: a tiny bounce from foot to foot */
@keyframes pixel-step {
  0% {
    transform: translate(0, 0) rotate(0);
  }
  25% {
    transform: translate(calc(var(--px) * -1), calc(var(--px) * -2)) rotate(-2deg);
  }
  50% {
    transform: translate(0, 0) rotate(0);
  }
  75% {
    transform: translate(var(--px), calc(var(--px) * -2)) rotate(2deg);
  }
}

@keyframes pixel-hop {
  0% {
    transform: translateY(0) scale(1, 1);
  }
  15% {
    transform: translateY(0) scale(1.06, 0.92);
  }
  45% {
    transform: translateY(calc(var(--px) * -8)) scale(0.96, 1.05);
  }
  80% {
    transform: translateY(0) scale(1.04, 0.95);
  }
  100% {
    transform: translateY(0) scale(1, 1);
  }
}

.pixel-character__body {
  transform-origin: 50% 100%;
}

@media (prefers-reduced-motion: reduce) {
  .pixel-character__body,
  .is-stepping .pixel-character__body,
  .is-hopping .pixel-character__body {
    animation: none;
  }
}
</style>
