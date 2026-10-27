<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The chip in the corner of the town that says what the sky is doing. The town follows the
// live weather; pressing the chip steps through a preview of each look (handy for a demo).
import { computed } from 'vue'

const props = defineProps({
  // live | day | night | rain | rainyNight
  mode: { type: String, required: true },
  // from services/weather.js, or null while it loads
  weather: { type: Object, default: null },
})
const emit = defineEmits(['change'])

const MODES = ['live', 'day', 'night', 'rain', 'rainyNight']
const PREVIEWS = {
  day: { icon: '☀️', text: 'Day' },
  night: { icon: '🌙', text: 'Night' },
  rain: { icon: '🌧️', text: 'Rain' },
  rainyNight: { icon: '⛈️', text: 'Rainy night' },
}

const live = computed(() => {
  const w = props.weather
  if (!w) return { icon: '⏳', text: 'Checking the sky' }
  if (w.unavailable) return { icon: '☁️', text: 'No weather' }
  const temperature = w.temperature === null ? '' : ` · ${w.temperature}°`
  if (w.scene === 'rain') return { icon: '🌧️', text: `Rain${temperature}` }
  if (!w.isDay) return { icon: '🌙', text: `Night${temperature}` }
  if (w.scene === 'sunny') return { icon: '☀️', text: `Sunny${temperature}` }
  return { icon: '☁️', text: `Cloudy${temperature}` }
})

const shown = computed(() => (props.mode === 'live' ? live.value : PREVIEWS[props.mode] ?? live.value))

function next() {
  emit('change', MODES[(MODES.indexOf(props.mode) + 1) % MODES.length])
}
</script>

<template>
  <button
    type="button"
    class="weather-button"
    :aria-label="`Weather: ${shown.text}${mode === 'live' ? ', live' : ', preview'}. Change the sky`"
    @click="next"
  >
    <span class="weather-button__icon" aria-hidden="true">{{ shown.icon }}</span>
    <span class="weather-button__words">
      <span class="weather-button__kind">{{ mode === 'live' ? 'Live weather' : 'Preview' }}</span>
      <span class="weather-button__text">{{ shown.text }}</span>
    </span>
  </button>
</template>

<style scoped>
.weather-button {
  position: absolute;
  left: 14px;
  bottom: 24px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 4px 14px 4px 6px;
  border: 1px solid var(--rl-line);
  border-radius: 999px;
  background: var(--rl-surface);
  box-shadow: 0 4px 14px rgba(63, 46, 36, 0.15);
  color: var(--rl-text);
  text-align: left;
  transition: transform 0.12s ease;
}

.weather-button:active {
  transform: scale(0.96);
}

.weather-button__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--rl-secondary);
  font-size: 18px;
}

.weather-button__words {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.weather-button__kind {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: var(--rl-muted);
}

.weather-button__text {
  font-size: 14px;
  font-weight: 700;
}

@media (prefers-reduced-motion: reduce) {
  .weather-button {
    transition: none;
  }
}
</style>
