<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The chip in the top-left corner of the town that says what the sky is doing. The town always
// follows the live weather; this only shows it, and can't be pressed.
import { computed } from 'vue'

const props = defineProps({
  // from services/weather.js, or null while it loads
  weather: { type: Object, default: null },
})

const shown = computed(() => {
  const w = props.weather
  if (!w) return { icon: '⏳', text: 'Checking the sky' }
  if (w.unavailable) return { icon: '☁️', text: 'No weather' }
  const temperature = w.temperature === null ? '' : ` · ${w.temperature}°`
  if (w.scene === 'rain') return { icon: '🌧️', text: `Rain${temperature}` }
  if (!w.isDay) return { icon: '🌙', text: `Night${temperature}` }
  if (w.scene === 'sunny') return { icon: '☀️', text: `Sunny${temperature}` }
  return { icon: '☁️', text: `Cloudy${temperature}` }
})
</script>

<template>
  <p class="px-sign-box px-sign-font weather-chip" role="status" :aria-label="`Live weather: ${shown.text}`">
    <span class="weather-chip__icon" aria-hidden="true">{{ shown.icon }}</span>
    <span class="weather-chip__words" aria-hidden="true">
      <span class="weather-chip__kind">Live weather</span>
      <span class="weather-chip__text">{{ shown.text }}</span>
    </span>
  </p>
</template>

<style scoped>
.weather-chip {
  position: absolute;
  top: 14px;
  left: 17px;
  z-index: 11;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 5px 8px;
  color: var(--rl-text);
  letter-spacing: 0;
  pointer-events: none;
}

.weather-chip__icon {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  background: var(--rl-secondary);
  font-size: 16px;
}

.weather-chip__words {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.weather-chip__kind {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--rl-muted);
}

.weather-chip__text {
  font-size: 12px;
  font-weight: 700;
}
</style>
