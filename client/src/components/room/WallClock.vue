<!--
  Analog clock hanging on the room wall. It shows Singapore time from the time API
  (services/time.js): the server's clock sets an offset, so the hands are right even when
  this device's clock is not. Until the API answers, it runs on the device clock.
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { fetchSingaporeTime } from '@/services/time.js'
import { prefersReducedMotion } from '@/lib/motion'

const TICKS = Array.from({ length: 12 }, (_, index) => index * 30)
const NUMERALS = [
  { text: '12', x: 50, y: 30.5 },
  { text: '3', x: 81.5, y: 63.5 },
  { text: '6', x: 50, y: 95.5 },
  { text: '9', x: 18.5, y: 63.5 },
]

const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Singapore',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

const hours = ref(0)
const minutes = ref(0)
const seconds = ref(0)
const sweep = ref(true)

let offset = 0
let timer = 0

function render() {
  const parts = formatter.formatToParts(new Date(Date.now() + offset))
  const pick = (type) => Number(parts.find((part) => part.type === type)?.value) || 0
  hours.value = pick('hour')
  minutes.value = pick('minute')
  seconds.value = pick('second')
}

const hourAngle = computed(() => (hours.value % 12) * 30 + minutes.value * 0.5)
const minuteAngle = computed(() => minutes.value * 6 + seconds.value * 0.1)
const secondAngle = computed(() => seconds.value * 6)

// Read out as hours and minutes only, so a screen reader is not updated every second.
const label = computed(
  () => `${String(hours.value).padStart(2, '0')}:${String(minutes.value).padStart(2, '0')}`,
)

onMounted(async () => {
  sweep.value = !prefersReducedMotion()
  render()
  timer = window.setInterval(render, 1000)

  const time = await fetchSingaporeTime()
  if (Number.isFinite(time.unix)) offset = time.unix * 1000 - Date.now()
  render()
})

onBeforeUnmount(() => {
  window.clearInterval(timer)
})
</script>

<template>
  <div class="clock" role="img" :aria-label="`Singapore time ${label}`">
    <svg viewBox="0 0 100 112" aria-hidden="true">
      <!-- nail and hanger -->
      <path d="M50 4 L43 17 M50 4 L57 17" class="clock__cord" />
      <circle cx="50" cy="4" r="2.4" class="clock__nail" />

      <!-- wooden rim and paper face -->
      <circle cx="50" cy="62" r="48" class="clock__rim" />
      <circle cx="50" cy="62" r="42.5" class="clock__rim-inner" />
      <circle cx="50" cy="62" r="40" class="clock__face" />

      <line
        v-for="angle in TICKS"
        :key="angle"
        x1="50"
        y1="24.5"
        x2="50"
        :y2="angle % 90 === 0 ? 26 : 29"
        class="clock__tick"
        :transform="`rotate(${angle} 50 62)`"
      />
      <text v-for="numeral in NUMERALS" :key="numeral.text" :x="numeral.x" :y="numeral.y" class="clock__numeral">
        {{ numeral.text }}
      </text>

      <line x1="50" y1="66" x2="50" y2="41" class="clock__hand clock__hand--hour" :transform="`rotate(${hourAngle} 50 62)`" />
      <line x1="50" y1="68" x2="50" y2="29" class="clock__hand clock__hand--minute" :transform="`rotate(${minuteAngle} 50 62)`" />
      <line
        v-if="sweep"
        x1="50"
        y1="72"
        x2="50"
        y2="26"
        class="clock__hand clock__hand--second"
        :transform="`rotate(${secondAngle} 50 62)`"
      />
      <circle cx="50" cy="62" r="2.6" class="clock__cap" />
    </svg>
  </div>
</template>

<style scoped>
.clock svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
  filter: drop-shadow(0 3px 3px rgba(63, 46, 36, 0.28));
}

.clock__cord {
  fill: none;
  stroke: var(--rl-muted);
  stroke-width: 0.8;
}

.clock__nail { fill: var(--rl-primary); }
.clock__rim { fill: var(--rl-wood); }
.clock__rim-inner { fill: #5c3f2c; }
.clock__face { fill: var(--rl-surface); }

.clock__tick {
  stroke: var(--rl-primary);
  stroke-width: 1.2;
  stroke-linecap: round;
}

.clock__numeral {
  fill: var(--rl-primary);
  font-family: var(--rl-font-title);
  font-size: 10px;
  font-weight: 700;
  text-anchor: middle;
}

.clock__hand {
  stroke: var(--rl-primary);
  stroke-linecap: round;
}

.clock__hand--hour { stroke-width: 3.4; }
.clock__hand--minute { stroke-width: 2.2; }

.clock__hand--second {
  stroke: #b7705a;
  stroke-width: 1;
}

.clock__cap { fill: #b7705a; }
</style>
