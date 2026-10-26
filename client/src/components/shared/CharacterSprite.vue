<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A reader's town character, drawn live from their saved parts and scaled up with hard pixel
// edges. Screen readers hear the character described in words.
import { computed, ref, watchEffect } from 'vue'
import { drawAvatar, makeRnd } from '@/lib/avatar/draw.js'
import { characterSeed, describeCharacter, normaliseCharacter, toDrawParams } from '@/lib/avatar/catalogue.js'

const props = defineProps({
  // the saved character (ids, see lib/avatar/catalogue.js)
  character: { type: Object, required: true },
  // whole numbers only, so every pixel stays square
  scale: { type: Number, default: 4 },
  // what screen readers hear; empty describes the character instead
  label: { type: String, default: '' },
})

// the sprite is 28 x 56 plus a 1px outline all round
const WIDTH = 30
const HEIGHT = 58

const canvas = ref(null)
// locked parts are drawn too, so the salon can preview them
const valid = computed(() => normaliseCharacter(props.character, { allowLocked: true }))
const spoken = computed(() => props.label || describeCharacter(valid.value))
const size = computed(() => {
  const k = Math.max(1, Math.round(props.scale))
  return { width: `${WIDTH * k}px`, height: `${HEIGHT * k}px` }
})

watchEffect(() => {
  const target = canvas.value
  if (!target) return
  const drawn = drawAvatar(toDrawParams(valid.value), makeRnd(characterSeed(valid.value)))
  const context = target.getContext('2d')
  context.clearRect(0, 0, WIDTH, HEIGHT)
  context.drawImage(drawn, 0, 0)
})
</script>

<template>
  <canvas
    ref="canvas"
    class="character-sprite"
    :width="WIDTH"
    :height="HEIGHT"
    :style="size"
    role="img"
    :aria-label="spoken"
  />
</template>

<style scoped>
.character-sprite {
  display: block;
  image-rendering: pixelated;
}
</style>
