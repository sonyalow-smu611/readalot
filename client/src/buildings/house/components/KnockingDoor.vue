<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The door you knock on while a reader's room loads: on its own, drawn like the doors in town
// (town/door.js), with the words under it. It knocks until `ready`, swings open onto a lamplit
// room, then says `opened`. Knocking, swinging and the lamp together last at least 1.5 seconds,
// so a room that loads at once still gets its knock. With reduced motion it stays shut and still,
// and says `opened` as soon as it's `ready`.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { prefersReducedMotion } from '@/lib/motion'

const props = defineProps({
  // the reader's first name, when it's known
  name: { type: String, default: '' },
  // true once the room behind the door has loaded
  ready: { type: Boolean, default: false },
})

const emit = defineEmits(['opened'])

const KNOCK_MS = 800
// the same as DOOR_OPENS in town/door.js
const SWING_MS = 560
const LAMP_MS = 140

const still = prefersReducedMotion()
const knocked = ref(still)
const open = ref(false)
const whose = computed(() => (props.name ? `${props.name}'s` : 'the'))
let timer = 0

watch(
  () => props.ready && knocked.value,
  (canOpen) => {
    if (!canOpen) return
    if (still) {
      emit('opened')
      return
    }
    open.value = true
    timer = window.setTimeout(() => emit('opened'), SWING_MS + LAMP_MS)
  },
)

onMounted(() => {
  if (!still) timer = window.setTimeout(() => (knocked.value = true), KNOCK_MS)
})

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <div class="knocking-door" :class="{ 'is-open': open, 'is-knocking': !open && !still }">
    <svg
      class="knocking-door__art"
      viewBox="0 0 36 64"
      shape-rendering="crispEdges"
      role="img"
      :aria-label="`The door is ${open ? 'open' : 'shut'}`"
    >
      <!-- the frame -->
      <rect x="3" y="0" width="30" height="59" fill="#2b2133" />
      <rect x="2" y="1" width="32" height="58" fill="#2b2133" />
      <rect x="3" y="1" width="30" height="58" fill="#f4ead8" />
      <rect x="3" y="1" width="30" height="1" fill="#fffaf0" />
      <rect x="32" y="2" width="1" height="57" fill="#cdbb9e" />
      <rect x="5" y="5" width="26" height="54" fill="#2b2133" />
      <!-- the room behind it: dark, with a lamp lit inside -->
      <rect x="6" y="6" width="24" height="53" fill="#2b1d16" />
      <g class="knocking-door__lamp">
        <rect x="13" y="20" width="10" height="8" fill="#4d3120" />
        <rect x="11" y="28" width="14" height="8" fill="#4d3120" />
        <rect x="9" y="36" width="18" height="8" fill="#4d3120" />
        <rect x="7" y="44" width="22" height="8" fill="#4d3120" />
        <rect x="15" y="20" width="6" height="8" fill="#7a4f28" />
        <rect x="14" y="28" width="8" height="8" fill="#7a4f28" />
        <rect x="13" y="36" width="10" height="8" fill="#7a4f28" />
        <rect x="12" y="44" width="12" height="8" fill="#7a4f28" />
        <rect x="6" y="52" width="24" height="7" fill="#5c3a20" />
        <rect x="10" y="53" width="16" height="4" fill="#d99a45" />
        <rect x="13" y="54" width="10" height="2" fill="#ffd27a" />
        <rect x="17" y="6" width="2" height="7" fill="#14100c" />
        <rect x="15" y="13" width="6" height="2" fill="#e3b04b" />
        <rect x="13" y="15" width="10" height="4" fill="#e3b04b" />
        <rect x="14" y="15" width="3" height="1" fill="#f6d78c" />
        <rect x="16" y="19" width="4" height="2" fill="#fff1c2" />
      </g>
      <!-- the door -->
      <g class="knocking-door__leaf">
        <rect x="6" y="6" width="24" height="53" fill="#7a3540" />
        <rect x="6" y="6" width="24" height="1" fill="#96495a" />
        <rect x="9" y="10" width="18" height="19" fill="#642c34" />
        <rect x="9" y="10" width="18" height="1" fill="#4a2028" />
        <rect x="9" y="33" width="18" height="22" fill="#642c34" />
        <rect x="9" y="33" width="18" height="1" fill="#4a2028" />
        <rect x="25" y="30" width="3" height="4" fill="#e3b04b" />
        <rect x="25" y="30" width="1" height="1" fill="#f6d78c" />
      </g>
      <!-- the step -->
      <rect x="1" y="58" width="34" height="1" fill="#2b2133" />
      <rect x="0" y="59" width="36" height="5" fill="#2b2133" />
      <rect x="1" y="59" width="34" height="4" fill="#b8b2a4" />
      <rect x="1" y="59" width="34" height="1" fill="#d6d1c4" />
      <rect class="knocking-door__lamp" x="6" y="59" width="24" height="2" fill="#ffd27a" />
      <!-- the marks each knock makes -->
      <g class="knocking-door__marks" fill="#ffd27a">
        <rect x="13" y="19" width="2" height="1" />
        <rect x="17" y="17" width="2" height="1" />
        <rect x="21" y="19" width="2" height="1" />
        <rect x="14" y="23" width="1" height="2" />
        <rect x="21" y="23" width="1" height="2" />
      </g>
    </svg>

    <p class="knocking-door__words px-sign-font" role="status">
      Knocking on {{ whose }} door<span class="knocking-door__dots" aria-hidden="true" />
    </p>
  </div>
</template>

<style scoped>
.knocking-door {
  --door-px: 4px;
  --door-beat: 1.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  height: 100%;
  padding: var(--building-back-space) 16px 16px;
}

.knocking-door__art {
  width: calc(36 * var(--door-px));
  height: calc(64 * var(--door-px));
}

.knocking-door__words {
  margin: 0;
  font-size: 16px;
  text-align: center;
  color: var(--rl-primary);
}

/* three square dots, shown one at a time; they hang off the end, so the words stay centred */
.knocking-door__dots {
  display: inline-block;
  width: 24px;
  height: 4px;
  margin: 0 -30px 0 6px;
  background: repeating-linear-gradient(90deg, currentColor 0 4px, transparent 4px 8px);
  animation: door-dots calc(var(--door-beat) * 1.5) steps(4, jump-none) infinite;
}

/* swings on its left, the way the doors in town do */
.knocking-door__leaf {
  transform-box: fill-box;
  transform-origin: left center;
  transition: transform 0.56s steps(6, end);
}

.knocking-door__lamp {
  opacity: 0;
  transition: opacity 0.56s steps(4, end);
}

.knocking-door__marks {
  opacity: 0;
}

.is-knocking .knocking-door__leaf {
  animation: door-knock var(--door-beat) steps(1, end) infinite;
}

.is-knocking .knocking-door__marks {
  animation: door-marks var(--door-beat) steps(1, end) infinite;
}

.is-open .knocking-door__leaf {
  transform: scaleX(0.14);
}

.is-open .knocking-door__lamp {
  opacity: 1;
}

@keyframes door-dots {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0);
  }
}

/* knock knock, then a pause */
@keyframes door-knock {
  0%,
  13%,
  30%,
  100% {
    transform: none;
  }
  5%,
  22% {
    transform: translateX(1px);
  }
}

@keyframes door-marks {
  0%,
  13%,
  30%,
  100% {
    opacity: 0;
  }
  5%,
  22% {
    opacity: 1;
  }
}

@media (min-width: 768px) {
  .knocking-door {
    --door-px: 5px;
  }
}
</style>
