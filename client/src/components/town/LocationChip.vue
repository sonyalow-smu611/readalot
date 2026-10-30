<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The public/private switch on the map, under the Daily button. It's the same setting as the
// salon's privacy switch.
defineProps({
  on: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  // under-18s are always private
  locked: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle'])
</script>

<template>
  <button
    type="button"
    role="switch"
    class="btn btn-chip location-chip"
    :class="{ 'is-on': on }"
    aria-label="Public profile and location"
    :aria-checked="on"
    :disabled="busy || locked"
    :title="locked ? 'Readers under 18 stay private' : ''"
    @click="emit('toggle')"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
    {{ on ? 'Public' : 'Private' }}
  </button>
</template>

<style scoped>
.location-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.location-chip svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.location-chip.is-on svg {
  stroke: #2f9a4c;
}
</style>
