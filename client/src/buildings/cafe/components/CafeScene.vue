<script setup>
// AI-assisted starter: match the town's 2D avatar renderer and salon's pixel artwork.
// Movement and reader approach are kept here, separate from profile and router logic.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { sampleReaders, getCompatibility } from '@/services/peopleDemo.js'
import { drawAvatar, makeRnd, mk } from '@/lib/avatar/draw.js'
import {
  characterSeed, normaliseCharacter, presetCharacter, toDrawParams,
} from '@/lib/avatar/catalogue.js'
import { CAFE_W, CAFE_H } from '@/buildings/cafe/cafeArt.js'

const props = defineProps({
  art: { type: Object, required: true },
  character: { type: Object, default: null },
  selectedId: { type: String, default: '' },
})
const emit = defineEmits(['select'])

const root = ref(null)
const world = ref(null)
const scale = ref(1)
const position = ref({ x: 180, y: 445 })
const approaching = ref('')
const pressed = new Set()
const touchDirection = ref('')
const speed = 106 // pixels/second at the 360 × 500 art resolution

const obstacles = [
  { x: 7, y: 148, w: 136, h: 110 },
  { x: 218, y: 148, w: 135, h: 110 },
  { x: 22, y: 280, w: 127, h: 115 },
  { x: 213, y: 280, w: 128, h: 115 },
  { x: 5, y: 422, w: 68, h: 56 },
  { x: 287, y: 422, w: 68, h: 56 },
]

// Profile names and match scores are taken from the SAME demo source as Reader Room.
// Presets come from the hair salon's shared character catalogue (not new assets).
const looks = {
  'reader-emma': 'maya',
  'reader-ayaan': 'jay',
  'reader-sofia': 'rosie',
  'reader-noah': 'nova',
}
const seats = {
  'reader-emma': { x: 79, y: 220, meetX: 174, meetY: 262 },
  'reader-ayaan': { x: 278, y: 220, meetX: 186, meetY: 262 },
  'reader-sofia': { x: 91, y: 356, meetX: 171, meetY: 382 },
  'reader-noah': { x: 264, y: 356, meetX: 190, meetY: 382 },
}

function avatarImage(raw) {
  const look = normaliseCharacter(raw)
  const params = toDrawParams(look)
  return drawAvatar(params, makeRnd(characterSeed(look))).toDataURL('image/png')
}

function seatedAvatar(raw) {
  // Show head and shoulders only. Tables in the foreground hide the lap.
  const look = normaliseCharacter(raw)
  const full = drawAvatar(toDrawParams(look), makeRnd(characterSeed(look)))
  const [seated, ctx] = mk(30, 44)
  ctx.drawImage(full, 0, 0, 30, 44, 0, 0, 30, 44)
  return seated.toDataURL('image/png')
}

const readers = sampleReaders.map((reader) => ({
  ...reader,
  ...seats[reader.id],
  firstName: reader.displayName.split(' ')[0],
  score: getCompatibility(reader),
  sprite: seatedAvatar(presetCharacter(looks[reader.id] || 'rosie')),
}))

const selfSprite = computed(() => avatarImage(props.character))
const outerSize = computed(() => ({
  width: `${CAFE_W * scale.value}px`,
  height: `${CAFE_H * scale.value}px`,
}))
const innerSize = computed(() => ({
  width: `${CAFE_W}px`,
  height: `${CAFE_H}px`,
  transform: `scale(${scale.value})`,
}))
const youStyle = computed(() => ({
  left: `${Math.round(position.value.x - 15)}px`,
  top: `${Math.round(position.value.y - 58)}px`,
}))

let observer
let animation
let lastFrame = 0
let waypoints = []
let pendingReader = null

function fit() {
  if (!root.value) return
  scale.value = Math.max(0.1, Math.min(
    root.value.clientWidth / CAFE_W,
    root.value.clientHeight / CAFE_H,
  ))
}

function walkable(x, y) {
  const padding = 8
  if (x < 16 || x > CAFE_W - 16 || y < 144 || y > 465) return false
  return !obstacles.some((box) => (
    x + padding > box.x && x - padding < box.x + box.w &&
    y + padding > box.y && y - padding < box.y + box.h
  ))
}

function moveBy(dx, dy) {
  const p = position.value
  let x = p.x
  let y = p.y
  if (walkable(x + dx, y)) x += dx
  if (walkable(x, y + dy)) y += dy
  if (x !== p.x || y !== p.y) position.value = { x, y }
  return x !== p.x || y !== p.y
}

function walkTowards(point, amount) {
  const dx = point.x - position.value.x
  const dy = point.y - position.value.y
  const distance = Math.hypot(dx, dy)
  if (distance < 2) return true
  const step = Math.min(distance, amount)
  const moved = moveBy((dx / distance) * step, (dy / distance) * step)
  return moved && Math.hypot(point.x - position.value.x, point.y - position.value.y) < 2
}

function stopWalking() {
  waypoints = []
  pendingReader = null
  approaching.value = ''
}

function goTo(x, y, reader = null) {
  if (!walkable(x, y)) return
  // The middle aisle is unobstructed, so all table approaches go through it.
  // It also prevents an automatic straight line through furniture.
  const p = position.value
  waypoints = [
    { x: 180, y: p.y },
    { x: 180, y },
    { x, y },
  ].filter((point) => Math.hypot(point.x - p.x, point.y - p.y) > 1)
  pendingReader = reader
  approaching.value = reader ? reader.firstName : ''
  emit('select', '')
}

function selectReader(reader) {
  goTo(reader.meetX, reader.meetY, reader)
}

function nearestReader() {
  let closest = null
  let distance = Infinity
  for (const reader of readers) {
    const d = Math.hypot(reader.meetX - position.value.x, reader.meetY - position.value.y)
    if (d < distance) {
      closest = reader
      distance = d
    }
  }
  return distance <= 33 ? closest : null
}

function interact() {
  const reader = nearestReader()
  if (reader) {
    stopWalking()
    emit('select', reader.id)
  }
}

function update(now) {
  if (!lastFrame) lastFrame = now
  const dt = Math.min((now - lastFrame) / 1000, 0.05)
  lastFrame = now
  const keys = pressed
  const x = Number(keys.has('d') || keys.has('arrowright') || touchDirection.value === 'right') -
            Number(keys.has('a') || keys.has('arrowleft') || touchDirection.value === 'left')
  const y = Number(keys.has('s') || keys.has('arrowdown') || touchDirection.value === 'down') -
            Number(keys.has('w') || keys.has('arrowup') || touchDirection.value === 'up')

  if (x || y) {
    if (waypoints.length) stopWalking()
    const norm = Math.hypot(x, y)
    moveBy((x / norm) * speed * dt, (y / norm) * speed * dt)
  } else if (waypoints.length) {
    const point = waypoints[0]
    if (walkTowards(point, speed * dt)) {
      waypoints.shift()
      if (!waypoints.length && pendingReader) {
        emit('select', pendingReader.id)
        pendingReader = null
        approaching.value = ''
      }
    }
  }
  animation = requestAnimationFrame(update)
}

function typing(event) {
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName) ||
    event.target?.isContentEditable || event.ctrlKey || event.metaKey || event.altKey
}

function onKeyDown(event) {
  if (typing(event)) return
  const key = event.key.toLowerCase()
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
    pressed.add(key)
    event.preventDefault()
  } else if (key === 'e' && !event.repeat) {
    interact()
  } else if (key === 'escape') {
    emit('select', '')
  }
}

function onKeyUp(event) {
  pressed.delete(event.key.toLowerCase())
}

function startTouch(direction, event) {
  event.preventDefault()
  event.currentTarget.setPointerCapture?.(event.pointerId)
  touchDirection.value = direction
}

function stopTouch() {
  touchDirection.value = ''
}

function tapFloor(event) {
  // Tap-to-walk is useful on phones; ignore the clickable readers above the floor.
  if (event.target.closest('button')) return
  const rect = world.value?.getBoundingClientRect()
  if (!rect) return
  const x = (event.clientX - rect.left) / scale.value
  const y = (event.clientY - rect.top) / scale.value
  if (walkable(x, y)) goTo(x, y)
}

onMounted(() => {
  fit()
  observer = new ResizeObserver(fit)
  observer.observe(root.value)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', stopTouch)
  animation = requestAnimationFrame(update)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animation)
  observer?.disconnect()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('blur', stopTouch)
  pressed.clear()
})
</script>

<template>
  <section ref="root" class="cafe-scene" aria-label="Walkable café with nearby readers">
    <div class="cafe-scene__frame" :style="outerSize">
      <div ref="world" class="cafe-scene__world" :style="innerSize" @click="tapFloor">
        <img :src="art.backdrop" class="cafe-scene__layer" alt="" draggable="false" />
        <img
          v-for="reader in readers" :key="reader.id" :src="reader.sprite"
          class="cafe-scene__npc" :style="{ left: `${reader.x - 15}px`, top: `${reader.y - 44}px` }"
          alt="" draggable="false"
        />
        <img :src="art.foreground" class="cafe-scene__layer cafe-scene__foreground" alt="" draggable="false" />
        <img :src="selfSprite" class="cafe-scene__you" :style="youStyle" alt="" draggable="false" />
        <div class="cafe-scene__you-label" :style="{ left: `${position.x}px`, top: `${position.y - 68}px` }">YOU</div>
        <button
          v-for="reader in readers" :key="`tap-${reader.id}`" type="button"
          class="cafe-scene__reader"
          :class="{ 'cafe-scene__reader--selected': selectedId === reader.id }"
          :style="{ left: `${reader.x}px`, top: `${reader.y - 88}px` }"
          :aria-label="`Walk to ${reader.displayName}, ${reader.score}% reading match`"
          @click.stop="selectReader(reader)"
        >
          <span class="cafe-scene__reader-name">{{ reader.firstName }}</span>
          <span class="cafe-scene__reader-score">{{ reader.score }}% match</span>
        </button>
      </div>
    </div>

    <p class="cafe-scene__counter" aria-label="Number of nearby readers">☕ {{ readers.length }} readers nearby</p>
    <p class="cafe-scene__tip" role="status">
      {{ approaching ? `Walking to ${approaching}…` : 'Tap a reader · WASD / arrows to walk · E to chat' }}
    </p>

    <div class="cafe-scene__controls" role="group" aria-label="Walk around the café">
      <button class="cafe-scene__up" aria-label="Walk up" @pointerdown="startTouch('up', $event)" @pointerup="stopTouch" @pointercancel="stopTouch" @lostpointercapture="stopTouch">▲</button>
      <button class="cafe-scene__left" aria-label="Walk left" @pointerdown="startTouch('left', $event)" @pointerup="stopTouch" @pointercancel="stopTouch" @lostpointercapture="stopTouch">◀</button>
      <button class="cafe-scene__down" aria-label="Walk down" @pointerdown="startTouch('down', $event)" @pointerup="stopTouch" @pointercancel="stopTouch" @lostpointercapture="stopTouch">▼</button>
      <button class="cafe-scene__right" aria-label="Walk right" @pointerdown="startTouch('right', $event)" @pointerup="stopTouch" @pointercancel="stopTouch" @lostpointercapture="stopTouch">▶</button>
      <button class="cafe-scene__talk" aria-label="Talk to closest reader" @click="interact">E</button>
    </div>
  </section>
</template>

<style scoped>
.cafe-scene { position:relative; width:100%; height:100%; min-height:0; overflow:hidden; background:#a7774c; touch-action:none; }
.cafe-scene__frame { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); overflow:hidden; }
.cafe-scene__world { position:relative; transform-origin:top left; background:#ca9566; cursor:crosshair; }
.cafe-scene__layer { position:absolute; inset:0; width:360px; height:500px; image-rendering:pixelated; pointer-events:none; user-select:none; }
.cafe-scene__npc { position:absolute; z-index:2; width:30px; height:44px; image-rendering:pixelated; pointer-events:none; user-select:none; }
.cafe-scene__foreground { z-index:3; }
.cafe-scene__you { position:absolute; z-index:4; width:30px; height:58px; image-rendering:pixelated; pointer-events:none; user-select:none; filter:drop-shadow(0 2px 0 #392b22); }
.cafe-scene__you-label { position:absolute; z-index:6; transform:translateX(-50%); padding:1px 5px; background:#fff5db; color:#4e3326; border:1px solid #4e3326; border-radius:3px; font:bold 8px monospace; pointer-events:none; }
.cafe-scene__reader { position:absolute; z-index:6; width:82px; height:88px; border:0; padding:0; background:transparent; transform:translateX(-50%); color:#463126; display:flex; flex-direction:column; align-items:center; cursor:pointer; touch-action:manipulation; }
.cafe-scene__reader-name, .cafe-scene__reader-score { display:block; flex:none; background:#fff9e9; border:2px solid #48382d; padding:1px 7px; line-height:1.4; font:700 10px monospace; box-shadow:2px 2px 0 #48382d; }
.cafe-scene__reader-score { border-top:0; border-radius:0 0 8px 8px; background:#316b50; color:#fff9e9; font-size:9px; white-space:nowrap; }
.cafe-scene__reader--selected .cafe-scene__reader-score { background:#a25337; }
.cafe-scene__reader:focus-visible .cafe-scene__reader-name { outline:3px solid #ffef83; outline-offset:3px; }
.cafe-scene__counter { position:absolute; z-index:8; top:12px; right:12px; margin:0; padding:7px 10px; border:2px solid #48382d; border-radius:8px; background:#fff7df; font-size:12px; font-weight:700; box-shadow:3px 3px 0 #48382d; }
.cafe-scene__tip { position:absolute; z-index:8; bottom:12px; left:10px; max-width:calc(100% - 150px); margin:0; padding:8px; border:1px solid #624536; border-radius:8px; background:#fff7e9e8; color:#4c3528; font-size:11px; line-height:1.45; pointer-events:none; }
.cafe-scene__controls { position:absolute; z-index:9; right:10px; bottom:10px; display:grid; grid-template-columns:repeat(3, 37px); grid-template-rows:repeat(2, 37px); gap:3px; }
.cafe-scene__controls button { min-width:37px; min-height:37px; border:2px solid #604636; border-radius:8px; background:#fff8e7ee; color:#604636; font-size:15px; font-weight:800; box-shadow:2px 2px 0 #604636; touch-action:none; user-select:none; }
.cafe-scene__controls button:active { background:#e3bc86; box-shadow:none; }
.cafe-scene__up { grid-column:2; grid-row:1; }
.cafe-scene__left { grid-column:1; grid-row:2; }
.cafe-scene__down { grid-column:2; grid-row:2; }
.cafe-scene__right { grid-column:3; grid-row:2; }
.cafe-scene__talk { grid-column:3; grid-row:1; }
@media (max-width:360px) { .cafe-scene__counter{font-size:10px;} .cafe-scene__tip{max-width:calc(100% - 140px);font-size:10px;} }
@media (prefers-reduced-motion:reduce) { .cafe-scene__you{filter:none;} }
</style>
