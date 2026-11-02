<!--
  Scaffolded with AI assistance — see AI_USAGE.md
  How far into a Reading book the reader is: a slider from 0 to 100% that follows the drag and
  emits `change` with the percent when it's let go. Shown in the Book details card (room and book
  page) and in the card My Shelf opens.
-->
<template>
  <label class="progress-panel">
    <span class="progress-panel__label">
      <span>Progress</span>
      <output>{{ percent }}% read</output>
    </span>
    <input
      v-model.number="percent"
      class="form-range progress-panel__slider"
      type="range"
      min="0"
      max="100"
      step="1"
      :style="{ '--fill': `${percent}%` }"
      :aria-valuetext="`${percent} percent read`"
      @change="$emit('change', percent)"
    />
  </label>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  // the saved percent; the slider moves back to it if it changes from elsewhere
  progress: { type: Number, default: 0 },
})
defineEmits(['change'])

const percent = ref(0)
watch(
  () => props.progress,
  (progress) => {
    percent.value = progress || 0
  },
  { immediate: true },
)
</script>

<style scoped>
.progress-panel {
  --accent: var(--book-accent, var(--rl-primary));
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-panel__label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 700;
}

.progress-panel__label output {
  color: var(--rl-muted);
}

.progress-panel__slider {
  height: 20px;
}

.progress-panel__slider::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent) var(--fill), var(--rl-placeholder) var(--fill));
}

.progress-panel__slider::-moz-range-track {
  height: 6px;
  border-radius: 999px;
  background: var(--rl-placeholder);
}

.progress-panel__slider::-moz-range-progress {
  height: 6px;
  border-radius: 999px;
  background: var(--accent);
}

.progress-panel__slider::-webkit-slider-thumb {
  margin-top: -6px;
  background: var(--accent);
}

.progress-panel__slider::-moz-range-thumb {
  background: var(--accent);
}

.progress-panel__slider:focus::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px rgba(63, 46, 36, 0.2);
}
</style>
