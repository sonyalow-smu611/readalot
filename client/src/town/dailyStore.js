// Scaffolded with AI assistance — see AI_USAGE.md
// Today's tasks, the streak and the freezes (rules in town/daily.js). It listens to the progress
// and bookshelf stores, so a task done inside any building ticks off without those stores
// knowing about daily tasks. The day itself is kept in Supabase (services/daily.js): every tick and
// the claim are saved there, and the claim's coins and XP come back from it.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useProgressStore } from '@/stores/progress.js'
import { useBookshelfStore } from '@/stores/bookshelf.js'
import { claimDaily, dismissDailyNotice, loadDaily, markDailyDone, markDailyShown } from '@/services/daily.js'
import { MAX_FREEZES, WEEK, dayKey, freshState, fromRow, rewardFor, settle, tasksFor } from '@/town/daily.js'
import { useNearbyStore } from '@/town/nearbyStore.js'

export const useDailyStore = defineStore('daily', () => {
  const nearby = useNearbyStore()
  const readerId = ref('')
  const state = ref(null)
  // why the last save or claim didn't go through, for the town to say
  const error = ref('')
  let listening = false
  let loading = Promise.resolve()

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
  // the day has loaded; until then (or if it can't) there's no Daily button
  const ready = computed(() => Boolean(state.value))
  // the preview's days are this browser's copy only, and aren't saved
  const previewing = () => Boolean(state.value?.preview)

  function update(changes) {
    state.value = { ...state.value, ...changes }
  }

  // Takes the database's answer as the day, unless the preview has moved it on.
  function saved({ data, error: failed }) {
    if (failed || !data || previewing()) return
    state.value = fromRow(data)
  }

  // Loads this reader's day, which the database moves on if midnight has passed since.
  function start(id) {
    if (!id) return loading
    readerId.value = id
    listen()
    loading = loadDaily().then(({ data, error: failed }) => {
      if (readerId.value !== id || previewing()) return
      if (failed || !data) {
        error.value = "Today's tasks couldn't be loaded."
        return
      }
      error.value = ''
      state.value = fromRow(data)
    })
    return loading
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

  async function record(action) {
    await loading
    if (!state.value) return
    const task = tasks.value.find((t) => !t.done && t.actions.includes(action))
    if (!task) return
    update({ done: [...state.value.done, task.id] })
    if (!previewing()) saved(await markDailyDone(task.id))
  }

  function checkIn() {
    return record('check-in')
  }

  async function markShown() {
    if (!state.value) return
    update({ shown: today.value })
    if (!previewing()) saved(await markDailyShown())
  }

  async function dismissNotice() {
    if (!state.value) return
    update({ notice: null })
    if (!previewing()) saved(await dismissDailyNotice())
  }

  // Claims today's reward: { n, coins, xp, chest, totalXp, balance }, or null (with `error` set)
  // if it isn't ready or the database refused it. The preview claims in this browser only.
  async function claim() {
    if (!canClaim.value) return null
    if (previewing()) {
      const progress = useProgressStore()
      const n = streak.value + 1
      const gift = rewardFor(n)
      update({
        streak: n,
        lastClaim: today.value,
        freezes: gift.chest ? Math.min(MAX_FREEZES, state.value.freezes + 1) : state.value.freezes,
        notice: null,
      })
      return { n, ...gift, totalXp: progress.xp + gift.xp, balance: progress.coins + gift.coins }
    }
    const { data, error: failed } = await claimDaily()
    if (failed || !data) {
      error.value = failed?.message || "Today's reward couldn't be claimed. Try again."
      return null
    }
    error.value = ''
    state.value = fromRow(data.state)
    return { n: data.n, coins: data.coins, xp: data.xp, chest: data.chest, totalXp: data.total_xp, balance: data.balance }
  }

  // Shows a claimed reward on the badge, which floats it and counts the coins up to the new totals.
  function collect(gift) {
    const progress = useProgressStore()
    progress.xp = gift.totalXp
    progress.coins = gift.balance
    progress.lastGain = { xp: gift.xp, coins: gift.coins, key: Date.now() }
  }

  // Preview while developing: jump ahead a day (or skip some), or start over. Only this browser's
  // copy changes; a reload brings back the saved day.
  function previewDays(days) {
    if (!state.value) return
    const offset = state.value.offset + days
    update({ ...settle(state.value, dayKey(Date.now(), offset)), offset, shown: null, preview: true })
    checkIn()
  }

  function previewReset() {
    if (!state.value) return
    update({ ...freshState(dayKey()), preview: true })
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
    ready,
    error,
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
