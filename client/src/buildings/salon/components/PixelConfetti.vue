<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Pixel confetti over its parent: bump `burst` to throw a handful of square bits that flutter
// down. Nothing with reduced motion.
import { onBeforeUnmount, ref, watch } from 'vue'
import { prefersReducedMotion } from '@/lib/motion'

const props = defineProps({
  burst: { type: Number, default: 0 },
})

const BITS = 32
const LIFE_MS = 1700
const COLOURS = ['#d0608e', '#f6e27a', '#8fb8d9', '#9fd39a', '#c9a0e8', '#f3a46b', '#ffffff']

const bits = ref([])
let timer = 0

watch(
  () => props.burst,
  (n) => {
    if (!n || prefersReducedMotion()) return
    window.clearTimeout(timer)
    bits.value = Array.from({ length: BITS }, (_, i) => ({
      id: `${n}-${i}`,
      style: {
        left: `${Math.random() * 100}%`,
        background: COLOURS[i % COLOURS.length],
        '--drift': `${(Math.random() - 0.5) * 120}px`,
        '--spin': `${(Math.random() - 0.5) * 720}deg`,
        '--size': `${6 + (i % 3) * 3}px`,
        animationDelay: `${Math.random() * 240}ms`,
      },
    }))
    timer = window.setTimeout(() => (bits.value = []), LIFE_MS)
  },
)

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <div v-if="bits.length" class="confetti" aria-hidden="true">
    <span v-for="bit in bits" :key="bit.id" class="confetti__bit" :style="bit.style" />
  </div>
</template>

<style scoped>
.confetti {
  position: absolute;
  inset: 0;
  z-index: 30;
  overflow: hidden;
  pointer-events: none;
}

.confetti__bit {
  position: absolute;
  top: -12px;
  width: var(--size);
  height: var(--size);
  box-shadow: 0 0 0 2px #2b1d24;
  animation: confetti-fall 1.4s cubic-bezier(0.25, 0.6, 0.4, 1) forwards;
}

@keyframes confetti-fall {
  0% {
    transform: translate(0, 0) rotate(0);
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--drift), 70vh) rotate(var(--spin));
    opacity: 0;
  }
}
</style>
