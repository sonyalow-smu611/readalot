<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The day's tasks on every page but the town, which has its own: a Daily task tab on the left edge
// that opens the same panel. A task's Go goes to its building; a friend's house is in town.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { MAX_FREEZES } from '@/town/daily.js'
import { useDailyStore } from '@/town/dailyStore.js'
import { useNearbyStore } from '@/town/nearbyStore.js'
import { PLACES } from '@/town/places.js'
import DailyButton from './DailyButton.vue'
import DailyPanel from './DailyPanel.vue'
import DailyReward from './DailyReward.vue'

const router = useRouter()
const user = useUserStore()
const daily = useDailyStore()
const nearby = useNearbyStore()

const open = ref(false)
const tab = ref(null)
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

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="daily-dock">
    <DailyButton ref="tab" class="daily-dock__tab" v-bind="chip" :open="open" compact @toggle="open = !open" />
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
  top: 34%;
  left: 0;
  z-index: 36;
}

/* the whole window: a laptop's phone column has space either side of it */
.daily-dock__outside {
  position: fixed;
  inset: 0;
  z-index: 37;
}

.daily-dock :deep(.daily-panel) {
  top: 72px;
  left: 14px;
  z-index: 38;
  max-height: calc(100% - 88px);
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
  .daily-dock-enter-active,
  .daily-dock-leave-active {
    transition: none;
  }
}
</style>
