<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The Phaser canvas with the town on it, plus its follow-me and zoom buttons and loading / error
// states. It says which building was tapped (select), which friend out walking was tapped
// (select-friend), when your character has walked inside one (inside) and when a tap on the ground
// has sent them walking (walk); the parent says which one to glide to (focus), which one to walk into (enter),
// what you look like (character) and what the weather is (sky).
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Phaser from 'phaser'
import TownScene from '@/town/TownScene.js'

const props = defineProps({
  // { id, key, tour }: glide to that building. A new key repeats the same building.
  focus: { type: Object, default: null },
  // a place id to open on, framed as the first tour frames it (a new reader arriving)
  start: { type: String, default: '' },
  // the id of the place you just left: you start outside its door
  comingFrom: { type: String, default: '' },
  // whether a tap on the ground walks your character there
  canWalk: { type: Boolean, default: true },
  // { id, key }: walk your character to that building and in through its door
  enter: { type: Object, default: null },
  // the reader's saved character (see lib/avatar/catalogue.js)
  character: { type: Object, default: null },
  // friends' presence, [{ id: reader id, online, upkeep, character, house }] (see town/friends.js)
  friends: { type: Array, default: () => [] },
  // readers near you, [{ id: reader id, displayName, character, online }]
  nearby: { type: Array, default: () => [] },
  // { id, key }: glide to that friend out walking. A new key repeats the same friend.
  focusFriend: { type: Object, default: null },
  // the friend whose card is open; null lets them walk on
  friendId: { type: String, default: null },
  // the building whose card is open; null clears its outline
  selectedId: { type: String, default: null },
  // how the town looks: { night, rain }
  sky: { type: Object, default: () => ({ night: false, rain: false }) },
})
const emit = defineEmits(['select', 'select-friend', 'ready', 'inside', 'walk'])

const host = ref(null)
// the names over houses and walkers, as page text over the canvas (town/labels.js)
const labels = ref(null)
const state = ref('loading') // loading | ready | error
// whether the camera keeps your character in the middle of the screen
const following = ref(false)
// where the tour's building is on screen, { id, x, y, w, h }: an empty box the tour card measures
const spot = ref(null)
const spotStyle = computed(() =>
  spot.value
    ? { left: `${spot.value.x}px`, top: `${spot.value.y}px`, width: `${spot.value.w}px`, height: `${spot.value.h}px` }
    : null,
)
let game = null
let scene = null

const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

function zoom(factor) {
  if (state.value === 'ready') scene.zoomBy(factor)
}

function toggleFollow() {
  if (state.value !== 'ready') return
  following.value = !following.value
  scene.follow(following.value)
}

watch(
  () => props.focus,
  (request) => {
    spot.value = null
    if (request && state.value === 'ready') scene.focusPlace(request.id, { tour: request.tour })
  },
)

watch(
  () => props.enter,
  (request) => {
    if (request && state.value === 'ready') scene.goInto(request.id)
  },
)

watch(
  () => props.focusFriend,
  (request) => {
    if (request && state.value === 'ready') scene.focusFriend(request.id)
  },
)

watch(
  () => props.friendId,
  (id) => {
    if (!id && state.value === 'ready') scene.releaseFriend()
  },
)

watch(
  () => props.friends,
  (friends) => scene?.setFriends(friends),
)

watch(
  () => props.nearby,
  (readers) => scene?.setNearby(readers),
)

watch(
  () => props.character,
  (character) => scene?.setCharacter(character),
)

watch(
  () => props.selectedId,
  (id) => {
    if (!id && state.value === 'ready') scene.outline(null)
  },
)

watch(
  () => props.sky,
  (sky) => scene?.setSky(sky),
)

watch(
  () => props.canWalk,
  (on) => scene?.setCanWalk(on),
)

onMounted(() => {
  scene = new TownScene({
    reducedMotion,
    labelLayer: labels.value,
    character: props.character,
    start: props.start,
    comingFrom: props.comingFrom,
    onWalk: () => emit('walk'),
    onTourSpot: (box) => {
      spot.value = box
    },
    onSelect: (place) => emit('select', place),
    onFollow: (on) => {
      following.value = on
    },
    onInside: (place) => emit('inside', place),
    onSelectFriend: (id) => emit('select-friend', id),
    onReady: () => {
      state.value = 'ready'
      emit('ready')
    },
    onError: () => {
      state.value = 'error'
    },
  })
  // the map is a canvas with nothing to label, so the e2e tests read where everyone is from here
  if (import.meta.env.DEV) window.__townScene = scene
  scene.setCanWalk(props.canWalk)
  scene.setSky(props.sky)
  scene.setFriends(props.friends)
  scene.setNearby(props.nearby)
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
  if (import.meta.env.DEV) delete window.__townScene
  game?.destroy(true)
  game = null
  scene = null
})
</script>

<template>
  <div class="town-map">
    <div ref="host" class="town-map__canvas" aria-hidden="true"></div>
    <div ref="labels" class="town-map__labels" :class="{ 'is-still': reducedMotion }" aria-hidden="true"></div>
    <div v-if="spot" class="town-map__spot" :data-tour-spot="spot.id" :data-tour-mask="`/town/buildings/${spot.art}.png`" :style="spotStyle" aria-hidden="true"></div>
    <p v-if="state === 'loading'" class="town-map__state">Loading the town…</p>
    <p v-else-if="state === 'error'" class="town-map__state" role="alert">
      The town map could not load. Check your connection and refresh, or use Places to go straight to a building.
    </p>
    <div v-if="state === 'ready'" class="town-map__zoom" data-tour="town-zoom">
      <button
        type="button"
        class="btn btn-chip btn-icon px-sign town-map__follow"
        :class="{ 'is-on': following }"
        aria-label="Follow my character"
        :aria-pressed="following"
        @click="toggleFollow"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="6" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          <circle class="town-map__follow-dot" cx="12" cy="12" r="1.6" />
        </svg>
      </button>
      <button type="button" class="btn btn-secondary btn-icon px-sign town-map__round" aria-label="Zoom in" @click="zoom(1.25)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      </button>
      <button type="button" class="btn btn-secondary btn-icon px-sign town-map__round" aria-label="Zoom out" @click="zoom(0.8)">
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

.town-map__labels {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  --z: 1;
}

/* One name: its middle sits on the point the scene gives (labels.js). Sizes are map pixels times
   the camera's zoom, and set as font sizes rather than scaled, so the text is drawn sharp. */
.town-map__labels :deep(.town-label) {
  position: absolute;
  top: 0;
  left: 0;
}

.town-map__labels :deep(.town-label--house) {
  z-index: 1;
}

.town-map__labels :deep(.town-label__pill) {
  display: flex;
  align-items: center;
  gap: calc(6px * var(--z));
  height: calc(var(--height) * 1px * var(--z));
  padding: 0 calc(var(--pad) * 1px * var(--z));
  border: calc(var(--border) * 1px * var(--z)) solid var(--accent);
  border-radius: 999px;
  background: rgb(255 253 249 / 96%);
  color: #3f2e24;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: calc(var(--font) * 1px * var(--z));
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  transform: translate(-50%, -50%);
}

.town-map__labels :deep(.town-label__dot) {
  display: none;
  flex: none;
  width: calc(var(--dot) * 1px * var(--z));
  height: calc(var(--dot) * 1px * var(--z));
  border-radius: 50%;
  background: #3fae5a;
}

.town-map__labels :deep(.is-online .town-label__dot) {
  display: block;
}

/* a house's name bobs gently over its roof */
.town-map__labels :deep(.town-label--house .town-label__pill) {
  animation: town-label-bob 1.4s ease-in-out infinite alternate;
}

.town-map__labels.is-still :deep(.town-label__pill) {
  animation: none;
}

@keyframes town-label-bob {
  to {
    transform: translate(-50%, calc(-50% - 8px * var(--z)));
  }
}

@media (prefers-reduced-motion: reduce) {
  .town-map__labels :deep(.town-label__pill) {
    animation: none;
  }
}

.town-map__spot {
  position: absolute;
  pointer-events: none;
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
  right: 17px;
  bottom: 30px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.town-map__round svg,
.town-map__follow svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
}

.town-map__follow {
  margin-bottom: 6px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.town-map__follow-dot {
  fill: currentColor;
  stroke: none;
}

</style>
