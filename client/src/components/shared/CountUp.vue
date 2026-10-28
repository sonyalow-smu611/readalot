<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A number that counts up to its value when it first shows and whenever it changes.
import { onBeforeUnmount, ref, watch } from 'vue'
import { prefersReducedMotion } from '@/lib/motion'

const props = defineProps({
  value: { type: Number, required: true },
  duration: { type: Number, default: 700 },
})

const shown = ref(0)
let frame = 0

watch(
  () => props.value,
  (to) => {
    cancelAnimationFrame(frame)
    if (prefersReducedMotion()) {
      shown.value = to
      return
    }
    const from = shown.value
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / props.duration)
      // eases out, so it slows as it lands
      shown.value = Math.round(from + (to - from) * (1 - (1 - t) ** 3))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  },
  { immediate: true },
)

onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <span>{{ shown }}</span>
</template>
