<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// You, in the corner of the map, like a trainer badge: your character's face in a ring that
// fills with XP toward the next level, the level on a gold tab, and your name and coins beside
// it. The face bobs and blinks; earning XP floats a "+15 XP" up and makes the ring shine, and a
// level-up pops the badge. Tapping it opens the Hair Salon.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import CharacterSprite from '@/components/shared/CharacterSprite.vue'
import CountUp from '@/components/shared/CountUp.vue'
import { prefersReducedMotion } from '@/lib/motion'

const props = defineProps({
  name: { type: String, default: 'You' },
  character: { type: Object, required: true },
  // from lib/levels.js: { level, progress 0-1, toNext }
  level: { type: Object, required: true },
  coins: { type: Number, default: 0 },
  // { xp, coins, key }: the last XP earned
  gain: { type: Object, default: null },
  // bumped at each level-up
  levelUps: { type: Number, default: 0 },
})

// the ring round the face
const RADIUS = 30
const RING = 2 * Math.PI * RADIUS

const blinking = ref(false)
const floating = ref(null)
const shining = ref(false)
const popping = ref(false)
let blinkTimer = 0
let floatTimer = 0
let popTimer = 0
let still = true

const filled = computed(() => RING * (1 - Math.min(1, Math.max(0, props.level.progress))))
const spoken = computed(
  () => `Your profile: ${props.name}, level ${props.level.level}, ${props.level.toNext} XP to the next level, ${props.coins} coins`,
)

function blinkSoon() {
  blinkTimer = window.setTimeout(() => {
    blinking.value = true
    blinkTimer = window.setTimeout(() => {
      blinking.value = false
      blinkSoon()
    }, 140)
  }, 2800 + Math.random() * 3000)
}

watch(
  () => props.gain?.key,
  () => {
    if (!props.gain || still) return
    floating.value = props.gain
    shining.value = true
    window.clearTimeout(floatTimer)
    floatTimer = window.setTimeout(() => {
      floating.value = null
      shining.value = false
    }, 1400)
  },
)

watch(
  () => props.levelUps,
  () => {
    if (still) return
    popping.value = true
    window.clearTimeout(popTimer)
    popTimer = window.setTimeout(() => (popping.value = false), 1600)
  },
)

onMounted(() => {
  still = prefersReducedMotion()
  if (!still) blinkSoon()
})

onBeforeUnmount(() => {
  window.clearTimeout(blinkTimer)
  window.clearTimeout(floatTimer)
  window.clearTimeout(popTimer)
})
</script>

<template>
  <RouterLink
    :to="{ name: 'salon' }"
    class="badge"
    :class="{ 'is-shining': shining, 'is-popping': popping }"
    :aria-label="spoken"
  >
    <span class="badge__portrait" aria-hidden="true">
      <svg class="badge__ring" viewBox="0 0 68 68">
        <circle class="badge__track" cx="34" cy="34" :r="RADIUS" />
        <circle
          class="badge__fill"
          cx="34"
          cy="34"
          :r="RADIUS"
          :stroke-dasharray="RING"
          :stroke-dashoffset="filled"
        />
      </svg>
      <span class="badge__face">
        <CharacterSprite :character="character" crop="head" :scale="2" :blink="blinking" decorative />
      </span>
      <span class="badge__level">{{ level.level }}</span>
    </span>
    <span class="badge__text" aria-hidden="true">
      <span class="badge__name">{{ name }}</span>
      <span class="badge__coins">
        <span class="badge__coin" />
        <CountUp :value="coins" />
      </span>
    </span>
    <span v-if="floating" :key="floating.key" class="badge__float" aria-hidden="true">
      +{{ floating.xp }} XP<template v-if="floating.coins"> · +{{ floating.coins }} coins</template>
    </span>
    <span v-if="popping" class="badge__ribbon" aria-hidden="true">Level {{ level.level }}!</span>
    <span class="visually-hidden" role="status">{{ popping ? `Level up! You are now level ${level.level}.` : '' }}</span>
  </RouterLink>
</template>

<style scoped>
.badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 4px 16px 4px 4px;
  border: 3px solid #2b1d24;
  border-radius: 999px;
  background: #fff8ef;
  box-shadow: 0 4px 0 #2b1d24, 0 8px 18px rgba(43, 29, 36, 0.25);
  color: #2b1d24;
  text-decoration: none;
  pointer-events: auto;
  transition: transform 0.15s ease;
}

.badge:hover {
  transform: translateY(-2px);
}

.badge:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #2b1d24;
}

.badge__portrait {
  position: relative;
  flex: none;
  width: 68px;
  height: 68px;
}

.badge__ring {
  position: absolute;
  inset: 0;
  transform: rotate(-90deg);
}

.badge__track {
  fill: none;
  stroke: #ead7c6;
  stroke-width: 6;
}

.badge__fill {
  fill: none;
  stroke: #3fae5a;
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.is-shining .badge__fill {
  stroke: #f6c94a;
  filter: drop-shadow(0 0 4px #f6e27a);
}

.badge__face {
  position: absolute;
  inset: 8px;
  display: grid;
  place-items: end center;
  overflow: hidden;
  border: 2px solid #2b1d24;
  border-radius: 999px;
  background: radial-gradient(circle at 50% 30%, #fffbe6, #bfe3f2 75%);
}

.badge__face :deep(canvas) {
  animation: face-bob 2.4s steps(1, end) infinite;
}

.badge__level {
  position: absolute;
  right: -4px;
  bottom: -2px;
  display: grid;
  place-items: center;
  min-width: 26px;
  height: 22px;
  padding: 0 5px;
  border: 2px solid #2b1d24;
  border-radius: 6px;
  background: linear-gradient(#ffe57a, #f2b632);
  font-family: var(--rl-font-title);
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
}

.badge__text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.badge__name {
  max-width: 9rem;
  overflow: hidden;
  font-family: var(--rl-font-title);
  font-size: 16px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge__coins {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 700;
}

/* a little pixel coin */
.badge__coin {
  width: 12px;
  height: 12px;
  border: 2px solid #8a5a12;
  border-radius: 3px;
  background: #f6c94a;
  box-shadow: inset -2px -2px 0 #e0a02a;
}

.badge__float {
  position: absolute;
  top: -6px;
  left: 40px;
  padding: 2px 8px;
  border: 2px solid #2b1d24;
  border-radius: 6px;
  background: #3fae5a;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  animation: float-up 1.4s ease-out forwards;
}

.badge__ribbon {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  padding: 4px 12px;
  border: 3px solid #2b1d24;
  border-radius: 6px;
  background: linear-gradient(#ffe57a, #f2b632);
  font-family: var(--rl-font-title);
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 3px 0 #2b1d24;
  animation: ribbon 1.6s ease-out forwards;
}

.is-popping {
  animation: badge-pop 0.6s cubic-bezier(0.3, 1.6, 0.5, 1);
}

@keyframes face-bob {
  0%,
  55% {
    transform: translateY(0);
  }
  60%,
  95% {
    transform: translateY(-2px);
  }
}

@keyframes float-up {
  0% {
    opacity: 0;
    transform: translateY(6px);
  }
  15% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-26px);
  }
}

@keyframes badge-pop {
  40% {
    transform: scale(1.12) rotate(-2deg);
  }
}

@keyframes ribbon {
  0% {
    opacity: 0;
    transform: translateY(-8px) scale(0.8);
  }
  15%,
  80% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .badge,
  .badge__fill {
    transition: none;
  }

  .badge__face :deep(canvas),
  .badge__float,
  .badge__ribbon,
  .is-popping {
    animation: none;
  }
}
</style>
