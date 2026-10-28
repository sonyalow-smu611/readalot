<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The whole salon behind everything, in the town map's pixel style (salonArt.js). It covers the
// page, scaled by whole numbers so the pixels stay square, standing on the bottom edge. On a
// phone only the top half shows above the dock's sheet, so it fills that and hangs from the top.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ROOM_H, ROOM_W } from '@/buildings/salon/salonArt.js'

defineProps({
  // the room picture from drawSalon()
  src: { type: String, required: true },
})

const root = ref(null)
const scale = ref(4)
const phone = ref(false)
// the salon's own breakpoint (SalonView), and how much of the page the room shows above the sheet
const PHONE_MAX = 900
const PHONE_SHOWN = 0.6
let resize = null

const size = computed(() => ({ width: `${ROOM_W * scale.value}px`, height: `${ROOM_H * scale.value}px` }))

function fit() {
  if (!root.value) return
  const { clientWidth: w, clientHeight: h } = root.value
  phone.value = w < PHONE_MAX
  const shown = phone.value ? h * PHONE_SHOWN : h
  scale.value = Math.max(2, Math.ceil(Math.max(w / ROOM_W, shown / ROOM_H)))
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
    <img class="backdrop__room" :class="{ 'is-hanging': phone }" :src="src" :style="size" alt="" />
  </div>
</template>

<style scoped>
.backdrop {
  overflow: hidden;
}

.backdrop__room.is-hanging {
  top: 0;
  bottom: auto;
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
