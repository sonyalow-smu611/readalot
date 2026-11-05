<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Home after signing in: the town. This view only holds the state and wires the town's parts
// together; each building opens one teammate's page (see src/buildings/), and each friend's
// house opens that reader's room. The sky follows the live weather unless a preview is chosen.
// Going in, your character walks to the door first, and the page zooms through it. The day's
// tasks open by themselves on the first visit each day (not during the first tour). After the
// tour the reader chooses public or private once, and the town refreshes who is near them.
// Coming back out of a place, your character stands outside its door. Each refresh also looks for
// anything new for the bell (town/notificationsStore.js), which pops up once.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { waitForTick } from '@/lib/loading.js'
import { storeToRefs } from 'pinia'
import { FRIEND_HOUSES, PLACES } from '@/town/places.js'
import { presence } from '@/town/friends.js'
import { useUserStore } from '@/stores/user'
import { useProgressStore } from '@/stores/progress.js'
import { useDailyStore } from '@/town/dailyStore.js'
import { useNearbyStore } from '@/town/nearbyStore.js'
import { useNotificationsStore } from '@/town/notificationsStore.js'
import { stashView, takeView } from '@/lib/returnState.js'
import { lastPlace, rememberPlace } from '@/town/lastPlace.js'
import { yourUsername } from '@/town/username.js'
import { MAX_FREEZES } from '@/town/daily.js'
import { fetchWeather } from '@/services/weather.js'
import TownMap from '@/components/town/TownMap.vue'
import TownHud from '@/components/town/TownHud.vue'
import PlacesMenu from '@/components/town/PlacesMenu.vue'
import PlaceCard from '@/components/town/PlaceCard.vue'
import WeatherChip from '@/components/town/WeatherChip.vue'
import PlayerBadge from '@/components/town/PlayerBadge.vue'
import FriendsList from '@/components/town/FriendsList.vue'
import CafeReaderCard from '@/buildings/cafe/components/CafeReaderCard.vue'
import ChatDock from '@/components/town/ChatDock.vue'
import DailyButton from '@/components/town/DailyButton.vue'
import MusicToggle from '@/components/MusicToggle.vue'
import TownMenu from '@/components/town/TownMenu.vue'
import { useMusicStore } from '@/stores/music.js'
import DailyPanel from '@/components/town/DailyPanel.vue'
import DailyReward from '@/components/town/DailyReward.vue'
import LocationChip from '@/components/town/LocationChip.vue'
import LocationPrompt from '@/components/town/LocationPrompt.vue'
import NotificationsPanel from '@/components/town/NotificationsPanel.vue'
import NotificationSlide from '@/components/town/NotificationSlide.vue'

const WEATHER_EVERY = 10 * 60 * 1000
const NEARBY_EVERY = 10 * 1000
const NOTICE_FOR = 5000
const PREVIEW_DAYS = import.meta.env.DEV

const router = useRouter()
const user = useUserStore()
const progress = useProgressStore()
const daily = useDailyStore()
const nearby = useNearbyStore()
const notifications = useNotificationsStore()
const { profile, guide } = storeToRefs(user)

const ready = ref(false)
// a new reader straight from Welcome: the map opens on their house, where the tour begins
const arrivingForTour = user.tourPending
// the place you've just come back out of, if any
const comingFrom = lastPlace()
const selected = ref(null)
const placesOpen = ref(false)
const friendsOpen = ref(false)
const dailyOpen = ref(false)
// a phone's ☰ menu (TownMenu): Daily, the bell, music and public or private, folded away
const menuOpen = ref(false)
const music = useMusicStore()
const notificationsOpen = ref(false)
// how the last Add friend went, { busy, ok, message }
const addStatus = ref(null)
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
let weatherTimer = null
let nearbyTimer = null

const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
const walkingTo = computed(() => {
  const place = entering.value
  if (!place) return ''
  return place.id === 'house' ? 'Walking home…' : `Walking to ${place.name}…`
})

// the town always follows the live weather
const sky = computed(() => {
  const w = weather.value
  return { night: Boolean(w && !w.unavailable && !w.isDay), rain: w?.scene === 'rain' }
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
// the reader on the map whose card is open (a friend out walking, or a reader near you)
const cardReader = computed(() => selectedFriend.value ?? selectedNearby.value)
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
    looked = true
    reopenCard()
    slideIn(await notifications.check())
  } catch {
    // the town still works without it: everyone stays as they were until the next refresh
  }
}

// A new notification slides in for a few seconds and fades away; it waits in the bell during the
// tour or on the way into a building. Several at once show the newest, with how many more.
const SLIDE_FOR = 5000
const slide = ref(null)
let slideTimer = null

function slideIn(fresh) {
  if (!fresh?.length || guide.value || entering.value || notificationsOpen.value) return
  const [newest] = [...fresh].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  slide.value = { ...newest, more: fresh.length - 1 }
  clearTimeout(slideTimer)
  slideTimer = setTimeout(() => (slide.value = null), SLIDE_FOR)
}

function hideSlide() {
  clearTimeout(slideTimer)
  slide.value = null
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

// The friend action on its way: { key, busy, failed }, keyed like `accept-<request id>`.
const action = ref(null)

// Runs a friend action: busy until it's saved, then its tick for a moment before the lists
// change (a request that's answered leaves the list, so the tick is seen first). A failure says
// why over the map. Returns whether it worked.
async function runAction(key, task) {
  action.value = { key, busy: true, failed: false }
  try {
    await task(async () => {
      action.value = { key, busy: false, failed: false }
      await waitForTick()
    })
    return true
  } catch (err) {
    action.value = { key, busy: false, failed: true }
    showNotice(err.message)
    return false
  }
}

// Add friend, by username: says how it went in the form.
async function addByUsername(username) {
  addStatus.value = { busy: true, ok: false, message: '' }
  try {
    const outcome = await nearby.addByUsername(username)
    const said = {
      you: ["That's your own username.", false],
      'already-friends': [`You're already friends with ${username}.`, false],
      'already-asked': [`You've already asked ${username}.`, false],
      friends: [`You and ${username} are now friends.`, true],
      asked: [`Friend request sent to ${username}.`, true],
    }[outcome]
    notifications.check().catch(() => {})
    addStatus.value = { busy: false, ok: said[1], message: said[0] }
  } catch (err) {
    const message = err.message === 'Reader not found' ? `Couldn't find ${username}. Check the spelling.` : err.message
    addStatus.value = { busy: false, ok: false, message }
  }
}

async function answerRequest(requestId, accept) {
  if (await runAction(`${accept ? 'accept' : 'decline'}-${requestId}`, (saved) => nearby.answer(requestId, accept, saved))) {
    notifications.rebuild()
  }
}

async function removeFriends(friends) {
  for (const { id } of friends) closeChat(id)
  await runAction('remove-several', (saved) => nearby.removeFriends(friends.map(({ id }) => id), saved))
}

async function loadWeather() {
  try {
    weather.value = await fetchWeather()
  } catch {
    // fetchWeather already falls back; keep whatever sky we had
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', shutChatOnOtherButtons, true)
  refreshNearby()
  loadWeather()
  weatherTimer = setInterval(loadWeather, WEATHER_EVERY)
  nearbyTimer = setInterval(refreshNearby, NEARBY_EVERY)
})

// Where you're off to, so you come back out of the same door. Listening here rather than when you
// walk in catches every way out of the town, like your badge's way into the salon.
onBeforeRouteLeave((to) => {
  const place = allPlaces.value.find(({ route }) => route.name === to.name && (!route.params || route.params.id === to.params.id))
  rememberPlace(place?.id ?? '')
  // off to a reader's room (or profile) from their card: the card opens again on the way back
  if (friendId.value && READER_PAGES.includes(to.name)) rememberCard(friendId.value)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', shutChatOnOtherButtons, true)
  topWatcher?.disconnect()
  clearTimeout(slideTimer)
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
    notifications.start(id)
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

// Whatever is open over the map.
function closePanels() {
  placesOpen.value = friendsOpen.value = dailyOpen.value = notificationsOpen.value = menuOpen.value = false
  hint.value = false
}

// Leaving the list is when what was in it counts as seen; the Add friend form starts afresh.
watch(notificationsOpen, (open) => {
  if (!open) notifications.markRead()
})
watch(friendsOpen, (open) => {
  if (!open) addStatus.value = null
  // opening the list looks for new requests straight away rather than at the next refresh
  else nearby.loadFriends().catch(() => {})
})

function select(place) {
  // during the walkthrough only the building it asks the reader to tap opens its card
  if (entering.value || (guide.value && !(guide.value.kind === 'try' && guide.value.focus === place.id))) return
  friendId.value = null
  // the map hands over the bare place; the card wants it named
  selected.value = allPlaces.value.find((named) => named.id === place.id) ?? place
  closePanels()
}

// A tap on the ground: you set off, and whatever was open is out of the way.
function walked() {
  selected.value = null
  friendId.value = null
  closePanels()
}

// one panel open at a time: Daily, Places, Friends or Notifications
function togglePlaces() {
  const open = !placesOpen.value
  closePanels()
  placesOpen.value = open
}

function toggleFriends() {
  const open = !friendsOpen.value
  closePanels()
  friendsOpen.value = open
}

// ---- the phone's ☰ menu: each row does what its button does
function toggleMenu() {
  const open = !menuOpen.value
  closePanels()
  menuOpen.value = open
}

// The walkthrough's step on the menu's rows (lib/walkthrough.js) needs it open, however the reader
// got there (Next after opening it, or Back from the step after); any other step shuts it.
watch(
  () => guide.value?.id,
  (id) => {
    if (id === 'town-menu-items') menuOpen.value = true
    else if (guide.value) menuOpen.value = false
  },
)

function menuDaily() {
  menuOpen.value = false
  toggleDaily()
}

function menuNotifications() {
  menuOpen.value = false
  toggleNotifications()
}

function toggleNotifications() {
  if (notificationsOpen.value) notificationsOpen.value = false
  else openNotifications()
}

function openNotifications() {
  hideSlide()
  closePanels()
  selected.value = null
  friendId.value = null
  notificationsOpen.value = true
}

// Goes to what the notification is about.
function openNotification(item) {
  hideSlide()
  notificationsOpen.value = false
  const friend = friendsInTown.value.find(({ id }) => id === (item.friendId ?? item.readerId))
  if (item.kind === 'request' || item.kind === 'sent') {
    closePanels()
    friendsOpen.value = true
  } else if (item.kind === 'message') {
    if (friend) sayHi(friend)
    else router.push({ name: 'reader-room', params: { id: item.readerId } })
  } else if (item.kind === 'accepted') {
    if (friend) findFriend(friend)
    else router.push({ name: 'reader-room', params: { id: item.readerId } })
  } else if (item.kind === 'visit') router.push({ name: 'reader-room', params: { id: item.visitorId } })
  // your own room, with the notice board open on the new notes
  else if (item.kind === 'note') router.push({ name: 'house', query: { board: '1' } })
  else if (friend) findFriend(friend)
}

function toggleDaily() {
  if (dailyOpen.value) dailyOpen.value = false
  else openDaily()
}

function openDaily() {
  daily.start(profile.value.id)
  closePanels()
  dailyOpen.value = true
  selected.value = null
  friendId.value = null
}

// A task's Go: the map glides to the building and its card opens.
function goDo(placeId) {
  dailyOpen.value = false
  go(placeId)
}

async function claimDaily() {
  const claimed = await daily.claim()
  if (!claimed) {
    if (daily.error) showNotice(daily.error)
    return
  }
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
  closePanels()
  friendId.value = id
}

// From the friends list: to them where they're walking, or to their house if they're in. Only
// someone with a character can be out walking.
function findFriend(friend) {
  if (entering.value) return
  if (friend.online && friend.character) friendFocus.value = { id: friend.id, key: Date.now() }
  else if (friend.house) go(friend.house)
}

// Say hi: their box joins the dock and the chat opens, with everything you've said before.
function sayHi(friend) {
  chatIds.value = [friend.id, ...chatIds.value.filter((id) => id !== friend.id)]
  showChat(friend.id)
}

// One thing open at a time: a chat that opens shuts the lists, the bell and any card over the map.
function showChat(id) {
  closePanels()
  selected.value = null
  friendId.value = null
  openChat.value = id
}

// ...and a list, the bell or a card that opens shuts the chat, however it was opened (a button, a
// pop-up's View, the walkthrough)
watch([placesOpen, friendsOpen, dailyOpen, notificationsOpen, selected, friendId], (open) => {
  if (open.some(Boolean)) openChat.value = null
})

function toggleChat(id) {
  if (openChat.value === id) openChat.value = null
  else showChat(id)
}

// An open chat shuts (down to its box by the zoom buttons) when any other button or link is
// pressed: the HUD, a list, a card, the map's own buttons. One that opens a chat opens it again.
// How far down the controls along the top reach (the HUD, the weather, Daily and Private/Public
// chips), which on a narrow phone wrap onto more rows: the chat window stops above it.
const townRoot = ref(null)
const topClear = ref(90)
const TOP_CONTROLS =
  '.town-hud > *, [data-tour="town-weather"], [data-tour="town-daily"], .town__daily .music-toggle, .town__menu .town-menu__toggle, [data-tour="town-privacy"]'
let topWatcher = null

function measureTop() {
  const root = townRoot.value
  if (!root) return
  const top = root.getBoundingClientRect().top
  const middle = root.clientHeight / 2
  const bottoms = [...root.querySelectorAll(TOP_CONTROLS)]
    .map((el) => el.getBoundingClientRect())
    .filter((box) => box.height && box.top - top < middle)
    .map((box) => box.bottom - top)
  // the pixel buttons' hard shadow hangs 7px below them
  topClear.value = Math.ceil(Math.max(60, ...bottoms) + 10)
}

watch(ready, async (on) => {
  if (!on || topWatcher || !window.ResizeObserver) return
  await nextTick()
  topWatcher = new ResizeObserver(measureTop)
  topWatcher.observe(townRoot.value)
  for (const el of townRoot.value.querySelectorAll(TOP_CONTROLS)) topWatcher.observe(el)
  measureTop()
})

function shutChatOnOtherButtons(event) {
  if (!openChat.value) return
  const pressed = event.target.closest?.('button, a, [role="button"]')
  if (!pressed || pressed.closest('.chat-dock')) return
  openChat.value = null
}

function closeChat(id) {
  chatIds.value = chatIds.value.filter((chat) => chat !== id)
  if (openChat.value === id) openChat.value = null
}

// The card of the reader you went to visit opens again when you come back (see reopenCard), so you
// don't lose track of them on the map.
const CARD_VIEW = 'town-card'
const CARD_FOR = 30 * 60 * 1000
const READER_PAGES = ['reader-house', 'reader-house-shelf', 'reader-room', 'reader-shelf']
let pendingCard = (() => {
  const back = takeView(CARD_VIEW)
  return back && Date.now() - back.at < CARD_FOR ? back.id : null
})()
let looked = false

function rememberCard(id) {
  stashView(CARD_VIEW, { id, at: Date.now() })
}

// Back from a visit: once the map is up and the readers are known, glide to the reader and open
// their card again. If they have moved on (gone offline or out of reach) it just stays shut.
function reopenCard() {
  if (!pendingCard || !ready.value || guide.value || entering.value) return
  const there =
    friendsInTown.value.some((friend) => friend.id === pendingCard && friend.online && friend.character) ||
    nearbyInTown.value.some((reader) => reader.id === pendingCard)
  if (there) {
    friendFocus.value = { id: pendingCard, key: Date.now() }
    pendingCard = null
  } else if (looked) pendingCard = null
}

watch(ready, reopenCard)

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
  closePanels()
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
  <section ref="townRoot" class="town" aria-label="IKDA Town" :style="{ '--town-top-clear': `${topClear}px` }">
    <TownMap
      :focus="focus"
      :start="arrivingForTour ? 'house' : ''"
      :coming-from="comingFrom"
      :can-walk="!guide && !entering"
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
      @walk="walked"
      @ready="ready = true"
    />
    <TownHud
      :places-open="placesOpen"
      :friends-online="onlineCount"
      :friend-requests="nearby.incoming.length"
      :friends-open="friendsOpen"
      :unread="notificationsOpen ? 0 : notifications.unread"
      :notifications-open="notificationsOpen"
      @toggle-places="togglePlaces"
      @toggle-friends="toggleFriends"
      @toggle-notifications="toggleNotifications"
    />
    <!-- today's tasks and the streak, on the left under the weather chip, with the music button
         beside it: in one row, so the music button slides along as Daily widens to show its words -->
    <div class="town__daily">
      <DailyButton v-if="daily.ready" data-tour="town-daily" v-bind="dailyChip" :open="dailyOpen" @toggle="toggleDaily" />
      <MusicToggle data-tour="town-music" />
    </div>
    <!-- on a phone, Daily, music, the bell and public or private fold into this ☰ menu instead -->
    <TownMenu
      class="town__menu"
      :open="menuOpen"
      :daily="daily.ready ? dailyChip : null"
      :unread="notificationsOpen ? 0 : notifications.unread"
      :music-on="music.enabled"
      :public="profile.discoverable"
      :public-busy="privacyBusy"
      :public-locked="nearby.minor"
      :keep-open="guide?.id === 'town-menu-items'"
      @toggle="toggleMenu"
      @close="menuOpen = false"
      @daily="menuDaily"
      @notifications="menuNotifications"
      @music="music.toggle()"
      @public="choosePublic(!profile.discoverable)"
    />
    <LocationChip
      data-tour="town-privacy"
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
      :sent="nearby.sent"
      :nearby="nearbyInTown"
      :open="friendsOpen"
      :add-status="addStatus"
      :action="action"
      :username="yourUsername(profile)"
      @go="findFriend"
      @go-nearby="friendFocus = { id: $event.id, key: Date.now() }"
      @answer="answerRequest"
      @chat="sayHi"
      @add="addByUsername"
      @remove="removeFriends"
    />
    <NotificationSlide :item="slide" :more="slide?.more ?? 0" @open="openNotification" />
    <NotificationsPanel
      :items="notifications.items"
      :open="notificationsOpen"
      @open-item="openNotification"
      @clear="notifications.clear"
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
    <WeatherChip v-if="ready" data-tour="town-weather" :weather="weather" />
    <!-- you, in the bottom-left corner: level, XP and coins; opens the salon -->
    <PlayerBadge
      data-tour="town-badge"
      class="town__me"
      :name="profile.name || 'You'"
      :username="profile.username"
      :character="profile.character"
      :level="progress.level"
      :coins="progress.coins"
      :gain="progress.lastGain"
      :level-ups="progress.levelUps"
    />

    <Transition name="town-fade">
      <p v-if="hint && ready && !selected && !friendId && !entering && !guide" class="town__hint">Tap the map to walk. Tap a building to go in.</p>
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

    <!-- one reader's card at a time -->
    <Transition name="town-card" mode="out-in">
      <!-- the same card as tapping a reader in the Cafe: who they are, Visit room, Add friend, Message -->
      <CafeReaderCard
        v-if="cardReader"
        :key="`reader-${cardReader.id}`"
        class="town__reader-card"
        :reader="cardReader"
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
/* the ☰ menu shows only on a phone, in place of the buttons it holds (the walkthrough has its own
   steps for it there) */
.town .town__menu {
  display: none;
  position: absolute;
  left: 17px;
  top: 76px;
  z-index: 11;
}

.town .town__daily {
  position: absolute;
  left: 17px;
  top: 76px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--rl-btn-gap, 8px);
  pointer-events: none;
}

/* public or private, under Daily */
.town .town__location {
  position: absolute;
  left: 17px;
  top: 138px;
  z-index: 10;
}

/* after the rules above, so it wins over their display: on a phone the ☰ menu holds these */
@media (max-width: 600px) {
  .town .town__menu {
    display: block;
  }

  .town .town__daily,
  .town .town__location,
  .town :deep(.notifications-button) {
    display: none;
  }
}

/* your badge, bottom left (the weather chip has the top-left corner) */
.town .town__me {
  position: absolute;
  left: 14px;
  bottom: 24px;
  z-index: 5;
}

/* a quarter smaller on a phone, all of it, staying in its corner. `scale`, not `transform`: the
   badge's own hover and level-up pop use transform */
@media (max-width: 600px) {
  .town .town__me {
    scale: 0.75;
    transform-origin: left bottom;
  }
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

/* a phone's left-hand buttons reach across the top: it sits below them */
@media (max-width: 600px) {
  .town__hint:not(.town__notice) {
    top: 196px;
  }
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

/* a reader's card on the map: the Cafe's card (CafeReaderCard), over the town, in the middle of a
   laptop's screen and as a sheet from the bottom on a phone */
.town__reader-card {
  position: absolute;
  z-index: 20;
  inset: 0;
  margin: auto;
  width: min(660px, calc(100% - 28px));
  height: fit-content;
  max-height: calc(100% - 28px);
}

@media (max-width: 640px) {
  .town__reader-card {
    top: auto;
    margin: 0;
    width: 100%;
    max-height: calc(100% - 156px);
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
