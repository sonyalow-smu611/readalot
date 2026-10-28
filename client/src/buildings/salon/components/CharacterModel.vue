<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The reader's character in 3D on the salon podium. Drag it (or use the arrow keys or the turn
// buttons) to spin it all the way round and see the outfit from every side; it only turns when
// the reader turns it. It hops when the look changes. Without 3D in the browser, the flat
// drawing stands in.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import CharacterFigure from '@/components/shared/CharacterFigure.vue'
import { normaliseCharacter, toDrawParams } from '@/lib/avatar/catalogue.js'
import { buildCharacter, disposeCharacter } from '@/buildings/salon/characterModel.js'

const props = defineProps({
  // the look to show (ids)
  character: { type: Object, required: true },
  // what screen readers hear
  label: { type: String, required: true },
  // bump to make the character hop
  hop: { type: Number, default: 0 },
})

const NUDGE = 0.12

const host = ref(null)
const canvas = ref(null)
const flat = ref(false)

let renderer = null
let scene = null
let camera = null
let model = null
let frame = 0
let resize = null
let angle = 0.2
let spin = 0
let dragging = null
let hopStart = -Infinity

function canUse3d() {
  try {
    const probe = document.createElement('canvas')
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'))
  } catch {
    return false
  }
}

function rebuild() {
  if (!scene) return
  if (model) {
    scene.remove(model)
    disposeCharacter(model)
  }
  model = buildCharacter(toDrawParams(normaliseCharacter(props.character, { allowLocked: true })))
  model.rotation.y = angle
  scene.add(model)
}

function fit() {
  if (!renderer || !host.value) return
  const { clientWidth: w, clientHeight: h } = host.value
  if (!w || !h) return
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

function tick(now) {
  frame = requestAnimationFrame(tick)
  // after a drag or a turn button, it slows to a stop
  if (!dragging) {
    angle += spin
    spin *= 0.86
    if (Math.abs(spin) < 0.0005) spin = 0
  }
  model.rotation.y = angle
  // a little hop when the look changes
  const t = (now - hopStart) / 450
  model.position.y = t >= 0 && t < 1 ? Math.sin(t * Math.PI) * 0.22 : 0
  renderer.render(scene, camera)
}

function onDown(event) {
  dragging = { x: event.clientX }
  spin = 0
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

function onMove(event) {
  if (!dragging) return
  const dx = event.clientX - dragging.x
  dragging.x = event.clientX
  angle += dx * 0.012
  spin = dx * 0.006
}

function onUp() {
  dragging = null
}

function turn(direction) {
  spin += direction * NUDGE
}

function onKey(event) {
  const direction = { ArrowLeft: -1, ArrowRight: 1 }[event.key]
  if (!direction) return
  event.preventDefault()
  turn(direction)
}

watch(() => props.character, rebuild, { deep: true })
watch(() => props.hop, () => (hopStart = performance.now()))

onMounted(() => {
  if (!canUse3d()) {
    flat.value = true
    return
  }
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true, alpha: true })
  } catch {
    flat.value = true
    return
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  scene = new THREE.Scene()
  // framed so the feet sit on the bottom edge and the tallest hat still fits
  camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50)
  camera.position.set(0, 1.5, 6.9)
  camera.lookAt(0, 1.42, 0)
  // soft light from all round, a warm key light, and a pink rim light from behind
  scene.add(new THREE.HemisphereLight(0xfff6f0, 0xe2bfd0, 1.6))
  const key = new THREE.DirectionalLight(0xfff3e6, 1.5)
  key.position.set(2.5, 4, 5)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xffc4dc, 1.2)
  rim.position.set(-3, 2.5, -4)
  scene.add(rim)
  rebuild()
  fit()
  resize = new ResizeObserver(fit)
  resize.observe(host.value)
  frame = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  resize?.disconnect()
  disposeCharacter(model)
  renderer?.dispose()
})
</script>

<template>
  <div class="model">
    <div
      ref="host"
      class="model__view"
      role="img"
      :aria-label="label"
      tabindex="0"
      @keydown="onKey"
    >
      <CharacterFigure v-if="flat" :character="character" decorative />
      <canvas
        v-else
        ref="canvas"
        class="model__canvas"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
      />
    </div>
    <div v-if="!flat" class="model__controls">
      <button type="button" class="model__turn" aria-label="Turn left" @click="turn(-1)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
      </button>
      <span class="model__hint">Drag to spin</span>
      <button type="button" class="model__turn" aria-label="Turn right" @click="turn(1)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.model {
  position: relative;
  width: 100%;
  height: 100%;
}

.model__view {
  width: 100%;
  height: 100%;
  border-radius: 12px;
}

.model__view:focus-visible {
  outline: 3px solid #f6e27a;
  outline-offset: 4px;
}

.model__canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
}

.model__canvas:active {
  cursor: grabbing;
}

.model__controls {
  position: absolute;
  left: 50%;
  top: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border: 2px solid #1e1a24;
  border-radius: 999px;
  background: rgba(255, 253, 249, 0.92);
  box-shadow: 0 3px 0 #1e1a24;
  transform: translateX(-50%);
  white-space: nowrap;
}

.model__turn {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: #a84874;
  color: #fffdf9;
}

.model__turn:hover {
  background: #8c3a60;
}

.model__turn svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.model__hint {
  font-size: 0.8125rem;
  font-weight: 700;
}
</style>
