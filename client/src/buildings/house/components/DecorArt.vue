<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A decoration's picture in the Shop, the inventory and while it's dragged: its own room sprite,
// scaled up a whole number of times so it stays crisp, as large as fits `fit` CSS px (a cat, one
// frame of its sheet).
import { computed } from 'vue'
import { furnitureSprite } from '@/buildings/house/furniture.js'
import SPRITES from '@/buildings/house/strip/sprites.json'

const props = defineProps({
  kind: { type: String, required: true },
  // the most room the picture can take, either way, in CSS px
  fit: { type: Number, default: 60 },
})

// a cat's sprite is a sheet of frames: it shows sitting
const SHOWN_FRAME = 'sit'

const sprite = computed(() => furnitureSprite(props.kind))
const art = computed(() => {
  const meta = SPRITES[sprite.value] ?? { w: 1, h: 1 }
  const frame = meta.cell ? meta.frames.indexOf(SHOWN_FRAME) : 0
  const { w, h } = meta.cell ?? meta
  const times = Math.max(1, Math.floor(props.fit / Math.max(w, h)))
  return {
    box: { width: `${w * times}px`, height: `${h * times}px` },
    image: { width: `${meta.w * times}px`, height: `${meta.h * times}px`, marginLeft: `${-frame * w * times}px` },
  }
})
</script>

<template>
  <span v-if="sprite" class="decor-art" :style="art.box">
    <img class="decor-art__sheet" :src="`/room/strip/${sprite}.png`" :style="art.image" alt="" />
  </span>
</template>

<style scoped>
.decor-art {
  display: block;
  overflow: hidden;
}

.decor-art__sheet {
  display: block;
  max-width: none;
  image-rendering: pixelated;
}
</style>
