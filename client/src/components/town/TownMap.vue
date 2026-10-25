<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The Phaser canvas with the town on it, plus its zoom buttons and loading / error states.
// It says which building was tapped (select); the parent says which one to glide to (focus).
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Phaser from 'phaser'
import TownScene from '@/town/TownScene.js'

const props = defineProps({
  // { id, key }: glide to that building. A new key repeats the same building.
  focus: { type: Object, default: null },
  // the building whose card is open; null clears its outline
  selectedId: { type: String, default: null },
})
const emit = defineEmits(['select', 'ready'])

const host = ref(null)
const state = ref('loading') // loading | ready | error
let game = null
let scene = null

const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

function zoom(factor) {
  if (state.value === 'ready') scene.zoomBy(factor)
}

watch(
  () => props.focus,
  (request) => {
    if (request && state.value === 'ready') scene.focusPlace(request.id)
  },
)

watch(
  () => props.selectedId,
  (id) => {
    if (!id && state.value === 'ready') scene.outline(null)
  },
)

onMounted(() => {
  scene = new TownScene({
    reducedMotion,
    onSelect: (place) => emit('select', place),
    onReady: () => {
      state.value = 'ready'
      emit('ready')
    },
    onError: () => {
      state.value = 'error'
    },
  })
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host.value,
    banner: false,
    pixelArt: true,
    backgroundColor: '#6fb14b',
    scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
    scene,
  })
})

onBeforeUnmount(() => {
  game?.destroy(true)
  game = null
  scene = null
})
</script>

<template>
  <div class="town-map">
    <div ref="host" class="town-map__canvas" aria-hidden="true"></div>
    <p v-if="state === 'loading'" class="town-map__state">Loading the town…</p>
    <p v-else-if="state === 'error'" class="town-map__state" role="alert">
      The town map could not load. Check your connection and refresh, or use Places to go straight to a building.
    </p>
    <div v-if="state === 'ready'" class="town-map__zoom">
      <button type="button" class="town-map__round" aria-label="Zoom in" @click="zoom(1.25)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      </button>
      <button type="button" class="town-map__round" aria-label="Zoom out" @click="zoom(0.8)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.town-map,
.town-map__canvas {
  position: absolute;
  inset: 0;
}

.town-map__state {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 24px;
  text-align: center;
  font-family: var(--rl-font-title);
  color: var(--rl-text);
}

.town-map__zoom {
  position: absolute;
  right: 14px;
  bottom: 24px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.town-map__round {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--rl-line);
  border-radius: 50%;
  background: var(--rl-surface);
  box-shadow: 0 4px 14px rgba(63, 46, 36, 0.15);
  color: var(--rl-text);
}

.town-map__round svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
}
</style>
