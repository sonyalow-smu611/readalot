<script setup>
// AI-assisted café viewport scaffold. Review camera and interaction logic with your team.
// Desktop: full world fits edge-to-edge. Mobile: same world, draggable camera.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { SPAWN, SEATS, WALK_SPEED, WORLD, findCafePath } from '../cafeNavigation.js'

const props = defineProps({
  image: { type: String, required: true },
  foreground: { type: String, required: true },
  readers: { type: Array, default: () => [] },
  playerImage: { type: String, required: true },
  selectedId: { type: String, default: '' },
})
const emit = defineEmits(['arrive', 'walking', 'route-error'])

const viewport = ref(null)
const player = ref({ ...SPAWN })
const camera = ref({ x: 0, y: 0, scaleX: 1, scaleY: 1 })
const walkingName = ref('')
const walking = ref(false)
const facingLeft = ref(false)
const isMobile = ref(false)
const worldStyle = computed(() => ({
  width: `${WORLD.width}px`,
  height: `${WORLD.height}px`,
  transform: `translate3d(${camera.value.x}px,${camera.value.y}px,0) scale(${camera.value.scaleX},${camera.value.scaleY})`,
}))
const playerStyle = computed(() => ({ left: `${player.value.x}px`, top: `${player.value.y}px` }))

let observer = null
let frameId = 0
let lastFrame = 0
let path = []
let destinationId = ''
let drag = null
let reduceMotion = false
let vw = 0
let vh = 0

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const seatOf = (reader, index) => SEATS[reader.seatIndex ?? index]

function clampOffset(x, y) {
  const width = WORLD.width * camera.value.scaleX
  const height = WORLD.height * camera.value.scaleY
  return {
    x: width <= vw ? (vw - width) / 2 : clamp(x, vw - width, 0),
    y: height <= vh ? (vh - height) / 2 : clamp(y, vh - height, 0),
  }
}
function followPlayer(seconds = 1) {
  if (!isMobile.value || drag) return
  const target = clampOffset(
    vw * .5 - player.value.x * camera.value.scaleX,
    vh * .68 - player.value.y * camera.value.scaleY,
  )
  const blend = reduceMotion ? 1 : 1 - Math.exp(-Math.min(1, seconds) * 8)
  camera.value = {
    ...camera.value,
    x: camera.value.x + (target.x - camera.value.x) * blend,
    y: camera.value.y + (target.y - camera.value.y) * blend,
  }
}
function measure() {
  if (!viewport.value) return
  vw = viewport.value.clientWidth
  vh = viewport.value.clientHeight
  if (!vw || !vh) return
  isMobile.value = vw < 850

  if (!isMobile.value) {
    // Fit the ENTIRE room, including the wall and its windows, in the laptop viewport.
    // Slightly independent x/y scaling ensures there are no side margins or cropped edges.
    camera.value = { x: 0, y: 0, scaleX: vw / WORLD.width, scaleY: vh / WORLD.height }
  } else {
    // Do not switch to another artwork or remove seats: pan the identical 1200x600 world.
    const scale = clamp(vh / WORLD.height, .85, 1.05)
    camera.value = { ...camera.value, scaleX: scale, scaleY: scale }
    const offset = clampOffset(
      vw * .5 - player.value.x * scale,
      vh * .68 - player.value.y * scale,
    )
    camera.value = { ...camera.value, ...offset }
  }
}
function clearWalk() {
  path = []
  destinationId = ''
  walkingName.value = ''
  walking.value = false
}
function chooseReader(reader) {
  const index = props.readers.findIndex((item) => item.id === reader.id)
  const seat = seatOf(reader, index)
  if (!seat) return
  const route = findCafePath(player.value, seat.approach)
  if (!route.length) {
    emit('route-error', `No clear path to ${reader.displayName}.`)
    return
  }
  path = route
  destinationId = reader.id
  walkingName.value = reader.displayName
  walking.value = true
  emit('walking', reader.id)
  if (reduceMotion) {
    player.value = { ...seat.approach }
    clearWalk()
    followPlayer(1)
    emit('arrive', reader.id)
  }
}
function animationFrame(now) {
  if (!lastFrame) lastFrame = now
  const seconds = Math.min((now - lastFrame) / 1000, .05)
  lastFrame = now
  if (path.length) {
    let pixels = WALK_SPEED * seconds
    let current = player.value
    while (pixels > 0 && path.length) {
      const next = path[0]
      const distance = Math.hypot(next.x - current.x, next.y - current.y)
      facingLeft.value = next.x < current.x - .5
      if (distance < pixels + .01) {
        current = { ...next }
        path.shift()
        pixels -= distance
      } else {
        current = {
          x: current.x + (next.x - current.x) * pixels / distance,
          y: current.y + (next.y - current.y) * pixels / distance,
        }
        pixels = 0
      }
    }
    player.value = current
    followPlayer(seconds)
    if (!path.length && destinationId) {
      const id = destinationId
      clearWalk()
      emit('arrive', id)
    }
  }
  frameId = requestAnimationFrame(animationFrame)
}
function startPan(event) {
  if (event.button !== 0 || event.target.closest('button')) return
  // Mouse/touch drag pans on narrow screens. Desktop already displays the whole world.
  if (!isMobile.value) return
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY }
  viewport.value?.setPointerCapture(event.pointerId)
}
function pan(event) {
  if (!drag || drag.id !== event.pointerId) return
  const dx = event.clientX - drag.x
  const dy = event.clientY - drag.y
  drag.x = event.clientX
  drag.y = event.clientY
  const offset = clampOffset(camera.value.x + dx, camera.value.y + dy)
  camera.value = { ...camera.value, ...offset }
}
function endPan(event) {
  if (!drag || drag.id !== event.pointerId) return
  if (viewport.value?.hasPointerCapture(event.pointerId)) {
    viewport.value.releasePointerCapture(event.pointerId)
  }
  drag = null
}
watch(() => props.readers.map((r) => r.id).join('|'), () => {
  if (destinationId && !props.readers.some((reader) => reader.id === destinationId)) clearWalk()
})
onMounted(async () => {
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  await nextTick()
  measure()
  observer = new ResizeObserver(measure)
  observer.observe(viewport.value)
  frameId = requestAnimationFrame(animationFrame)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frameId)
  observer?.disconnect()
})
</script>

<template>
  <section ref="viewport" class="cafe-viewport" aria-label="Reading café. Select a reader to walk to their table. Drag to explore on mobile."
    @pointerdown="startPan" @pointermove="pan" @pointerup="endPan" @pointercancel="endPan" @lostpointercapture="endPan">
    <div class="cafe-viewport__world" :style="worldStyle">
      <img class="cafe-viewport__background" :src="image" alt="" draggable="false" />
      <button v-for="(reader,index) in readers" :key="reader.id" type="button"
        class="cafe-viewport__reader" :class="{ 'cafe-viewport__reader--selected': reader.id === selectedId }"
        :style="{ left: `${seatOf(reader,index).x}px`, top: `${seatOf(reader,index).y - 95}px` }"
        :aria-label="`Walk to ${reader.displayName}`" @click.stop="chooseReader(reader)">
        <span class="cafe-viewport__name">{{ reader.displayName }}</span>
        <span class="cafe-viewport__match">{{ reader.compatibility == null ? 'Match pending' : `${reader.compatibility}% match` }}</span>
        <img :src="reader.sprite" class="cafe-viewport__sprite" alt="" draggable="false" />
      </button>
      <!-- Foreground tabletops cover seated characters' legs without cropping their sprites. -->
      <img class="cafe-viewport__foreground" :src="foreground" alt="" draggable="false" />
      <div class="cafe-viewport__player" :class="{ 'cafe-viewport__player--walking': walking }"
        :style="playerStyle" aria-label="Your avatar">
        <span class="cafe-viewport__you">YOU</span>
        <img :src="playerImage" :style="{ transform: facingLeft ? 'scaleX(-1)' : 'none' }" alt="" draggable="false" />
      </div>
    </div>
    <p v-if="walkingName" class="cafe-viewport__status" role="status">Walking to {{ walkingName }}…</p>
    <p v-else-if="isMobile" class="cafe-viewport__status">Drag to explore · Tap a reader</p>
    <p v-else class="cafe-viewport__status">Click a reader to walk over</p>
  </section>
</template>

<style scoped>
.cafe-viewport{position:relative;width:100%;height:100%;overflow:hidden;background:#cb9667;touch-action:none;user-select:none;cursor:default}
.cafe-viewport__world{position:absolute;inset:0 auto auto 0;transform-origin:top left;will-change:transform}
.cafe-viewport__background,.cafe-viewport__foreground{position:absolute;inset:0;width:1200px;height:600px;image-rendering:pixelated;pointer-events:none}
.cafe-viewport__foreground{z-index:3}
.cafe-viewport__reader{position:absolute;z-index:2;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:3px;width:164px;height:135px;padding:0;border:0;background:transparent;cursor:pointer;color:#332724;touch-action:manipulation}
.cafe-viewport__name{box-sizing:border-box;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:161px;min-width:80px;text-align:center;font:800 13px/1.2 system-ui,sans-serif;letter-spacing:.05px;border:2px solid #4e372d;border-radius:7px;background:#fff9e9;color:#33241b;box-shadow:2px 3px 0 #5338227d;padding:5px 10px}
.cafe-viewport__match{box-sizing:border-box;display:block;white-space:nowrap;max-width:161px;min-width:78px;text-align:center;border-radius:7px;background:#286a54;color:white;border:2px solid #214734;font:800 11px/1.2 system-ui,sans-serif;box-shadow:2px 3px 0 #23372999;padding:4px 10px}
.cafe-viewport__sprite{width:32px;height:64px;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(1px 2px 0 #44322277);pointer-events:none}
.cafe-viewport__reader:hover .cafe-viewport__sprite{translate:0 -2px}
.cafe-viewport__reader:focus-visible{outline:3px solid #fff5ad;outline-offset:2px;border-radius:8px}
.cafe-viewport__reader--selected .cafe-viewport__name,.cafe-viewport__reader--selected .cafe-viewport__match{outline:2px solid #f5ce76;outline-offset:2px}
.cafe-viewport__player{position:absolute;z-index:4;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;pointer-events:none}
.cafe-viewport__player img{display:block;width:35px;height:70px;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(2px 2px 0 #49322166)}
.cafe-viewport__you{border:2px solid #654632;background:#fff9e9;border-radius:5px;padding:2px 6px;color:#342922;font:800 11px system-ui,sans-serif}
.cafe-viewport__player--walking{animation:cafe-steps 240ms ease-in-out infinite alternate}
@keyframes cafe-steps{from{translate:0 0}to{translate:0 -2px}}
.cafe-viewport__status{position:absolute;z-index:8;left:50%;bottom:10px;transform:translateX(-50%);margin:0;max-width:90%;padding:7px 12px;border:2px solid #66503d;border-radius:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:#fff9ecf2;color:#493629;font:700 12px system-ui,sans-serif;pointer-events:none}
@media(max-width:640px){.cafe-viewport__status{font-size:11px}}
@media(prefers-reduced-motion:reduce){.cafe-viewport__player--walking{animation:none}}
</style>
