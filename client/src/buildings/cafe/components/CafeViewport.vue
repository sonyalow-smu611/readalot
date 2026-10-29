<script setup>
// AI-assisted pixel-scene scaffold — frontend interaction requires teammate review.
// One fixed-size cafe world for every screen. Users drag the camera, not the furniture.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { SPAWN, SEATS, WALK_SPEED, WORLD, findCafePath } from '../cafeNavigation.js'

const props = defineProps({
  image: { type: String, required: true },
  readers: { type: Array, default: () => [] },
  playerImage: { type: String, required: true },
  selectedId: { type: String, default: '' },
})
const emit = defineEmits(['arrive', 'walking', 'route-error'])

const surface = ref(null)
const camera = ref({ x: 0, y: 0, zoom: 1 })
const player = ref({ ...SPAWN })
const movingTo = ref('')
const worldStyle = computed(() => ({
  width: `${WORLD.width}px`,
  height: `${WORLD.height}px`,
  transform: `translate3d(${camera.value.x}px, ${camera.value.y}px, 0) scale(${camera.value.zoom})`,
}))
const playerStyle = computed(() => ({ left: `${player.value.x}px`, top: `${player.value.y}px` }))

let observer = null
let rafId = 0
let lastTime = 0
let path = []
let goalId = ''
let drag = null
let reducedMotion = false
let viewportWidth = 0
let viewportHeight = 0

function clamp(value, lo, hi) { return Math.min(hi, Math.max(lo, value)) }
function clampCamera(x, y) {
  const { zoom } = camera.value
  const width = WORLD.width * zoom
  const height = WORLD.height * zoom
  return {
    x: width <= viewportWidth ? (viewportWidth - width) / 2 : clamp(x, viewportWidth - width, 0),
    y: height <= viewportHeight ? (viewportHeight - height) / 2 : clamp(y, viewportHeight - height, 0),
  }
}
function centerOnPlayer() {
  const { zoom } = camera.value
  const next = clampCamera(viewportWidth * 0.5 - player.value.x * zoom,
    viewportHeight * 0.63 - player.value.y * zoom)
  camera.value = { ...camera.value, ...next }
}
function fitWorld() {
  const el = surface.value
  if (!el) return
  viewportWidth = el.clientWidth
  viewportHeight = el.clientHeight
  if (!viewportWidth || !viewportHeight) return
  // Desktop: wide art. Mobile: same art at a comfortable readable scale, pannable in both axes.
  const zoom = viewportWidth >= 900
    ? Math.max(viewportWidth / WORLD.width, viewportHeight / WORLD.height)
    : clamp(viewportHeight / WORLD.height, 0.78, 1.12)
  camera.value = { ...camera.value, zoom }
  centerOnPlayer()
}

function stop() {
  path = []
  goalId = ''
  movingTo.value = ''
}
function seatFor(reader, index) {
  return SEATS[reader.seatIndex ?? index]
}
function chooseReader(reader) {
  const seat = seatFor(reader, props.readers.findIndex((item) => item.id === reader.id))
  if (!seat) return
  const route = findCafePath(player.value, seat.approach)
  if (!route.length) {
    emit('route-error', `There is no clear walking route to ${reader.displayName}.`)
    return
  }
  path = route
  goalId = reader.id
  movingTo.value = reader.displayName
  emit('walking', reader.id)
  if (reducedMotion) {
    player.value = { ...seat.approach }
    stop()
    centerOnPlayer()
    emit('arrive', reader.id)
  }
}
function update(time) {
  if (!lastTime) lastTime = time
  const seconds = Math.min((time - lastTime) / 1000, 0.05)
  lastTime = time
  if (path.length) {
    let remaining = WALK_SPEED * seconds
    let point = player.value
    while (remaining > 0 && path.length) {
      const dest = path[0]
      const d = Math.hypot(dest.x - point.x, dest.y - point.y)
      if (d <= remaining + 0.01) {
        point = { ...dest }
        path.shift()
        remaining -= d
      } else {
        point = { x: point.x + (dest.x - point.x) * remaining / d,
          y: point.y + (dest.y - point.y) * remaining / d }
        remaining = 0
      }
    }
    player.value = point
    if (!drag) centerOnPlayer()
    if (!path.length && goalId) {
      const id = goalId
      stop()
      emit('arrive', id)
    }
  }
  rafId = requestAnimationFrame(update)
}
function startPan(event) {
  if (event.button !== 0 || event.target.closest('button')) return
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY }
  surface.value?.setPointerCapture(event.pointerId)
}
function pan(event) {
  if (!drag || event.pointerId !== drag.id) return
  const dx = event.clientX - drag.x, dy = event.clientY - drag.y
  drag.x = event.clientX
  drag.y = event.clientY
  const next = clampCamera(camera.value.x + dx, camera.value.y + dy)
  camera.value = { ...camera.value, ...next }
}
function endPan(event) {
  if (!drag || event.pointerId !== drag.id) return
  if (surface.value?.hasPointerCapture(event.pointerId)) surface.value.releasePointerCapture(event.pointerId)
  drag = null
}

watch(() => props.readers.map((r) => r.id).join('|'), () => {
  // If a refresh removes the selected reader, stop following a stale seat.
  if (goalId && !props.readers.some((r) => r.id === goalId)) stop()
})

onMounted(async () => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  await nextTick()
  fitWorld()
  observer = new ResizeObserver(fitWorld)
  observer.observe(surface.value)
  rafId = requestAnimationFrame(update)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  observer?.disconnect()
})
</script>

<template>
  <section ref="surface" class="cafe-viewport" aria-label="Explore the reading cafe. Drag to pan, or select a reader to walk over."
    @pointerdown="startPan" @pointermove="pan" @pointerup="endPan" @pointercancel="endPan" @lostpointercapture="endPan">
    <div class="cafe-viewport__world" :style="worldStyle">
      <img class="cafe-viewport__background" :src="image" alt="" draggable="false" />

      <button v-for="(reader, index) in readers" :key="reader.id" type="button"
        class="cafe-viewport__reader" :class="{ 'cafe-viewport__reader--active': reader.id === selectedId }"
        :style="{ left: `${seatFor(reader, index).x}px`, top: `${seatFor(reader, index).y - 100}px` }"
        :aria-label="`Walk to ${reader.displayName}`" @click.stop="chooseReader(reader)">
        <span class="cafe-viewport__name">{{ reader.displayName.split(' ')[0] }}</span>
        <span v-if="reader.compatibility != null" class="cafe-viewport__score">{{ reader.compatibility }}% match</span>
        <span v-else class="cafe-viewport__score">Match pending</span>
        <img :src="reader.sprite" alt="" class="cafe-viewport__sprite" draggable="false" />
      </button>

      <div class="cafe-viewport__player" :style="playerStyle" aria-label="Your avatar">
        <span class="cafe-viewport__you">YOU</span>
        <img :src="playerImage" alt="" draggable="false" />
      </div>
    </div>
    <p v-if="movingTo" class="cafe-viewport__status" role="status">Walking to {{ movingTo }}…</p>
    <p v-else-if="readers.length" class="cafe-viewport__status">Drag to explore · Tap a reader</p>
  </section>
</template>

<style scoped>
.cafe-viewport{position:relative;width:100%;height:100%;overflow:hidden;touch-action:none;user-select:none;background:#b98760;cursor:grab}
.cafe-viewport:active{cursor:grabbing}
.cafe-viewport__world{position:absolute;top:0;left:0;transform-origin:top left;will-change:transform}
.cafe-viewport__background{position:absolute;inset:0;width:1200px;height:820px;image-rendering:pixelated;pointer-events:none}
.cafe-viewport__reader{position:absolute;z-index:3;display:flex;align-items:center;flex-direction:column;gap:2px;transform:translateX(-50%);width:104px;height:104px;cursor:pointer;border:0;background:none;color:#35271f;padding:0;touch-action:manipulation}
.cafe-viewport__name,.cafe-viewport__score{display:block;max-width:102px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:2px 7px;border:2px solid #5a4032;background:#fff8e7;font:700 12px/1.1 system-ui,sans-serif;border-radius:5px;box-shadow:2px 2px 0 #3b2a20}
.cafe-viewport__score{background:#39735e;color:white;font-size:10px}
.cafe-viewport__reader--active .cafe-viewport__name{outline:3px solid #f4cf75;outline-offset:2px}
.cafe-viewport__reader:focus-visible{outline:3px solid #fff4aa;border-radius:8px}
.cafe-viewport__sprite {display: block; width: 32px; height: 64px; object-fit: contain; image-rendering: pixelated; filter: drop-shadow(1px 2px 0 #35271f55); pointer-events: none;}
.cafe-viewport__reader:hover .cafe-viewport__sprite{transform:translateY(-2px)}
.cafe-viewport__player{position:absolute;z-index:4;transform:translate(-50%,-100%);pointer-events:none;display:flex;align-items:center;flex-direction:column}
.cafe-viewport__player img{display:block;width:37px;height:75px;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(2px 2px 0 #45302155)}
.cafe-viewport__you{background:#fff8e7;border:2px solid #523a2b;border-radius:6px;padding:2px 5px;font:800 11px system-ui,sans-serif}
.cafe-viewport__status{position:absolute;z-index:6;bottom:10px;left:50%;transform:translateX(-50%);margin:0;border-radius:10px;background:#fff8e7ec;border:2px solid #664a35;padding:7px 11px;white-space:nowrap;color:#483627;font-size:12px;pointer-events:none;max-width:95%;text-overflow:ellipsis;overflow:hidden}
@media(max-width:600px){.cafe-viewport__status{font-size:11px}}
@media(prefers-reduced-motion:reduce){.cafe-viewport__reader:hover .cafe-viewport__sprite{transform:none}}
</style>
