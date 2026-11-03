// Scaffolded with AI assistance — see AI_USAGE.md
// The town's notifications: friend requests, friends coming online and visits to your room, each
// of which shows once as a pop-up (TownView) and stays in the bell's list. The town calls check()
// after every refresh, so they arrive while you're in town and catch up when you come back.
// The list is built from Supabase each time: requests waiting for you, visits in the last week, and
// friends who came online this visit. What's read and what's cleared are two times saved on your
// profile (database/notifications_seen.sql), so every device agrees.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loadNotificationTimes, saveNotificationTimes } from '@/services/auth.js'
import { getRoomVisits } from '@/services/api.js'
import { presence } from '@/town/friends.js'
import { useNearbyStore } from '@/town/nearbyStore.js'

const KEEP = 30
const WEEK = 7 * 24 * 60 * 60 * 1000
// times from the database and from the browser are written differently, so compare them as numbers
const time = (at) => Date.parse(at) || 0

export const useNotificationsStore = defineStore('notifications', () => {
  const nearby = useNearbyStore()
  const readerId = ref('')
  // [{ id, kind: 'request' | 'online' | 'visit', text, at, read, requestId?, friendId?, visitorId? }]
  const items = ref([])
  // anything at or before readAt is read; anything at or before clearedAt is gone from the list
  const readAt = ref('')
  const clearedAt = ref('')
  let loaded = Promise.resolve()
  let visits = []
  let online = []
  // what has popped up this visit, so nothing pops up twice
  let popped = new Set()
  // Coming online counts once a visit: "online" is seen in town in the last 5 minutes, so someone
  // moving between buildings would otherwise come online again and again.
  let greeted = new Set()
  let knownFriends = null

  const unread = computed(() => items.value.filter((item) => !item.read).length)

  // Until the times can be read, everything from the last week counts as new.
  async function loadTimes(id) {
    const { data, error } = await loadNotificationTimes(id)
    if (error || !data || readerId.value !== id) return
    readAt.value = data.readAt
    clearedAt.value = data.clearedAt
  }

  // Saves the times; if that fails they still hold until the page is closed.
  function saveTimes(times) {
    saveNotificationTimes(readerId.value, times).catch(() => {})
  }

  // Loads this reader's times.
  function start(id) {
    if (!id || id === readerId.value) return
    readerId.value = id
    items.value = []
    readAt.value = ''
    clearedAt.value = ''
    visits = []
    online = []
    popped = new Set()
    greeted = new Set()
    knownFriends = null
    loaded = loadTimes(id)
  }

  function requests() {
    return nearby.incoming.map(({ requestId, reader, at }) => ({
      id: `request-${requestId}`,
      kind: 'request',
      text: `${reader.displayName} sent you a friend request`,
      at: at ?? '',
      requestId,
    }))
  }

  // Anyone already online when you arrive, and anyone you've only just added, isn't news.
  function newlyOnline() {
    const now = Date.now()
    const onlineNow = nearby.friends.filter((friend) => presence(friend.lastSeenAt, now).online)
    const fresh = onlineNow.filter((friend) => knownFriends?.has(friend.id) && !greeted.has(friend.id))
    for (const friend of onlineNow) greeted.add(friend.id)
    knownFriends = new Set(nearby.friends.map((friend) => friend.id))
    return fresh.map((friend) => ({
      id: `online-${friend.id}-${now}`,
      kind: 'online',
      text: `${friend.displayName} is online`,
      at: new Date(now).toISOString(),
      friendId: friend.id,
    }))
  }

  async function recentVisits() {
    const since = new Date(Math.max(Date.now() - WEEK, time(clearedAt.value))).toISOString()
    const { visits: found } = await getRoomVisits(since)
    return found.map(({ id, at, visitor }) => ({
      id: `visit-${id}`,
      kind: 'visit',
      text: `${visitor?.displayName ?? 'Someone'} visited your room`,
      at,
      visitorId: visitor?.id ?? null,
    }))
  }

  function build() {
    items.value = [...requests(), ...online, ...visits]
      .filter((item) => time(item.at) > time(clearedAt.value))
      .sort((a, b) => time(b.at) - time(a.at))
      .slice(0, KEEP)
      .map((item) => ({ ...item, read: time(item.at) <= time(readAt.value) }))
  }

  // Rebuilds the list and returns what's new since the last look. A failed look at the visits
  // keeps the ones already found until the next check.
  async function check() {
    if (!readerId.value) return []
    await loaded
    visits = await recentVisits().catch(() => visits)
    online = [...newlyOnline(), ...online].slice(0, KEEP)
    build()
    const fresh = items.value.filter((item) => !item.read && !popped.has(item.id))
    for (const item of fresh) popped.add(item.id)
    return fresh
  }

  function markRead() {
    if (!unread.value) return
    readAt.value = new Date().toISOString()
    build()
    saveTimes({ readAt: readAt.value })
  }

  function clear() {
    clearedAt.value = new Date().toISOString()
    online = []
    build()
    saveTimes({ clearedAt: clearedAt.value })
  }

  return { items, unread, start, check, markRead, clear }
})
