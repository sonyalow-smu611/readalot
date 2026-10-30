<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Home after signing in: the town. This view only holds the state and wires the town's parts
// together; each building opens one teammate's page (see src/buildings/), and each friend's
// house opens that reader's room. The sky follows the live weather unless a preview is chosen.
// Going in, your character walks to the door first, and the page zooms through it. The day's
// tasks open by themselves on the first visit each day (not during the first tour). After the
// tour the reader chooses public or private once, and the town refreshes who is near them.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { FRIEND_HOUSES, PLACES } from '@/town/places.js'
import { presence } from '@/town/friends.js'
import { useUserStore } from '@/stores/user'
import { useProgressStore } from '@/stores/progress.js'
import { useDailyStore } from '@/town/dailyStore.js'
import { useNearbyStore } from '@/town/nearbyStore.js'
import { MAX_FREEZES } from '@/town/daily.js'
import { fetchWeather } from '@/services/weather.js'
import TownMap from '@/components/town/TownMap.vue'
import TownHud from '@/components/town/TownHud.vue'
import PlacesMenu from '@/components/town/PlacesMenu.vue'
import PlaceCard from '@/components/town/PlaceCard.vue'
import WeatherButton from '@/components/town/WeatherButton.vue'
import PlayerBadge from '@/components/town/PlayerBadge.vue'
import FriendsList from '@/components/town/FriendsList.vue'
import FriendCard from '@/components/town/FriendCard.vue'
import ChatDock from '@/components/town/ChatDock.vue'
import DailyButton from '@/components/town/DailyButton.vue'
import DailyPanel from '@/components/town/DailyPanel.vue'
import DailyReward from '@/components/town/DailyReward.vue'
import LocationChip from '@/components/town/LocationChip.vue'
import LocationPrompt from '@/components/town/LocationPrompt.vue'

const WEATHER_EVERY = 10 * 60 * 1000
const NEARBY_EVERY = 30 * 1000
const NOTICE_FOR = 5000
const PREVIEW_DAYS = import.meta.env.DEV

const router = useRouter()
const user = useUserStore()
const progress = useProgressStore()
const daily = useDailyStore()
const nearby = useNearbyStore()
const { profile, guide } = storeToRefs(user)

const ready = ref(false)
// a new reader straight from Welcome: the map opens on their house, where the tour begins
const arrivingForTour = user.tourPending
const selected = ref(null)
const placesOpen = ref(false)
const friendsOpen = ref(false)
const dailyOpen = ref(false)
// the reward just claimed, shown over the town until "Nice!"
const gift = ref(null)
const dailyChip = computed(() => ({
  streak: daily.streak,
  done: daily.doneCount,
  total: daily.tasks.length,
  ready: daily.canClaim,
  claimed: daily.claimed,
}))
// every place you can go, the friends' houses named after whoever lives there
const allPlaces = computed(() => [...PLACES, ...nearby.houses])
// going public or private: in progress, and why it didn't work
const privacyBusy = ref(false)
const promptError = ref('')
// a short message over the map, e.g. a friend request that didn't send
const notice = ref('')
let noticeTimer = null
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
let nearbyTimer = null

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
  return nearby.friends.map((friend) => ({
    ...friend,
    ...presence(friend.lastSeenAt, now),
    house: FRIEND_HOUSES[friend.spot]?.id ?? null,
  }))
})
const nearbyInTown = computed(() => {
  const now = Date.now()
  return nearby.nearby.map((reader) => ({ ...reader, ...presence(reader.lastSeenAt, now) }))
})
const onlineCount = computed(() => friendsInTown.value.filter((friend) => friend.online).length)
const chats = computed(() => chatIds.value.map((id) => friendsInTown.value.find((friend) => friend.id === id)).filter(Boolean))
const selectedFriend = computed(() => friendsInTown.value.find((friend) => friend.id === friendId.value) ?? null)
const selectedNearby = computed(() => nearbyInTown.value.find((reader) => reader.id === friendId.value) ?? null)
const selectedFriendHouse = computed(() => nearby.houses.find((place) => place.id === selectedFriend.value?.house) ?? null)
const selectedPresence = computed(() => {
  const reader = selected.value?.reader
  return reader ? (friendsInTown.value.find((friend) => friend.id === reader) ?? null) : null
})
// the one-time question: not during the tour, and never for an under-18
const askPublic = computed(
  () => ready.value && !guide.value && user.profileComplete && !user.tourPending && !profile.value.locationAsked && !nearby.minor,
)

function showNotice(message) {
  clearTimeout(noticeTimer)
  notice.value = message
  noticeTimer = setTimeout(() => (notice.value = ''), NOTICE_FOR)
}

// Runs every NEARBY_EVERY while this page is open, and pauses while the tab is hidden.
async function refreshNearby() {
  if (document.hidden) return
  try {
    await nearby.refresh()
  } catch {
    // the town still works without it: everyone stays as they were until the next refresh
  }
}

async function choosePublic(on) {
  privacyBusy.value = true
  promptError.value = ''
  try {
    await nearby.setPublic(on)
  } catch (err) {
    promptError.value = err.message
    if (!askPublic.value) showNotice(err.message)
  } finally {
    privacyBusy.value = false
  }
}

async function addFriend(reader) {
  try {
    await nearby.addFriend(reader.id)
  } catch (err) {
    showNotice(err.message)
  }
}

async function answerRequest(requestId, accept) {
  try {
    await nearby.answer(requestId, accept)
  } catch (err) {
    showNotice(err.message)
  }
}

async function removeFriend(friend) {
  friendId.value = null
  closeChat(friend.id)
  try {
    await nearby.removeFriend(friend.id)
  } catch (err) {
    showNotice(err.message)
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
  refreshNearby()
  loadWeather()
  weatherTimer = setInterval(loadWeather, WEATHER_EVERY)
  nearbyTimer = setInterval(refreshNearby, NEARBY_EVERY)
})

onBeforeUnmount(() => {
  clearInterval(weatherTimer)
  clearInterval(nearbyTimer)
  clearTimeout(noticeTimer)
})

// Being in town ticks off today's check-in (and moves the day on if midnight has passed).
watch(
  () => profile.value.id,
  (id) => {
    daily.start(id)
    daily.checkIn()
  },
  { immediate: true },
)

// The first visit each day opens the tasks, once the map is up and any tour and the public or
// private question are over.
watch(
  () => ready.value && !guide.value && !askPublic.value && daily.shouldShow,
  (show) => {
    if (!show) return
    daily.markShown()
    openDaily()
  },
  { immediate: true },
)

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
  // the map hands over the bare place; the card wants it named
  selected.value = allPlaces.value.find((named) => named.id === place.id) ?? place
  placesOpen.value = false
  friendsOpen.value = false
  dailyOpen.value = false
  hint.value = false
}

// one panel open at a time: Daily, Places or Friends
function togglePlaces() {
  placesOpen.value = !placesOpen.value
  if (placesOpen.value) friendsOpen.value = dailyOpen.value = false
  hint.value = false
}

function toggleFriends() {
  friendsOpen.value = !friendsOpen.value
  if (friendsOpen.value) placesOpen.value = dailyOpen.value = false
  hint.value = false
}

function toggleDaily() {
  if (dailyOpen.value) dailyOpen.value = false
  else openDaily()
}

function openDaily() {
  daily.start(profile.value.id)
  dailyOpen.value = true
  placesOpen.value = friendsOpen.value = false
  selected.value = null
  friendId.value = null
  hint.value = false
}

// A task's Go: the map glides to the building and its card opens.
function goDo(placeId) {
  dailyOpen.value = false
  go(placeId)
}

function claimDaily() {
  const claimed = daily.claim()
  if (!claimed) return
  dailyOpen.value = false
  gift.value = claimed
}

function closeGift() {
  daily.collect(gift.value)
  gift.value = null
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
  dailyOpen.value = false
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
  dailyOpen.value = false
  hint.value = false
  entering.value = place
  walk.value = { id: place.id, key: Date.now() }
}

// The town zooms in through the door and the building's page zooms out to meet you, where the
// browser can animate between pages; elsewhere the page just opens.
function goInside(place) {
  // the map hands over the bare place; a friend's house gets its route from who lives there
  const { route } = allPlaces.value.find((named) => named.id === place.id) ?? place
  const root = document.documentElement
  if (reducedMotion || !document.startViewTransition) {
    router.push(route)
    return
  }
  root.classList.add('town-entering')
  const transition = document.startViewTransition(async () => {
    await router.push(route)
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
      :nearby="nearbyInTown"
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
      :places-open="placesOpen"
      :friends-online="onlineCount"
      :friend-requests="nearby.incoming.length"
      :friends-open="friendsOpen"
      @toggle-places="togglePlaces"
      @toggle-friends="toggleFriends"
    />
    <!-- today's tasks and the streak, on the left under the weather chip -->
    <DailyButton class="town__daily" v-bind="dailyChip" :open="dailyOpen" @toggle="toggleDaily" />
    <LocationChip
      class="town__location"
      :on="profile.discoverable"
      :busy="privacyBusy"
      :locked="nearby.minor"
      @toggle="choosePublic(!profile.discoverable)"
    />
    <PlacesMenu :places="allPlaces" :open="placesOpen" @go="go" />
    <FriendsList
      :friends="friendsInTown"
      :requests="nearby.incoming"
      :nearby="nearbyInTown"
      :open="friendsOpen"
      @go="findFriend"
      @go-nearby="friendFocus = { id: $event.id, key: Date.now() }"
      @answer="answerRequest"
    />
    <Transition name="town-fade">
      <DailyPanel
        v-if="dailyOpen"
        :tasks="daily.tasks"
        :streak="daily.streak"
        :freezes="daily.freezes"
        :max-freezes="MAX_FREEZES"
        :week="daily.week"
        :reward="daily.reward"
        :can-claim="daily.canClaim"
        :claimed="daily.claimed"
        :notice="daily.notice"
        :preview="PREVIEW_DAYS"
        @go="goDo"
        @claim="claimDaily"
        @dismiss-notice="daily.dismissNotice"
        @preview-days="daily.previewDays"
        @preview-reset="daily.previewReset"
      />
    </Transition>
    <WeatherButton v-if="ready" :mode="skyMode" :weather="weather" @change="skyMode = $event" />
    <!-- you, in the bottom-left corner: level, XP and coins; opens the salon -->
    <PlayerBadge
      class="town__me"
      :name="profile.name || 'You'"
      :character="profile.character"
      :level="progress.level"
      :coins="progress.coins"
      :gain="progress.lastGain"
      :level-ups="progress.levelUps"
    />

    <Transition name="town-fade">
      <p v-if="hint && ready && !selected && !friendId && !entering && !guide" class="town__hint">Drag to look around. Tap a building to go in.</p>
    </Transition>
    <Transition name="town-fade">
      <p v-if="entering" class="town__hint" role="status">{{ walkingTo }}</p>
    </Transition>
    <Transition name="town-fade">
      <p v-if="notice" class="town__hint town__notice" role="status">{{ notice }}</p>
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
        @remove="removeFriend"
        @close="friendId = null"
      />
    </Transition>

    <Transition name="town-card">
      <FriendCard
        v-if="selectedNearby"
        :key="selectedNearby.id"
        :friend="selectedNearby"
        :requested="selectedNearby.requested"
        nearby
        @add="addFriend"
        @profile="router.push({ name: 'reader-room', params: { id: $event.id } })"
        @close="friendId = null"
      />
    </Transition>

    <ChatDock v-if="ready && chats.length" :chats="chats" :open="openChat" @toggle="toggleChat" @close="closeChat" />

    <DailyReward v-if="gift" :reward="gift" @close="closeGift" />

    <LocationPrompt v-if="askPublic" :busy="privacyBusy" :error="promptError" @choose="choosePublic" />
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

/* Daily, under the weather chip */
.town .town__daily {
  position: absolute;
  left: 14px;
  top: 72px;
  z-index: 10;
}

/* public or private, under Daily */
.town .town__location {
  position: absolute;
  left: 14px;
  top: 128px;
  z-index: 10;
}

/* your badge, bottom left (the weather chip has the top-left corner) */
.town .town__me {
  position: absolute;
  left: 14px;
  bottom: 24px;
  z-index: 5;
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

/* long enough to need wrapping, under the top bar */
.town__notice {
  top: 118px;
  z-index: 12;
  width: min(320px, calc(100% - 28px));
  border-radius: 12px;
  text-align: center;
  white-space: normal;
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
