<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The day's tasks on every page but the town, which has its own: the same button, opening the same
// panel. It lines up with the buttons each page already has. Most pages have room down the left,
// so it stacks under their buttons as the town does. Where they don't, it joins the row: in the
// title bar beside the search button, or beside search's Back. A task's Go goes to its building; a
// friend's house is in town.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { MAX_FREEZES } from '@/town/daily.js'
import { useDailyStore } from '@/town/dailyStore.js'
import { useNearbyStore } from '@/town/nearbyStore.js'
import { PLACES } from '@/town/places.js'
import DailyButton from './DailyButton.vue'
import DailyPanel from './DailyPanel.vue'
import DailyReward from './DailyReward.vue'

const BACK = '.building-shell__back, .search__back'
const TITLE_BAR_BUTTON = '.app-header__card a.app-header__icon'
// what a scene keeps down its left side, under the back button
const UNDER_BACK = '.strip__menu, .cafe__count'
// pages whose content starts right under the back button
const BESIDE_BACK = ['search']
// the town's Daily button sits this far in, for a page with nothing in its corner
const EDGE = { top: 14, left: 17 }
const GAP = 8
const TAB_HEIGHT = 48
// how many frames in a row the spot must hold still, and the longest it stays hidden (ms)
const STILL_FRAMES = 6
const MOST_HIDDEN = 900

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const daily = useDailyStore()
const nearby = useNearbyStore()

const open = ref(false)
const tab = ref(null)
const spot = ref(EDGE)
const spotStyle = computed(() => Object.fromEntries(Object.entries(spot.value).map(([side, px]) => [side, `${Math.round(px)}px`])))
const panelTop = computed(() => ({ '--daily-panel-top': `${spot.value.top + TAB_HEIGHT + GAP}px` }))
let observer = null
let measuring = 0
// hidden while a new page arrives, so it never shows in the old page's spot
const settling = ref(true)
let settlingFrame = 0
// the reward just claimed, shown until "Nice!"
const gift = ref(null)

const chip = computed(() => ({
  streak: daily.streak,
  done: daily.doneCount,
  total: daily.tasks.length,
  ready: daily.canClaim,
  claimed: daily.claimed,
}))

// a page opened directly has no day loaded yet, and today's third task depends on having a friend
watch(
  () => user.profile.id,
  (id) => {
    daily.start(id)
    if (id) nearby.loadFriends().catch(() => {})
  },
  { immediate: true },
)

// Where an element sits in the frame, from the page's layout. Pages slide in with transforms, and
// the layout's numbers are the same before, during and after that, unlike what's on screen.
function layoutBox(el, frame) {
  let top = 0
  let left = 0
  for (let at = el; at && at !== frame; at = at.offsetParent) {
    top += at.offsetTop
    left += at.offsetLeft
  }
  return { top, left, right: left + el.offsetWidth, bottom: top + el.offsetHeight }
}

// { top, left } or { top, right } in the frame. Measured, because the buttons differ from page to
// page and a back button's label can be long.
function findSpot(frame) {
  const find = (selector) => {
    const el = document.querySelector(selector)
    return el ? layoutBox(el, frame) : null
  }
  const titleBarButton = find(TITLE_BAR_BUTTON)
  // from the right, so the words slide out over the title and not over the search button
  if (titleBarButton) return { top: titleBarButton.top, right: frame.offsetWidth - titleBarButton.left + GAP }
  const back = find(BACK)
  if (!back) return EDGE
  if (BESIDE_BACK.includes(route.name)) return { top: back.top, left: back.right + GAP }
  const below = [...document.querySelectorAll(UNDER_BACK)].map((el) => layoutBox(el, frame).bottom)
  return { top: Math.max(EDGE.top, Math.max(back.bottom, ...below) + GAP), left: back.left }
}

function measure() {
  measuring = 0
  const frame = tab.value?.$el.offsetParent
  if (frame) spot.value = findSpot(frame)
}

function measureSoon() {
  measuring ||= requestAnimationFrame(measure)
}

// Pages fade one after the other, and the new one's buttons can only be measured once it is there
// and has stopped moving. Waits for that, then shows the button. `leaving` is the page on its way out.
function settle(leaving = null) {
  const page = () => document.querySelector('.app-main')?.firstElementChild
  const started = performance.now()
  let last = ''
  let still = 0
  cancelAnimationFrame(settlingFrame)
  settling.value = true
  const look = () => {
    measure()
    const now = JSON.stringify(spot.value)
    still = page() !== leaving && now === last ? still + 1 : 0
    last = now
    if (still >= STILL_FRAMES || performance.now() - started > MOST_HIDDEN) settling.value = false
    else settlingFrame = requestAnimationFrame(look)
  }
  settlingFrame = requestAnimationFrame(look)
}

watch(
  () => route.path,
  () => settle(document.querySelector('.app-main')?.firstElementChild),
)

function close() {
  open.value = false
  tab.value?.$el.focus()
}

function onKey(event) {
  if (event.key === 'Escape' && open.value) close()
}

function go(placeId) {
  open.value = false
  router.push(PLACES.find((place) => place.id === placeId)?.route ?? { name: 'town' })
}

function claim() {
  const claimed = daily.claim()
  if (!claimed) return
  open.value = false
  gift.value = claimed
}

function closeGift() {
  daily.collect(gift.value)
  gift.value = null
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', measureSoon)
  // a page's top corner can arrive after the page does, once its data has loaded
  observer = new MutationObserver(measureSoon)
  observer.observe(document.querySelector('.app-main'), { childList: true, subtree: true })
  settle()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', measureSoon)
  observer.disconnect()
  cancelAnimationFrame(measuring)
  cancelAnimationFrame(settlingFrame)
})
</script>

<template>
  <div class="daily-dock" :style="panelTop">
    <DailyButton ref="tab" class="daily-dock__tab" :class="{ 'is-settling': settling }" :style="spotStyle" v-bind="chip" :open="open" @toggle="open = !open" />
    <div v-if="open" class="daily-dock__outside" aria-hidden="true" @click="close"></div>
    <Transition name="daily-dock">
      <DailyPanel
        v-if="open"
        :tasks="daily.tasks"
        :streak="daily.streak"
        :freezes="daily.freezes"
        :max-freezes="MAX_FREEZES"
        :week="daily.week"
        :reward="daily.reward"
        :can-claim="daily.canClaim"
        :claimed="daily.claimed"
        :notice="daily.notice"
        @go="go"
        @claim="claim"
        @dismiss-notice="daily.dismissNotice"
      />
    </Transition>
    <DailyReward v-if="gift" :reward="gift" @close="closeGift" />
  </div>
</template>

<style scoped>
/* above each page's own controls and back button, below its dialogs (40 and up) */
.daily-dock__tab {
  position: absolute;
  z-index: 36;
  transition: opacity 0.16s ease;
}

.daily-dock__tab.is-settling {
  opacity: 0;
  pointer-events: none;
}

/* the whole window: a laptop's phone column has space either side of it */
.daily-dock__outside {
  position: fixed;
  inset: 0;
  z-index: 37;
}

.daily-dock :deep(.daily-panel) {
  top: var(--daily-panel-top);
  left: 14px;
  z-index: 38;
  max-height: calc(100% - var(--daily-panel-top) - 16px);
}

.daily-dock :deep(.daily-reward) {
  z-index: 39;
}

.daily-dock-enter-active,
.daily-dock-leave-active {
  transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.daily-dock-enter-from,
.daily-dock-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

@media (prefers-reduced-motion: reduce) {
  .daily-dock__tab {
    transition: none;
  }

  .daily-dock-enter-active,
  .daily-dock-leave-active {
    transition: none;
  }
}
</style>
