<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The walkthrough (lib/walkthrough.js). The text sits in one bar at the bottom that never moves,
// and the reader's own character floats to whatever is being shown. Two kinds of step:
//   explain  the screen greys out and holds still (nothing under it can be touched or scrolled),
//            with a hole the exact outline of the thing, and the character hops from thing to thing
//   try      the screen stays clear. A pixel hand shows the tap or the slide, and only that thing
//            works (a shield covers the rest). The reader does it, and it carries on at once.
// The dim, the holes and every outline are drawn on one canvas, so they all look the same and
// follow the real shapes (lib/tourShapes.js). It is redrawn on every frame, so the outline stays
// on its thing wherever the page moves.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import PixelCharacter from '@/components/shared/PixelCharacter.vue'
import { prefersReducedMotion } from '@/lib/motion'
import { useBookshelfStore } from '@/stores/bookshelf.js'
import {
  DARK_BAND,
  GLOW,
  LIGHT_BAND,
  OUTLINE_DARK,
  OUTLINE_LIGHT,
  RING_MARGIN,
  cornerRadii,
  maskPicture,
  placePicture,
  ringOf,
  roundedPath,
} from '@/lib/tourShapes.js'
import { BAR_HEIGHT } from '@/lib/walkthrough.js'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const bookshelf = useBookshelfStore()
const { guide, guideStep, guideCount, profile } = storeToRefs(user)

const root = ref(null)
const canvas = ref(null)
const stopIndex = ref(0)
const hop = ref(0)
const paused = ref(false)
const avatar = ref({ x: 0, y: 0 })
const hand = ref(null)
const shield = ref('')
// the reader has set off into a building: the walkthrough steps aside while their character walks
const leaving = ref(false)
// how much of the section they have slid across, 0 to 1, when there is something to slide
const slideProgress = ref(null)
const reduced = prefersReducedMotion()

// the character, at scale 2: 30 x 58 art pixels, doubled
const ME_W = 60
const ME_H = 116
const EDGE = 8
const DIM = 'rgba(44, 36, 30, 0.62)'

let host = { width: 0, height: 0, top: 0, left: 0, dpr: 1 }
let shapes = []
let frame = 0
let slide = null
let shelfBefore = null
let advancing = -1
let sawDialog = false
let drag = null
let wheeled = 0

const isTry = computed(() => guide.value?.kind === 'try')
const sayText = computed(() => (isTry.value ? guide.value.say : (guide.value?.stops[stopIndex.value]?.say ?? guide.value?.say)))
const stops = computed(() => (isTry.value ? [] : (guide.value?.stops ?? [])))
const isLast = computed(() => guideStep.value === guideCount.value - 1)
const hint = computed(() => {
  const step = guide.value
  if (step?.hint) return step.hint
  return step?.until === 'slide' ? 'slide' : step?.until === 'book-moved' ? 'drag' : 'tap'
})

// --- Finding things -------------------------------------------------------------------------------

// The first match that is on screen and has a size (the same mark can sit on a phone's button and a
// laptop's search bar, one of them hidden), outside the walkthrough's own parts.
function findTarget(selector) {
  if (!selector) return null
  for (const element of document.querySelectorAll(selector)) {
    if (root.value?.contains(element)) continue
    const box = element.getBoundingClientRect()
    if (box.width >= 2 && box.height >= 2 && getComputedStyle(element).visibility !== 'hidden') return element
  }
  return null
}

function boxOf(element) {
  const box = element.getBoundingClientRect()
  return { x: box.left - host.left, y: box.top - host.top, width: box.width, height: box.height }
}

// A thing on screen: its element, its box, and the shape to outline: its picture's own shape when
// it has one that fits, else its own rounded box.
function resolve(selector) {
  const element = findTarget(selector)
  if (!element) return null
  const box = boxOf(element)
  const spec = element.getAttribute('data-tour-mask')
  if (spec) {
    const picture = maskPicture(spec)
    const place = picture && placePicture(spec, picture, box)
    if (place) return { element, box, picture, place }
  }
  return { element, box, radii: cornerRadii(element, box.width, box.height) }
}

// --- Drawing --------------------------------------------------------------------------------------

function size() {
  const box = root.value?.getBoundingClientRect()
  if (!box || !canvas.value) return false
  const dpr = window.devicePixelRatio || 1
  host = { width: box.width, height: box.height, top: box.top, left: box.left, dpr }
  const width = Math.round(box.width * dpr)
  const height = Math.round(box.height * dpr)
  if (canvas.value.width !== width || canvas.value.height !== height) {
    canvas.value.width = width
    canvas.value.height = height
  }
  return true
}

function fillShape(ctx, shape) {
  if (shape.picture) {
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(shape.picture, shape.place.x, shape.place.y, shape.place.w, shape.place.h)
  } else {
    roundedPath(ctx, shape.box.x, shape.box.y, shape.box.width, shape.box.height, shape.radii)
    ctx.fillStyle = '#000'
    ctx.fill()
  }
}

// The one outline every target gets: a light band against the thing, a dark band round it, and a
// gold glow that breathes slowly.
function outline(ctx, shape, pulse) {
  ctx.save()
  ctx.shadowColor = GLOW
  ctx.shadowBlur = 8 + 10 * pulse
  if (shape.picture) {
    const { x, y, w, h } = shape.place
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(ringOf(shape.picture, w, h), x - RING_MARGIN, y - RING_MARGIN)
  } else {
    const { x, y, width, height } = shape.box
    roundedPath(ctx, x, y, width, height, shape.radii, LIGHT_BAND + DARK_BAND / 2)
    ctx.lineWidth = DARK_BAND
    ctx.strokeStyle = OUTLINE_DARK
    ctx.stroke()
    ctx.shadowBlur = 0
    roundedPath(ctx, x, y, width, height, shape.radii, LIGHT_BAND / 2)
    ctx.lineWidth = LIGHT_BAND
    ctx.strokeStyle = OUTLINE_LIGHT
    ctx.stroke()
  }
  ctx.restore()
}

function draw(time) {
  const ctx = canvas.value.getContext('2d')
  ctx.setTransform(host.dpr, 0, 0, host.dpr, 0, 0)
  ctx.clearRect(0, 0, host.width, host.height)
  if (!isTry.value) {
    ctx.fillStyle = DIM
    ctx.fillRect(0, 0, host.width, host.height)
    ctx.globalCompositeOperation = 'destination-out'
    for (const shape of shapes) if (shape) fillShape(ctx, shape)
    ctx.globalCompositeOperation = 'source-over'
  }
  const pulse = reduced ? 0.5 : 0.5 + 0.5 * Math.sin((time / 1000) * Math.PI)
  for (const shape of shapes) if (shape) outline(ctx, shape, pulse)
}

// --- Placing the character, the pointer and the shield --------------------------------------------

// Beside the thing and never over it: below it when it is in the top half, above it when it is in
// the bottom half, else to a side, and always clear of the text bar.
function placeAvatar(active) {
  const areaH = host.height - BAR_HEIGHT
  const clampX = (x) => Math.min(Math.max(x, EDGE), host.width - ME_W - EDGE)
  let spot = { x: clampX((host.width - ME_W) / 2), y: Math.max(EDGE, areaH / 2 - ME_H / 2) }
  if (active) {
    const { x, y, width, height } = active.box
    const cx = x + width / 2
    const cy = y + height / 2
    const gap = 10
    const below = { x: clampX(cx - ME_W / 2), y: y + height + gap }
    const above = { x: clampX(cx - ME_W / 2), y: y - ME_H - gap }
    const right = { x: x + width + gap, y: cy - ME_H / 2 }
    const left = { x: x - ME_W - gap, y: cy - ME_H / 2 }
    const order = cy < areaH / 2 ? [below, above, right, left] : [above, below, left, right]
    const fits = (p) => p.x >= EDGE && p.x + ME_W <= host.width - EDGE && p.y >= EDGE && p.y + ME_H <= areaH - EDGE
    const chosen = order.find(fits)
    if (chosen) spot = chosen
    else spot = { x: clampX(cx < host.width / 2 ? host.width - ME_W - EDGE : EDGE), y: Math.max(EDGE, areaH - ME_H - EDGE) }
  }
  const next = { x: Math.round(spot.x), y: Math.round(spot.y) }
  if (next.x !== avatar.value.x || next.y !== avatar.value.y) avatar.value = next
}

function placeHand(active) {
  if (!isTry.value || !active) {
    if (hand.value) hand.value = null
    return
  }
  const { x, y, width, height } = active.box
  const next = { x: Math.round(x + width / 2), y: Math.round(y + height / 2), span: Math.round(Math.min(width * 0.6, 220)), dx: 0, dy: 0 }
  // dragging: it carries the thing to where it goes
  const to = guide.value.hintTo ? findTarget(guide.value.hintTo) : null
  if (to) {
    const box = boxOf(to)
    next.dx = Math.round(box.x + box.width / 2 - next.x)
    next.dy = Math.round(box.y + box.height / 2 - next.y)
  }
  const old = hand.value
  if (!old || old.x !== next.x || old.y !== next.y || old.span !== next.span || old.dx !== next.dx || old.dy !== next.dy) hand.value = next
}

// A piece of the screen with a hole cut out of it: up to four pieces round the hole.
function subtract(piece, hole) {
  const x1 = Math.max(piece.x, hole.x)
  const y1 = Math.max(piece.y, hole.y)
  const x2 = Math.min(piece.x + piece.w, hole.x + hole.width)
  const y2 = Math.min(piece.y + piece.h, hole.y + hole.height)
  if (x1 >= x2 || y1 >= y2) return [piece]
  const out = []
  if (y1 > piece.y) out.push({ x: piece.x, y: piece.y, w: piece.w, h: y1 - piece.y })
  if (y2 < piece.y + piece.h) out.push({ x: piece.x, y: y2, w: piece.w, h: piece.y + piece.h - y2 })
  if (x1 > piece.x) out.push({ x: piece.x, y: y1, w: x1 - piece.x, h: y2 - y1 })
  if (x2 < piece.x + piece.w) out.push({ x: x2, y: y1, w: piece.x + piece.w - x2, h: y2 - y1 })
  return out
}

// Everything but the target (and what the step allows) is covered, so only that works.
function placeShield(active) {
  let next = ''
  if (isTry.value && active) {
    const holes = [active.box]
    for (const selector of guide.value.allow ?? []) {
      for (const element of document.querySelectorAll(selector)) {
        const box = boxOf(element)
        if (box.width >= 2 && box.height >= 2 && !root.value?.contains(element)) holes.push(box)
      }
    }
    // the screen minus the holes, as pieces that never overlap (overlapping holes would cancel out)
    let pieces = [{ x: 0, y: 0, w: host.width, h: host.height }]
    for (const hole of holes) pieces = pieces.flatMap((piece) => subtract(piece, hole))
    next = pieces.map((b) => `M${b.x.toFixed(1)} ${b.y.toFixed(1)}h${b.w.toFixed(1)}v${b.h.toFixed(1)}h${(-b.w).toFixed(1)}Z`).join(' ')
  }
  if (next !== shield.value) shield.value = next
}

// a try step whose thing isn't on screen yet blocks nothing
const shieldStyle = computed(() => {
  if (shield.value) return { clipPath: `path('${shield.value}')` }
  return isTry.value ? { pointerEvents: 'none' } : null
})

// Sliding means the whole section: how far along it the reader has been, until they have been
// nearly all the way. Where there is nothing to scroll (a room that fits the screen), one swipe does it.
function trackSlide(active) {
  const step = guide.value
  const element = isTry.value && step.until === 'slide' && active ? active.element : null
  const range = element ? element.scrollWidth - element.clientWidth : 0
  if (!element || range < 60) {
    slide = null
    if (slideProgress.value !== null) slideProgress.value = null
    return
  }
  if (!slide || slide.element !== element) slide = { element, min: element.scrollLeft, max: element.scrollLeft }
  slide.min = Math.min(slide.min, element.scrollLeft)
  slide.max = Math.max(slide.max, element.scrollLeft)
  const done = Math.min(1, Math.round(((slide.max - slide.min) / (range * 0.9)) * 100) / 100)
  if (done !== slideProgress.value) slideProgress.value = done
  if (done >= 1) advance(600)
}

// A book moved to another shelf, by the reader: any book's shelf is different from when the step began.
function watchShelf() {
  const now = JSON.stringify(bookshelf.books.map((book) => [book.id, book.status]).sort())
  if (shelfBefore === null) {
    if (bookshelf.books.length) shelfBefore = now
  } else if (now !== shelfBefore) {
    advance(900)
  }
}

// --- The frame loop -------------------------------------------------------------------------------

function loop(time) {
  frame = requestAnimationFrame(loop)
  const step = guide.value
  if (!step || !size()) return

  // a native pop-up (the chat) takes over the whole screen, so the walkthrough waits behind it
  const dialogOpen = Boolean(document.querySelector('dialog[open]'))
  if (dialogOpen !== paused.value) paused.value = dialogOpen
  if (dialogOpen) sawDialog = true
  else if (sawDialog && step.until === 'dialog-closed') advance(300)

  // a group lights its things one at a time: those introduced so far stay lit, the rest stay dim
  // set off into a building: the walkthrough steps aside while their character walks there
  if (leaving.value) {
    canvas.value.getContext('2d').clearRect(0, 0, canvas.value.width, canvas.value.height)
    if (hand.value) hand.value = null
    if (shield.value) shield.value = ''
    return
  }

  const selectors = isTry.value ? [step.target] : step.stops.map((stop, index) => (index <= stopIndex.value ? stop.target : null))
  shapes = selectors.map(resolve)
  const active = shapes[isTry.value ? 0 : stopIndex.value] ?? null

  // already done (a friend request to someone who is already a friend): nothing to do here
  if (isTry.value && active && (active.element.disabled || active.element.getAttribute('aria-disabled') === 'true')) advance(900)

  trackSlide(active)
  if (isTry.value && step.until === 'book-moved') watchShelf()

  placeAvatar(active)
  placeHand(active)
  placeShield(active)
  draw(time)
}

// --- Moving on ------------------------------------------------------------------------------------

function advance(delay = 400) {
  const step = guideStep.value
  if (advancing === step) return
  advancing = step
  window.setTimeout(() => {
    if (guideStep.value === step) user.nextGuide()
  }, delay)
}

// whether the reader is already on the step's page
function onPage(to) {
  return !to || route.path === to.split('?')[0]
}

// Next lights the next thing in a group before it goes on; Back goes the other way
function onNext() {
  if (!isTry.value && stopIndex.value < stops.value.length - 1) stopIndex.value += 1
  else user.nextGuide()
}

function onBack() {
  if (!isTry.value && stopIndex.value > 0) stopIndex.value -= 1
  else user.backGuide()
}

// the thing lit now comes into view, if it is off the edge
function bringIntoView() {
  const step = guide.value
  const selector = step ? (isTry.value ? step.target : step.stops[stopIndex.value]?.target) : null
  findTarget(selector)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

watch(guideStep, async (step) => {
  stopIndex.value = 0
  hop.value += 1
  sawDialog = false
  advancing = -1
  leaving.value = false
  slide = null
  shelfBefore = null
  if (step < 0 || !guide.value) return
  const to = guide.value.to
  if (to && !onPage(to)) await router.push(to).catch(() => {})
  window.setTimeout(bringIntoView, 250)
}, { immediate: true })

watch(stopIndex, () => window.setTimeout(bringIntoView, 50))

// Reaching the page a step asks for counts as doing it.
watch(() => route.fullPath, (path) => {
  const until = guide.value?.until
  if (isTry.value && until instanceof RegExp && until.test(path)) advance(300)
})

// While an explaining step is up the screen holds still: nothing under it takes a tap or a key.
function freeze() {
  const main = document.querySelector('.app-main')
  if (!main) return
  if (guide.value && !isTry.value) main.setAttribute('inert', '')
  else main.removeAttribute('inert')
}
watch(() => (guide.value ? guide.value.kind : null), freeze, { immediate: true, flush: 'post' })

// Doing what it asks is the reader's own tap or slide; the walkthrough only notices it.
function onClick(event) {
  const step = guide.value
  if (!step || !isTry.value) return
  const selector = step.until === 'tap' ? step.target : typeof step.until === 'object' && !(step.until instanceof RegExp) ? step.until.tap : null
  if (selector && event.target.closest?.(selector)) advance(400)
  // "Go inside" on a building's card: their character walks to the door, and the walkthrough waits
  if (step.focus && (step.allow ?? []).some((allowed) => event.target.closest?.(allowed))) leaving.value = true
}

const SLIDE = 60

function onPointerDown(event) {
  const step = guide.value
  if (step?.until !== 'slide' || !event.target.closest?.(step.target)) return
  drag = { x: event.clientX, y: event.clientY, far: false }
}

function onPointerMove(event) {
  if (drag && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) >= SLIDE) drag.far = true
}

function onPointerUp() {
  if (drag?.far && !slide) advance(250)
  drag = null
}

// a trackpad or mouse wheel slides it too
function onWheel(event) {
  const step = guide.value
  if (step?.until !== 'slide' || slide || !event.target.closest?.(step.target)) return
  wheeled += Math.abs(event.deltaX) + (event.shiftKey ? Math.abs(event.deltaY) : 0)
  if (wheeled >= 120) {
    wheeled = 0
    advance(250)
  }
}

// A new reader's walkthrough begins when they reach the town after Welcome.
watch(() => route.name, (name) => {
  if (name === 'town') user.openGuideIfNew()
}, { immediate: true })

onMounted(() => {
  frame = requestAnimationFrame(loop)
  document.addEventListener('click', onClick, true)
  document.addEventListener('pointerdown', onPointerDown, true)
  document.addEventListener('pointermove', onPointerMove, true)
  document.addEventListener('pointerup', onPointerUp, true)
  document.addEventListener('wheel', onWheel, { capture: true, passive: true })
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  document.querySelector('.app-main')?.removeAttribute('inert')
  document.removeEventListener('click', onClick, true)
  document.removeEventListener('pointerdown', onPointerDown, true)
  document.removeEventListener('pointermove', onPointerMove, true)
  document.removeEventListener('pointerup', onPointerUp, true)
  document.removeEventListener('wheel', onWheel, true)
})

// the pointing hand, in pixels: K is its outline, W its skin, . nothing
const HAND = [
  '......KK......',
  '.....KWWK.....',
  '.....KWWK.....',
  '.....KWWK.....',
  '.....KWWKKK...',
  '.....KWWKWWKK.',
  '..KK.KWWKWWKWK',
  '.KWWKKWWWWWWWK',
  '.KWWWKWWWWWWWK',
  '..KWWWWWWWWWWK',
  '..KWWWWWWWWWK.',
  '...KWWWWWWWWK.',
  '....KWWWWWWK..',
  '....KWWWWWWK..',
  '.....KKKKKK...',
]
const handCells = HAND.flatMap((row, y) =>
  [...row].flatMap((cell, x) => (cell === '.' ? [] : [{ x, y, fill: cell === 'K' ? OUTLINE_DARK : OUTLINE_LIGHT }])),
)
</script>

<template>
  <div v-if="guide" ref="root" class="guide" :class="{ 'is-paused': paused }" role="region" aria-label="Walkthrough">
    <canvas ref="canvas" class="guide__canvas" aria-hidden="true" />
    <div class="guide__shield" :class="{ 'is-explain': !isTry }" :style="shieldStyle" />

    <!-- the pointer: shows the tap or the slide the reader is asked to do -->
    <div v-if="hand && !leaving" class="guide__hand" :class="`is-${hint}`" :style="{ left: `${hand.x}px`, top: `${hand.y}px`, '--span': `${hand.span}px`, '--dx': `${hand.dx}px`, '--dy': `${hand.dy}px` }" aria-hidden="true">
      <span class="guide__ripple" />
      <svg class="guide__hand-art" viewBox="0 0 14 15" width="42" height="45" shape-rendering="crispEdges">
        <rect v-for="cell in handCells" :key="`${cell.x}-${cell.y}`" :x="cell.x" :y="cell.y" width="1" height="1" :fill="cell.fill" />
      </svg>
    </div>

    <!-- the character floats to what is being shown -->
    <span v-show="!leaving" class="guide__me" :style="{ transform: `translate(${avatar.x}px, ${avatar.y}px)` }" aria-hidden="true">
      <span class="guide__me-float">
        <PixelCharacter :character="profile.character" :scale="2" :hop="hop" decorative />
      </span>
    </span>

    <!-- the words, always in the same place -->
    <footer class="guide__bubble" :style="{ height: `${BAR_HEIGHT}px` }" aria-live="polite">
      <div class="guide__top">
        <p class="guide__count">{{ guideStep + 1 }} of {{ guideCount }} · {{ guide.section }}</p>
        <div v-if="!isLast" class="guide__skips">
          <button type="button" class="btn btn-link btn-sm" @click="user.skipGuideSection()">Skip this part</button>
          <button type="button" class="btn btn-link btn-sm" @click="user.closeGuide()">Skip tour</button>
        </div>
      </div>
      <p class="guide__say">{{ sayText }}</p>
      <p v-if="guide.ask" class="guide__ask">{{ guide.ask }}</p>
      <div v-if="slideProgress !== null" class="guide__meter" role="progressbar" aria-label="How far you have slid" :aria-valuenow="Math.round(slideProgress * 100)" aria-valuemin="0" aria-valuemax="100">
        <i :style="{ width: `${slideProgress * 100}%` }" />
      </div>
      <span v-if="stops.length > 1" class="guide__dots" aria-hidden="true">
        <i v-for="(stop, index) in stops" :key="index" :class="{ 'is-on': index === stopIndex }" />
      </span>
      <div class="guide__actions">
        <button v-if="guideStep > 0 || stopIndex > 0" type="button" class="btn btn-secondary btn-sm" @click="onBack">Back</button>
        <button v-if="isTry" type="button" class="btn btn-secondary btn-sm flex-grow-1" @click="user.nextGuide()">Skip this step</button>
        <button v-else type="button" class="btn btn-primary btn-sm flex-grow-1" @click="onNext">
          {{ isLast && stopIndex >= stops.length - 1 ? 'Done' : 'Next' }}
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* above the pages' own pop-ups (Bootstrap's modals sit at 1055), so it can point into them */
.guide {
  position: absolute;
  z-index: 1100;
  inset: 0;
  pointer-events: none;
}

.guide.is-paused {
  visibility: hidden;
}

.guide__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* covers what a step doesn't allow: the clip-path leaves holes where taps may go through */
.guide__shield {
  position: absolute;
  inset: 0;
  pointer-events: auto;
}

/* an explaining step holds the whole screen still */
.guide__shield.is-explain {
  touch-action: none;
}

.guide__me {
  position: absolute;
  top: 0;
  left: 0;
  transition: transform 0.7s cubic-bezier(0.45, 0, 0.25, 1);
}

.guide__me-float {
  display: block;
  animation: guide-float 2.4s ease-in-out infinite;
  filter: drop-shadow(0 6px 4px rgba(30, 26, 36, 0.35));
}

/* the text bar: the same size, the same place, on every step */
.guide__bubble {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 14px 10px;
  overflow: hidden;
  pointer-events: auto;
  border-top: 3px solid var(--sign-outline, #2b2133);
  background: var(--px-paper, #f9f3e6);
  box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.6), 0 -4px 0 rgba(43, 33, 51, 0.3);
}

.guide__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.guide__count {
  margin: 0;
  font-family: var(--sign-font, inherit);
  font-size: 11px;
  color: var(--rl-muted);
}

.guide__skips {
  display: flex;
  gap: 4px;
}

.guide__skips .btn {
  --bs-btn-padding-x: 6px;
  font-size: 0.78rem;
}

.guide__say {
  flex: 1 1 auto;
  min-height: 0;
  margin: 0;
  overflow: hidden;
  font-size: 0.92rem;
  line-height: 1.35;
  color: var(--rl-text);
}

.guide__ask {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--rl-primary, #6b4a34);
}

.guide__dots {
  display: flex;
  gap: 6px;
}

.guide__dots i {
  width: 8px;
  height: 8px;
  background: var(--rl-line);
}

.guide__dots i.is-on {
  background: var(--rl-primary, #6b4a34);
}

.guide__actions {
  display: flex;
  gap: 8px;
}

/* how far along the section they have slid */
.guide__meter {
  height: 10px;
  border: 2px solid var(--sign-outline, #2b2133);
  background: var(--px-paper-shade, #e6dccb);
}

.guide__meter i {
  display: block;
  height: 100%;
  background: #3b7330;
}

/* the pointing hand: its fingertip is on the spot, and it loops */
.guide__hand {
  position: absolute;
  width: 0;
  height: 0;
}

.guide__hand-art {
  position: absolute;
  left: -19px;
  top: -2px;
  filter: drop-shadow(0 3px 0 rgba(43, 33, 51, 0.35));
  animation: hand-tap 2.6s ease-in-out infinite;
}

.guide__ripple {
  position: absolute;
  left: -20px;
  top: -20px;
  width: 40px;
  height: 40px;
  border: 3px solid var(--sign-outline, #2b2133);
  border-radius: 50%;
  box-shadow: 0 0 0 2px #fffdf9 inset;
  opacity: 0;
  animation: hand-ripple 2.6s ease-out infinite;
}

.guide__hand.is-slide .guide__hand-art {
  animation: hand-slide 2.8s ease-in-out infinite;
}

.guide__hand.is-drag .guide__hand-art {
  animation: hand-drag 3s ease-in-out infinite;
}

.guide__hand.is-slide .guide__ripple,
.guide__hand.is-drag .guide__ripple {
  display: none;
}

@keyframes hand-tap {
  0% { transform: translate(34px, 44px) scale(1); opacity: 0; }
  18% { opacity: 1; }
  38% { transform: translate(0, 0) scale(1); }
  47% { transform: translate(0, 3px) scale(0.86); }
  57% { transform: translate(0, 0) scale(1); }
  85% { opacity: 1; }
  100% { transform: translate(0, 0) scale(1); opacity: 0; }
}

@keyframes hand-ripple {
  0%, 44% { transform: scale(0.3); opacity: 0; }
  50% { opacity: 0.9; }
  85%, 100% { transform: scale(1.7); opacity: 0; }
}

@keyframes hand-slide {
  0% { transform: translate(calc(var(--span) * -0.5), 8px) scale(1); opacity: 0; }
  12% { transform: translate(calc(var(--span) * -0.5), 8px) scale(0.88); opacity: 1; }
  78% { transform: translate(calc(var(--span) * 0.5), 8px) scale(0.88); opacity: 1; }
  92%, 100% { transform: translate(calc(var(--span) * 0.5), 8px) scale(0.88); opacity: 0; }
}

@keyframes hand-drag {
  0% { transform: translate(0, 0) scale(1); opacity: 0; }
  14% { transform: translate(0, 0) scale(0.88); opacity: 1; }
  72% { transform: translate(var(--dx), var(--dy)) scale(0.88); opacity: 1; }
  90%, 100% { transform: translate(var(--dx), var(--dy)) scale(0.88); opacity: 0; }
}

@keyframes guide-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@media (prefers-reduced-motion: reduce) {
  .guide__me {
    transition: none;
  }

  .guide__me-float,
  .guide__hand-art,
  .guide__hand.is-slide .guide__hand-art,
  .guide__hand.is-drag .guide__hand-art,
  .guide__ripple {
    animation: none;
  }

  .guide__ripple {
    display: none;
  }
}
</style>
