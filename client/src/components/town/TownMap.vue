<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The Phaser canvas with the town on it, plus its follow-me and zoom buttons and loading / error
// states. It says which building was tapped (select), which friend out walking was tapped
// (select-friend) and when your character has walked inside one (inside); the parent says which one to glide to (focus), which one to walk into (enter),
// what you look like (character) and what the weather is (sky).
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Phaser from 'phaser'
import TownScene from '@/town/TownScene.js'

const props = defineProps({
  // { id, key }: glide to that building. A new key repeats the same building.
  focus: { type: Object, default: null },
  // { id, key }: walk your character to that building and in through its door
  enter: { type: Object, default: null },
  // the reader's saved character (see lib/avatar/catalogue.js)
  character: { type: Object, default: null },
  // friends' presence, [{ id: reader id, online, upkeep, character }] (see town/friends.js)
  friends: { type: Array, default: () => [] },
  // { id, key }: glide to that friend out walking. A new key repeats the same friend.
  focusFriend: { type: Object, default: null },
  // the friend whose card is open; null lets them walk on
  friendId: { type: String, default: null },
  // the building whose card is open; null clears its outline
  selectedId: { type: String, default: null },
  // how the town looks: { night, rain }
  sky: { type: Object, default: () => ({ night: false, rain: false }) },
})
const emit = defineEmits(['select', 'select-friend', 'ready', 'inside'])

const host = ref(null)
const state = ref('loading') // loading | ready | error
// whether the camera keeps your character in the middle of the screen
const following = ref(false)
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
    if (request && state.value === 'ready') scene.focusPlace(request.id)
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

onMounted(() => {
  scene = new TownScene({
    reducedMotion,
    character: props.character,
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
  scene.setSky(props.sky)
  scene.setFriends(props.friends)
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
      <button
        type="button"
        class="town-map__round town-map__follow"
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

.town-map__follow {
  margin-bottom: 6px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.town-map__follow-dot {
  fill: currentColor;
  stroke: none;
}

.town-map__follow.is-on {
  border-color: #2f5fb3;
  background: #2f5fb3;
  color: var(--rl-surface);
}
</style>
