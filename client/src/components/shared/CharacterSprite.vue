<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A reader's town character, drawn live from their saved parts and scaled up with hard pixel
// edges. Screen readers hear the character described in words. crop shows one part (the
// customiser's buttons); blink draws the eyes shut (PixelCharacter blinks with it).
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
  // hidden from screen readers (the name next to it says who it is)
  decorative: { type: Boolean, default: false },
  // full | head | top | bottom | feet
  crop: { type: String, default: 'full' },
  blink: { type: Boolean, default: false },
})

// the sprite is 28 x 56 plus a 1px outline all round
const WIDTH = 30
const HEIGHT = 58
// rows of the outlined sprite each crop shows
const CROPS = {
  full: [0, HEIGHT],
  head: [0, 25],
  top: [21, 22],
  bottom: [35, 20],
  feet: [44, 14],
}
// the eyes, in the outlined sprite: where each one is and the row a shut eye is drawn on
const EYES = [10, 17]
const EYE_TOP = 12
const EYE_SHUT = 13

const canvas = ref(null)
// locked parts are drawn too, so the salon can preview them
const valid = computed(() => normaliseCharacter(props.character, { allowLocked: true }))
const spoken = computed(() => props.label || describeCharacter(valid.value))
const rows = computed(() => CROPS[props.crop] ?? CROPS.full)
const size = computed(() => {
  const k = Math.max(1, Math.round(props.scale))
  return { width: `${WIDTH * k}px`, height: `${rows.value[1] * k}px` }
})

watchEffect(() => {
  const target = canvas.value
  if (!target) return
  const params = toDrawParams(valid.value)
  const drawn = drawAvatar(params, makeRnd(characterSeed(valid.value)))
  const context = target.getContext('2d')
  const [top, height] = rows.value
  context.clearRect(0, 0, WIDTH, height)
  context.drawImage(drawn, 0, top, WIDTH, height, 0, 0, WIDTH, height)
  // shades and goggles hide the eyes, so there is nothing to shut
  if (!props.blink || params.shades || params.goggles || top > EYE_TOP) return
  for (const x of EYES) {
    context.fillStyle = params.skin
    context.fillRect(x, EYE_TOP - top, 3, 3)
    context.fillStyle = '#2b2230'
    context.fillRect(x, EYE_SHUT - top, 3, 1)
  }
})
</script>

<template>
  <canvas
    ref="canvas"
    class="character-sprite"
    :width="WIDTH"
    :height="rows[1]"
    :style="size"
    :role="decorative ? undefined : 'img'"
    :aria-label="decorative ? undefined : spoken"
    :aria-hidden="decorative ? 'true' : undefined"
  />
</template>

<style scoped>
.character-sprite {
  display: block;
  image-rendering: pixelated;
}
</style>
