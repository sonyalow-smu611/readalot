<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The way into the salon: the screen starts covered in the town's pixel clouds, which part to
// the sides to show the room. Skipped for readers who prefer less motion.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { prefersReducedMotion } from '@/lib/motion'
import { drawPixelCloud } from '@/lib/pixelCloud.js'

const emit = defineEmits(['done'])

const PART_MS = 1500

// [left %, top %, width as % of the screen, which way it leaves, delay ms]
const CLOUDS = [
  [-10, -6, 62, -1, 0], [42, -10, 70, 1, 60], [-18, 18, 70, -1, 120], [36, 22, 74, 1, 40],
  [-6, 44, 64, -1, 80], [44, 48, 66, 1, 140], [-16, 70, 72, -1, 30], [38, 74, 72, 1, 100],
  [14, 30, 56, -1, 160], [22, 58, 58, 1, 180],
]

const cloud = drawPixelCloud(2)
const parting = ref(false)
let timer = 0

onMounted(() => {
  if (prefersReducedMotion()) {
    emit('done')
    return
  }
  // one frame covered, then the clouds slide away
  requestAnimationFrame(() => requestAnimationFrame(() => (parting.value = true)))
  timer = window.setTimeout(() => emit('done'), PART_MS)
})

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <div class="clouds" :class="{ 'is-parting': parting }" aria-hidden="true">
    <img
      v-for="(c, i) in CLOUDS"
      :key="i"
      class="clouds__one"
      :src="cloud.src"
      alt=""
      :style="{ left: `${c[0]}%`, top: `${c[1]}%`, width: `${c[2]}%`, '--way': c[3], '--delay': `${c[4]}ms` }"
    />
  </div>
</template>

<style scoped>
.clouds {
  position: absolute;
  inset: 0;
  z-index: 30;
  overflow: hidden;
  background: #bfe3f2;
  pointer-events: none;
  transition: background-color 0.7s ease 0.35s;
}

.clouds.is-parting {
  background-color: rgba(191, 227, 242, 0);
}

.clouds__one {
  position: absolute;
  image-rendering: pixelated;
  transition: transform 1.1s cubic-bezier(0.55, 0, 0.8, 0.4) var(--delay);
}

.clouds.is-parting .clouds__one {
  transform: translateX(calc(var(--way) * 120vw)) scale(1.15);
}
</style>
