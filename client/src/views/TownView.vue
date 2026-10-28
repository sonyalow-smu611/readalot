<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Home after signing in: the town. This view only holds the state and wires the town's parts
// together; each building opens one teammate's page (see src/buildings/), and each friend's
// house opens that reader's room. The sky follows the live weather unless a preview is chosen.
// Going in, your character walks to the door first, and the page zooms through it.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ALL_PLACES, FRIEND_HOUSES } from '@/town/places.js'
import { getFriends, presence } from '@/town/friends.js'
import { useUserStore } from '@/stores/user'
import { fetchWeather } from '@/services/weather.js'
import TownMap from '@/components/town/TownMap.vue'
import TownHud from '@/components/town/TownHud.vue'
import PlacesMenu from '@/components/town/PlacesMenu.vue'
import PlaceCard from '@/components/town/PlaceCard.vue'
import WeatherButton from '@/components/town/WeatherButton.vue'
import FriendsList from '@/components/town/FriendsList.vue'
import FriendCard from '@/components/town/FriendCard.vue'
import ChatDock from '@/components/town/ChatDock.vue'

const WEATHER_EVERY = 10 * 60 * 1000

const router = useRouter()
const user = useUserStore()
const { profile, guide } = storeToRefs(user)

const ready = ref(false)
// a new reader straight from Welcome: the map opens on their house, where the tour begins
const arrivingForTour = user.tourPending
const selected = ref(null)
const placesOpen = ref(false)
const friendsOpen = ref(false)
const friends = ref([])
// the friend out walking whose card is open, and the request to glide to one
const friendId = ref(null)
const friendFocus = ref(null)
// friends you've said hi to (ids, newest first), each with a box by the zoom buttons, and the
// one whose mini chat is open
const chatIds = ref([])
const openChat = ref(null)
const focus = ref(null)
// the place your character is walking into, and the request that sends them
const entering = ref(null)
const walk = ref(null)
const hint = ref(true)
const weather = ref(null)
const skyMode = ref('live')
let weatherTimer = null

const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
const walkingTo = computed(() => {
  const place = entering.value
  if (!place) return ''
  return place.id === 'house' ? 'Walking home…' : `Walking to ${place.name}…`
})

const sky = computed(() => {
  const mode = skyMode.value
  if (mode === 'live') {
    const w = weather.value
    return { night: Boolean(w && !w.unavailable && !w.isDay), rain: w?.scene === 'rain' }
  }
  return { night: mode === 'night' || mode === 'rainyNight', rain: mode === 'rain' || mode === 'rainyNight' }
})

// Each friend with whether they are online, how kept their house is, and which house is theirs.
const friendsInTown = computed(() => {
  const now = Date.now()
  return friends.value.map((friend) => ({
    ...friend,
    ...presence(friend.lastSeenAt, now),
    house: FRIEND_HOUSES.find((place) => place.reader === friend.id)?.id ?? null,
  }))
})
const onlineCount = computed(() => friendsInTown.value.filter((friend) => friend.online).length)
const chats = computed(() => chatIds.value.map((id) => friendsInTown.value.find((friend) => friend.id === id)).filter(Boolean))
const selectedFriend = computed(() => friendsInTown.value.find((friend) => friend.id === friendId.value) ?? null)
const selectedFriendHouse = computed(() => FRIEND_HOUSES.find((place) => place.id === selectedFriend.value?.house) ?? null)
const selectedPresence = computed(() => {
  const reader = selected.value?.reader
  return reader ? (friendsInTown.value.find((friend) => friend.id === reader) ?? null) : null
})

async function loadFriends() {
  try {
    friends.value = await getFriends()
  } catch {
    // the houses still work without presence: no dots, no aged looks
    friends.value = []
  }
}

async function loadWeather() {
  try {
    weather.value = await fetchWeather()
  } catch {
    // fetchWeather already falls back; keep whatever sky we had
  }
}

onMounted(() => {
  loadFriends()
  loadWeather()
  weatherTimer = setInterval(loadWeather, WEATHER_EVERY)
})

onBeforeUnmount(() => clearInterval(weatherTimer))

// The first-time tour flies the camera to the building it is talking about.
watch(
  () => (ready.value ? guide.value?.focus : null),
  (id) => {
    if (id) go(id, { tour: true })
  },
  { immediate: true },
)

function select(place) {
  // during the tour the camera's glide outlines the building; its card would cover the tour's
  if (guide.value || entering.value) return
  friendId.value = null
  selected.value = place
  placesOpen.value = false
  friendsOpen.value = false
  hint.value = false
}

// one panel open at a time: Places or Friends
function togglePlaces() {
  placesOpen.value = !placesOpen.value
  if (placesOpen.value) friendsOpen.value = false
  hint.value = false
}

function toggleFriends() {
  friendsOpen.value = !friendsOpen.value
  if (friendsOpen.value) placesOpen.value = false
  hint.value = false
}

function go(id, { tour = false } = {}) {
  if (entering.value) return
  focus.value = { id, key: Date.now(), tour }
}

// A friend tapped on the map (or found from the friends list): their card opens.
function selectFriend(id) {
  if (guide.value || entering.value) return
  selected.value = null
  placesOpen.value = false
  friendsOpen.value = false
  hint.value = false
  friendId.value = id
}

// From the friends list: to them where they're walking, or to their house if they're in.
function findFriend(friend) {
  if (entering.value) return
  if (friend.online) friendFocus.value = { id: friend.id, key: Date.now() }
  else if (friend.house) go(friend.house)
}

// Say hi: their box joins the dock and the chat opens, with everything you've said before.
function sayHi(friend) {
  friendId.value = null
  chatIds.value = [friend.id, ...chatIds.value.filter((id) => id !== friend.id)]
  openChat.value = friend.id
}

function toggleChat(id) {
  openChat.value = openChat.value === id ? null : id
}

function closeChat(id) {
  chatIds.value = chatIds.value.filter((chat) => chat !== id)
  if (openChat.value === id) openChat.value = null
}

function visitFriend(house) {
  friendId.value = null
  enter(house)
}

// Your character walks over first; the map says when they are through the door (goInside).
function enter(place) {
  // no map (it could not load): straight in
  if (!ready.value) {
    goInside(place)
    return
  }
  selected.value = null
  friendId.value = null
  openChat.value = null
  placesOpen.value = false
  friendsOpen.value = false
  hint.value = false
  entering.value = place
  walk.value = { id: place.id, key: Date.now() }
}

// The town zooms in through the door and the building's page zooms out to meet you, where the
// browser can animate between pages; elsewhere the page just opens.
function goInside(place) {
  const root = document.documentElement
  if (reducedMotion || !document.startViewTransition) {
    router.push(place.route)
    return
  }
  root.classList.add('town-entering')
  const transition = document.startViewTransition(async () => {
    await router.push(place.route)
    await nextTick()
  })
  transition.finished.finally(() => root.classList.remove('town-entering'))
}
</script>

<template>
  <section class="town" aria-label="Readalot Town">
    <TownMap
      :focus="focus"
      :start="arrivingForTour ? 'house' : ''"
      :enter="walk"
      :character="profile.character"
      :friends="friendsInTown"
      :focus-friend="friendFocus"
      :friend-id="friendId"
      :selected-id="selected?.id ?? null"
      :sky="sky"
      @select="select"
      @select-friend="selectFriend"
      @inside="goInside"
      @ready="ready = true"
    />
    <TownHud
      :name="profile.name || 'You'"
      :avatar="profile.avatar"
      :places-open="placesOpen"
      :friends-online="onlineCount"
      :friends-open="friendsOpen"
      @toggle-places="togglePlaces"
      @toggle-friends="toggleFriends"
    />
    <PlacesMenu :places="ALL_PLACES" :open="placesOpen" @go="go" />
    <FriendsList :friends="friendsInTown" :open="friendsOpen" @go="findFriend" />
    <WeatherButton v-if="ready" :mode="skyMode" :weather="weather" @change="skyMode = $event" />

    <Transition name="town-fade">
      <p v-if="hint && ready && !selected && !friendId && !entering && !guide" class="town__hint">Drag to look around. Tap a building to go in.</p>
    </Transition>
    <Transition name="town-fade">
      <p v-if="entering" class="town__hint" role="status">{{ walkingTo }}</p>
    </Transition>

    <Transition name="town-card">
      <PlaceCard
        v-if="selected"
        :key="selected.id"
        :place="selected"
        :presence="selectedPresence"
        @enter="enter"
        @close="selected = null"
      />
    </Transition>

    <Transition name="town-card">
      <FriendCard
        v-if="selectedFriend"
        :key="selectedFriend.id"
        :friend="selectedFriend"
        :house="selectedFriendHouse"
        @talk="sayHi"
        @visit="visitFriend"
        @close="friendId = null"
      />
    </Transition>

    <ChatDock v-if="ready && chats.length" :chats="chats" :open="openChat" @toggle="toggleChat" @close="closeChat" />
  </section>
</template>

<style scoped>
.town {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: #6fb14b;
  touch-action: none;
}

.town__hint {
  position: absolute;
  left: 50%;
  top: 72px;
  z-index: 4;
  margin: 0;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(65, 72, 51, 0.88);
  color: var(--rl-surface);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  transform: translateX(-50%);
  pointer-events: none;
}

.town-card-enter-active,
.town-card-leave-active,
.town-fade-enter-active,
.town-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.town-card-enter-from,
.town-card-leave-to {
  opacity: 0;
  transform: translateY(24px);
}

.town-fade-enter-from,
.town-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .town-card-enter-active,
  .town-card-leave-active,
  .town-fade-enter-active,
  .town-fade-leave-active {
    transition: none;
  }
}
</style>

<style>
/* Going into a building: the town zooms in and fades, then the building's page zooms out into
   place. Only while TownView has marked the page (see goInside). */
@keyframes town-zoom-in {
  to {
    opacity: 0;
    transform: scale(1.8);
  }
}

@keyframes town-zoom-out {
  from {
    opacity: 0;
    transform: scale(1.2);
  }
}

html.town-entering::view-transition-old(root) {
  animation: town-zoom-in 0.4s cubic-bezier(0.5, 0, 0.75, 0) both;
}

html.town-entering::view-transition-new(root) {
  animation: town-zoom-out 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s both;
}
</style>
