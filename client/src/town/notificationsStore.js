// Scaffolded with AI assistance — see AI_USAGE.md
// The town's notifications: friend requests, friends coming online and visits to your room, each
// of which shows once as a pop-up (TownView) and stays in the bell's list. The town calls check()
// after every refresh, so they arrive while you're in town and catch up when you come back.
// The list is kept in the browser, per reader, like the day's tasks.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getRoomVisits } from '@/services/api.js'
import { presence } from '@/town/friends.js'
import { useNearbyStore } from '@/town/nearbyStore.js'

const KEEP = 30
const REMEMBER = 200
const WEEK = 7 * 24 * 60 * 60 * 1000
const storageKey = (id) => `readalot-notifications:${id}`

function loadSaved(id) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(id))) ?? {}
  } catch {
    return {}
  }
}

export const useNotificationsStore = defineStore('notifications', () => {
  const nearby = useNearbyStore()
  const readerId = ref('')
  // [{ id, kind: 'request' | 'online' | 'visit', text, at, read, requestId?, friendId?, visitorId? }]
  const items = ref([])
  // ids already shown, so nothing shows twice even after it's cleared from the list
  let seen = []
  let visitsSince = ''
  // Coming online counts once a visit: "online" is seen in town in the last 5 minutes, so someone
  // moving between buildings would otherwise come online again and again.
  let greeted = new Set()
  let knownFriends = null

  const unread = computed(() => items.value.filter((item) => !item.read).length)

  function save() {
    try {
      localStorage.setItem(storageKey(readerId.value), JSON.stringify({ items: items.value, seen, visitsSince }))
    } catch {
      // the list still works until the page is closed
    }
  }

  // Loads this reader's list.
  function start(id) {
    if (!id || id === readerId.value) return
    readerId.value = id
    const saved = loadSaved(id)
    items.value = saved.items ?? []
    seen = saved.seen ?? []
    visitsSince = saved.visitsSince ?? new Date(Date.now() - WEEK).toISOString()
    greeted = new Set()
    knownFriends = null
  }

  function isNew(id) {
    if (seen.includes(id)) return false
    seen = [id, ...seen].slice(0, REMEMBER)
    return true
  }

  function newRequests() {
    // a request you've answered has nothing left to say
    const waiting = new Set(nearby.incoming.map((request) => request.requestId))
    items.value = items.value.filter((item) => item.kind !== 'request' || waiting.has(item.requestId))
    return nearby.incoming
      .filter((request) => isNew(`request-${request.requestId}`))
      .map(({ requestId, reader }) => ({
        id: `request-${requestId}`,
        kind: 'request',
        text: `${reader.displayName} sent you a friend request`,
        requestId,
      }))
  }

  // Anyone already online when you arrive, and anyone you've only just added, isn't news.
  function newlyOnline() {
    const now = Date.now()
    const online = nearby.friends.filter((friend) => presence(friend.lastSeenAt, now).online)
    const fresh = online.filter((friend) => knownFriends?.has(friend.id) && !greeted.has(friend.id))
    for (const friend of online) greeted.add(friend.id)
    knownFriends = new Set(nearby.friends.map((friend) => friend.id))
    return fresh.map((friend) => ({
      id: `online-${friend.id}-${now}`,
      kind: 'online',
      text: `${friend.displayName} is online`,
      friendId: friend.id,
    }))
  }

  async function newVisits() {
    const { visits } = await getRoomVisits(visitsSince)
    if (visits.length) visitsSince = visits[0].at
    return visits
      .filter((visit) => isNew(`visit-${visit.id}`))
      .map(({ id, at, visitor }) => ({
        id: `visit-${id}`,
        kind: 'visit',
        text: `${visitor?.displayName ?? 'Someone'} visited your room`,
        at,
        visitorId: visitor?.id ?? null,
      }))
  }

  // Adds whatever is new, and returns it. A failed look at the visits waits for the next check.
  async function check() {
    if (!readerId.value) return []
    const visits = await newVisits().catch(() => [])
    const at = new Date().toISOString()
    const fresh = [...newRequests(), ...newlyOnline(), ...visits].map((item) => ({ at, ...item, read: false }))
    items.value = [...fresh, ...items.value].slice(0, KEEP)
    save()
    return fresh
  }

  function markRead() {
    if (!unread.value) return
    items.value = items.value.map((item) => ({ ...item, read: true }))
    save()
  }

  function clear() {
    items.value = []
    save()
  }

  return { items, unread, start, check, markRead, clear }
})
