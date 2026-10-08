<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { fetchSingaporeTime } from '@/services/time.js'
import { prefersReducedMotion } from '@/lib/motion'

const hours = ref('--')
const minutes = ref('--')
const seconds = ref('--')
const zone = ref('SGT')
const live = ref(false)

let offset = 0
let timer = 0

function render() {
  const now = new Date(Date.now() + offset)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Singapore',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const pick = (type) => parts.find((part) => part.type === type)?.value || '--'
  hours.value = pick('hour')
  minutes.value = pick('minute')
  seconds.value = pick('second')
}

onMounted(async () => {
  const time = await fetchSingaporeTime()
  zone.value = time.abbreviation || 'SGT'
  if (Number.isFinite(time.unix)) offset = time.unix * 1000 - Date.now()
  live.value = !time.unavailable && !prefersReducedMotion()
  render()
  timer = window.setInterval(render, 1000)
})

onBeforeUnmount(() => {
  window.clearInterval(timer)
})
</script>

<template>
  <time class="clock" datetime="" :aria-label="`Singapore time ${hours}:${minutes}:${seconds}`">
    <span class="clock__zone">{{ zone }}</span>
    <span class="clock__digits">
      <span>{{ hours }}</span>
      <span class="clock__colon" :class="{ 'is-live': live }">:</span>
      <span>{{ minutes }}</span>
      <span class="clock__colon clock__colon--sec" :class="{ 'is-live': live }">:</span>
      <span :key="seconds" class="clock__sec" :class="{ 'is-live': live }">{{ seconds }}</span>
    </span>
  </time>
</template>

<style scoped>
.clock {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 6px 10px 6px 8px;
  border-radius: 12px;
  background: rgba(247, 244, 238, 0.92);
  box-shadow: 0 8px 18px rgba(28, 27, 25, 0.12);
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  font-family: var(--font-body);
  line-height: 1;
}

.clock__zone {
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
}

.clock__digits {
  display: flex;
  align-items: baseline;
  font-size: 0.95rem;
  font-weight: 650;
}

.clock__colon {
  margin-inline: 1px;
  color: #a33b32;
}

.clock__colon.is-live {
  animation: blink 1s steps(1) infinite;
}

.clock__sec.is-live {
  display: inline-block;
  animation: tick 0.35s ease;
}

@keyframes blink {
  50% { opacity: 0.25; }
}

@keyframes tick {
  from { transform: translateY(-3px); opacity: 0.45; }
}

@media (prefers-reduced-motion: reduce) {
  .clock__colon.is-live,
  .clock__sec.is-live {
    animation: none;
  }
}
</style>
