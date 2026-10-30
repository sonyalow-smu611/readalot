// Scaffolded with AI assistance — see AI_USAGE.md
// Today's tasks, the streak and the freezes (rules in town/daily.js). It listens to the progress
// and bookshelf stores, so a task done inside any building ticks off without those stores
// knowing about daily tasks. Front end only for now: moves to stores/ with the backend.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useProgressStore } from '@/stores/progress.js'
import { useBookshelfStore } from '@/stores/bookshelf.js'
import { MAX_FREEZES, WEEK, dayKey, freshState, loadState, rewardFor, saveState, settle, tasksFor } from '@/town/daily.js'
import { useNearbyStore } from '@/town/nearbyStore.js'

export const useDailyStore = defineStore('daily', () => {
  const nearby = useNearbyStore()
  const readerId = ref('')
  const state = ref(null)
  let listening = false

  const today = computed(() => state.value?.day ?? dayKey())
  const tasks = computed(() =>
    tasksFor(today.value, nearby.houses[0]?.id ?? null).map((task) => ({ ...task, done: Boolean(state.value?.done.includes(task.id)) })),
  )
  const doneCount = computed(() => tasks.value.filter((task) => task.done).length)
  const claimed = computed(() => Boolean(state.value && state.value.lastClaim === today.value))
  const canClaim = computed(() => doneCount.value === tasks.value.length && !claimed.value)
  const streak = computed(() => state.value?.streak ?? 0)
  const freezes = computed(() => state.value?.freezes ?? MAX_FREEZES)
  const notice = computed(() => state.value?.notice ?? null)
  // the streak day today's claim is (or was) for
  const todayNumber = computed(() => (claimed.value ? streak.value : streak.value + 1))
  const reward = computed(() => rewardFor(todayNumber.value))
  // the week of the streak today is in: seven days, each claimed, today, or still to come
  const week = computed(() => {
    const first = Math.floor((todayNumber.value - 1) / WEEK) * WEEK + 1
    return Array.from({ length: WEEK }, (_, i) => {
      const n = first + i
      const status = n < todayNumber.value || (n === todayNumber.value && claimed.value) ? 'claimed' : n === todayNumber.value ? 'today' : 'later'
      return { n, status, ...rewardFor(n) }
    })
  })
  // open the panel by itself once a day
  const shouldShow = computed(() => Boolean(state.value && state.value.shown !== today.value))

  function update(changes) {
    state.value = { ...state.value, ...changes }
    saveState(readerId.value, state.value)
  }

  // Loads this reader's day, and moves it on if midnight has passed since.
  function start(id) {
    if (!id) return
    if (id !== readerId.value || !state.value) {
      readerId.value = id
      state.value = loadState(id, dayKey())
    }
    const now = settle(state.value, dayKey(Date.now(), state.value.offset))
    if (now !== state.value) update(now)
    listen()
  }

  // Every action that could tick off a task, from anywhere in the app.
  function listen() {
    if (listening) return
    listening = true
    useProgressStore().$onAction(({ name, args }) => {
      if (name === 'earn') record(args[0])
    }, true)
    useBookshelfStore().$onAction(({ name, after }) => {
      if (name === 'setProgress') after(() => record('progress'))
    }, true)
  }

  function record(action) {
    if (!state.value) return
    const task = tasks.value.find((t) => !t.done && t.actions.includes(action))
    if (task) update({ done: [...state.value.done, task.id] })
  }

  function checkIn() {
    record('check-in')
  }

  function markShown() {
    if (state.value) update({ shown: today.value })
  }

  function dismissNotice() {
    if (state.value) update({ notice: null })
  }

  // Claims today's reward: { n, coins, xp, chest }, or null if it isn't ready.
  function claim() {
    if (!canClaim.value) return null
    const n = streak.value + 1
    const gift = rewardFor(n)
    update({
      streak: n,
      lastClaim: today.value,
      freezes: gift.chest ? Math.min(MAX_FREEZES, state.value.freezes + 1) : state.value.freezes,
      notice: null,
    })
    return { n, ...gift }
  }

  // Adds a claimed reward to the badge, which floats it and counts the coins up.
  // Preview only: added in this browser, so a reload shows the saved totals again; the backend's
  // claim_daily() will save them and send back the new totals.
  function collect(gift) {
    const progress = useProgressStore()
    progress.xp += gift.xp
    progress.coins += gift.coins
    progress.lastGain = { xp: gift.xp, coins: gift.coins, key: Date.now() }
  }

  // Preview while developing: jump ahead a day (or skip some), or start over.
  function previewDays(days) {
    if (!state.value) return
    const offset = state.value.offset + days
    update({ ...settle(state.value, dayKey(Date.now(), offset)), offset, shown: null })
    checkIn()
  }

  function previewReset() {
    if (!state.value) return
    update(freshState(dayKey()))
    checkIn()
  }

  return {
    tasks,
    doneCount,
    claimed,
    canClaim,
    streak,
    freezes,
    notice,
    reward,
    week,
    shouldShow,
    start,
    checkIn,
    markShown,
    dismissNotice,
    claim,
    collect,
    previewDays,
    previewReset,
  }
})
