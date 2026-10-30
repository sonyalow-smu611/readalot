<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The salon stop's scene: inside the Hair Salon, built from the same layers as the app's salon
// (salonArt.js): the room behind, the mirror with the reader's reflection, the counter and chair,
// and the reader beside it. Every couple of seconds one part changes (hair, hair colour, top,
// bottoms, shoes, an extra), the reader hops, and the tab for it lights up, showing what a reader
// can do in the salon. Only free parts are tried on.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { prefersReducedMotion } from '@/lib/motion'
import { CHARACTER_BOX, MIRROR_GLASS, ROOM_H, ROOM_W, STATION_H, STATION_W, drawSalon } from '@/buildings/salon/salonArt.js'
import { CATALOGUE, applyChoice, blockedReason, isUnlocked, presetCharacter } from '@/lib/avatar/catalogue.js'
import PixelCharacter from '@/components/shared/PixelCharacter.vue'

// the scene is 460 x 300; the salon is drawn at 2x, so its corner fills the scene's height
const K = 2
// where the reflection stands in the mirror's glass, as in the salon (SalonStage)
const REFLECTION = { x: 17, y: 32 }

// what changes, in turn, and the salon tab it belongs to
const STEPS = [
  { tab: 'Hair', slot: 'hair' },
  { tab: 'Hair', slot: 'hairColour' },
  { tab: 'Outfit', slot: 'top' },
  { tab: 'Outfit', slot: 'topColour' },
  { tab: 'Outfit', slot: 'bottom' },
  { tab: 'Shoes', slot: 'shoes' },
  { tab: 'Extras', slot: 'eyes' },
  { tab: 'Extras', slot: 'neck' },
]
const TABS = ['Hair', 'Outfit', 'Shoes', 'Extras']

const px = (n) => `${n * K}px`
const box = (b) => ({ left: px(b.x), top: px(b.y), width: px(b.width), height: px(b.height) })

const art = ref(null)
const character = ref(presetCharacter('maya'))
const tab = ref('Hair')
const changed = ref('')
const hop = ref(0)
let step = 0
let timer = 0

function nextLook() {
  const { tab: nextTab, slot } = STEPS[step % STEPS.length]
  step += 1
  const free = CATALOGUE[slot].filter(
    (item) => isUnlocked(item) && item.id !== character.value[slot] && !blockedReason(character.value, slot, item.id),
  )
  if (!free.length) return
  const item = free[Math.floor(Math.random() * free.length)]
  character.value = applyChoice(character.value, slot, item.id)
  tab.value = nextTab
  changed.value = item.label
  hop.value += 1
}

onMounted(() => {
  art.value = drawSalon()
  if (!prefersReducedMotion()) timer = window.setInterval(nextLook, 1600)
})

onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <div class="salon">
    <template v-if="art">
      <img class="salon__room" :src="art.backdrop" :style="{ width: px(ROOM_W), height: px(ROOM_H) }" alt="" />
      <div class="salon__station" :style="{ width: px(STATION_W), height: px(STATION_H) }">
        <img class="salon__layer" :src="art.mirror" alt="" />
        <div class="salon__glass" :style="{ ...box(MIRROR_GLASS), '--arch': px(MIRROR_GLASS.width / 2) }">
          <div class="salon__reflection" :style="{ left: px(REFLECTION.x), top: px(REFLECTION.y) }">
            <PixelCharacter :character="character" :scale="K" :hop="hop" mirror decorative />
          </div>
        </div>
        <img class="salon__layer" :src="art.front" alt="" />
        <div class="salon__model" :style="box(CHARACTER_BOX)">
          <PixelCharacter :character="character" :scale="K * 2" :hop="hop" decorative />
        </div>
      </div>
    </template>

    <!-- the salon's tabs, the one being changed lit up, and what was just tried on -->
    <div class="salon__panel">
      <span v-for="name in TABS" :key="name" class="salon__tab" :class="{ 'is-on': tab === name }">{{ name }}</span>
      <p class="salon__changed">{{ changed ? `New ${tab.toLowerCase()}: ${changed}` : 'Try on a new look' }}</p>
    </div>
  </div>
</template>

<style scoped>
.salon {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #f7eef2;
}

.salon img {
  image-rendering: pixelated;
}

/* the room stands on the scene's bottom edge, centred */
.salon__room {
  position: absolute;
  left: 50%;
  bottom: 0;
  translate: -50% 0;
}

/* the mirror corner, along the left, as tall as the scene */
.salon__station {
  position: absolute;
  left: -8px;
  bottom: 0;
}

.salon__layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* the mirror's arched glass, which crops the reflection */
.salon__glass {
  position: absolute;
  overflow: hidden;
  border-radius: var(--arch) var(--arch) 0 0;
}

.salon__reflection,
.salon__model {
  position: absolute;
}

.salon__model {
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/* a little card on the wall, like the salon's style studio */
.salon__panel {
  position: absolute;
  top: 16px;
  right: 12px;
  width: 124px;
  padding: 8px;
  background: #fffdf9;
  border: 3px solid #1e1a24;
  box-shadow: 4px 4px 0 rgba(30, 26, 36, 0.3);
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.salon__tab {
  padding: 2px 6px;
  background: #f2e4ec;
  color: #a8648a;
  font-size: 11px;
  font-weight: 700;
}

.salon__tab.is-on {
  background: #c77fa6;
  color: #fffdf9;
}

.salon__changed {
  width: 100%;
  margin: 6px 0 0;
  color: #1e1a24;
  font-size: 12px;
  font-weight: 700;
}
</style>
