<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The Daily button on the left of the town, under the weather chip, chunky like the badge: a
// flame with the streak, and a ring that fills as the day's tasks are done (a tick once the
// reward is claimed). When the reward is ready it glows gold and a dot bounces on it.
import { computed } from 'vue'

const props = defineProps({
  streak: { type: Number, default: 0 },
  done: { type: Number, default: 0 },
  total: { type: Number, default: 3 },
  ready: { type: Boolean, default: false },
  claimed: { type: Boolean, default: false },
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle'])

const RADIUS = 9
const RING = 2 * Math.PI * RADIUS

const filled = computed(() => RING * (1 - (props.total ? props.done / props.total : 0)))
const label = computed(() => {
  const state = props.claimed ? 'reward claimed' : props.ready ? 'reward ready to claim' : `${props.done} of ${props.total} finished`
  return `Daily tasks, ${state}, ${props.streak}-day streak`
})
</script>

<template>
  <button
    type="button"
    class="btn btn-secondary daily-button"
    :class="{ 'is-ready': ready, 'is-lit': streak > 0 }"
    :aria-label="label"
    :aria-expanded="open"
    aria-controls="town-daily"
    @click="emit('toggle')"
  >
    <span class="daily-button__fire" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M12 2.5c.6 3.2-1.4 4.7-2.9 6.6-1.3 1.6-2.4 3.2-2.4 5.6a5.3 5.3 0 0 0 10.6 0c0-2.1-.9-3.7-1.9-5-.3 1.4-1 2.4-2 2.8.5-3.6-.3-7.4-1.4-10z" />
      </svg>
      {{ streak }}
    </span>
    <span class="daily-button__word" aria-hidden="true">Daily</span>
    <svg class="daily-button__ring" viewBox="0 0 24 24" aria-hidden="true">
      <circle class="daily-button__track" cx="12" cy="12" :r="RADIUS" />
      <circle class="daily-button__fill" cx="12" cy="12" :r="RADIUS" :stroke-dasharray="RING" :stroke-dashoffset="filled" />
      <path v-if="claimed" class="daily-button__tick" d="m8 12.2 2.6 2.6L16 9.4" />
    </svg>
    <span v-if="ready" class="daily-button__dot" aria-hidden="true"></span>
  </button>
</template>

<style scoped>
.daily-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  --bs-btn-padding-x: 8px;
  pointer-events: auto;
}

.daily-button__fire {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 30px;
  padding: 0 9px 0 5px;
  border-radius: 999px;
  background: var(--rl-secondary);
}

.daily-button__fire svg {
  width: 20px;
  height: 20px;
  fill: var(--rl-line);
}

.is-lit .daily-button__fire {
  background: #ffe6c7;
}

.is-lit .daily-button__fire svg {
  fill: #f08a24;
}

.daily-button__ring {
  width: 26px;
  height: 26px;
  transform: rotate(-90deg);
}

.daily-button__track,
.daily-button__fill {
  fill: none;
  stroke-width: 3;
}

.daily-button__track {
  stroke: var(--rl-secondary);
}

.daily-button__fill {
  stroke: #3fae5a;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.daily-button__tick {
  fill: none;
  stroke: #3fae5a;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform: rotate(90deg);
  transform-origin: center;
}

.is-ready {
  background: #ffe9a8;
  box-shadow: 0 3px 0 #2b1d24, 0 0 0 4px rgba(246, 201, 74, 0.5);
}

.daily-button__dot {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 15px;
  height: 15px;
  border: 2px solid #2b1d24;
  border-radius: 50%;
  background: #e5484d;
  animation: daily-dot 1.2s ease-in-out infinite;
}

@keyframes daily-dot {
  50% {
    transform: translateY(-3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .daily-button__dot {
    animation: none;
  }
}
</style>
