<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The whole salon behind everything, in the town map's pixel style (salonArt.js). It covers the
// page, scaled by whole numbers so the pixels stay square, standing on the bottom edge.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ROOM_H, ROOM_W } from '@/buildings/salon/salonArt.js'

defineProps({
  // the room picture from drawSalon()
  src: { type: String, required: true },
})

const root = ref(null)
const scale = ref(4)
let resize = null

const size = computed(() => ({ width: `${ROOM_W * scale.value}px`, height: `${ROOM_H * scale.value}px` }))

function fit() {
  if (!root.value) return
  const { clientWidth: w, clientHeight: h } = root.value
  scale.value = Math.max(2, Math.ceil(Math.max(w / ROOM_W, h / ROOM_H)))
}

onMounted(() => {
  fit()
  resize = new ResizeObserver(fit)
  resize.observe(root.value)
})

onBeforeUnmount(() => resize?.disconnect())
</script>

<template>
  <div ref="root" class="backdrop" aria-hidden="true">
    <img class="backdrop__room" :src="src" :style="size" alt="" />
  </div>
</template>

<style scoped>
.backdrop {
  overflow: hidden;
}

.backdrop__room {
  position: absolute;
  bottom: 0;
  left: 50%;
  max-width: none;
  image-rendering: pixelated;
  transform: translateX(-50%);
}
</style>
