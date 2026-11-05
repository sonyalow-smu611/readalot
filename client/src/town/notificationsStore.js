// Scaffolded with AI assistance — see AI_USAGE.md
// The town's notifications: friend requests (waiting for you, sent by you, accepted), messages,
// friends coming online, visits to your room and notes left on your notice board. They wait in the
// bell's list, red until you've looked, and nothing pops up on its own: you open the bell, then a
// notification, to go to it. The town calls check() after every refresh, so they arrive while
// you're in town and catch up when you come back. The list is built from Supabase each time:
// requests, messages, visits and notes in the last week, and friends who came online this visit.
// What's read and what's cleared are two times saved on your
// profile (database/notifications_seen.sql), so every device agrees.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loadNotificationTimes, saveNotificationTimes } from '@/services/auth.js'
import { getActivity, getRoomNotes, getRoomVisits } from '@/services/api.js'
import { useNotesSeenStore } from '@/stores/notesSeen.js'
import { presence } from '@/town/friends.js'
import { useNearbyStore } from '@/town/nearbyStore.js'

const KEEP = 30
const WEEK = 7 * 24 * 60 * 60 * 1000
// times from the database and from the browser are written differently, so compare them as numbers
const time = (at) => Date.parse(at) || 0

export const useNotificationsStore = defineStore('notifications', () => {
  const nearby = useNearbyStore()
  // a note already read on the board itself is read here too
  const notesSeen = useNotesSeenStore()
  const readerId = ref('')
  // [{ id, kind: 'request' | 'sent' | 'accepted' | 'message' | 'online' | 'visit' | 'note', text, at,
  // read, requestId?, friendId?, readerId?, visitorId? }]
  const items = ref([])
  // anything at or before readAt is read; anything at or before clearedAt is gone from the list
  const readAt = ref('')
  const clearedAt = ref('')
  let loaded = Promise.resolve()
  let visits = []
  let activity = []
  let notes = []
  let online = []
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
    activity = []
    notes = []
    online = []
    greeted = new Set()
    knownFriends = null
    loaded = Promise.all([loadTimes(id), notesSeen.start(id)])
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

  // Requests you sent, ones that were accepted, and your conversations.
  async function recentActivity() {
    const since = new Date(Math.max(Date.now() - WEEK, time(clearedAt.value))).toISOString()
    const found = await getActivity(since)
    return [
      ...(found.sent ?? []).map(({ id, at, reader }) => ({
        id: `sent-${id}`,
        kind: 'sent',
        text: `You sent ${reader.displayName} a friend request`,
        at,
        readerId: reader.id,
      })),
      ...(found.accepted ?? []).map(({ id, at, reader }) => ({
        id: `accepted-${id}`,
        kind: 'accepted',
        text: `${reader.displayName} accepted your friend request`,
        at,
        readerId: reader.id,
      })),
      // only messages you were sent: one you sent yourself isn't news
      ...(found.messages ?? [])
        .filter(({ direction }) => direction === 'received')
        .map(({ id, at, reader }) => ({
          id: `message-${id}`,
          kind: 'message',
          text: `${reader.displayName} sent you a message`,
          at,
          readerId: reader.id,
        })),
    ]
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

  // Notes left on your board in the last week (since you last cleared the bell).
  async function recentNotes() {
    const since = Math.max(Date.now() - WEEK, time(clearedAt.value))
    const { notes: found } = await getRoomNotes(readerId.value)
    return found
      .filter((note) => time(note.createdAt) > since)
      .map((note) => ({
        id: `note-${note.id}`,
        kind: 'note',
        text: `${note.author} left a note on your board`,
        at: note.createdAt,
        seen: !notesSeen.isNew(note),
      }))
  }

  function build() {
    const friendIds = new Set(nearby.friends.map((friend) => friend.id))
    items.value = [...requests(), ...activity, ...online, ...visits, ...notes]
      .filter((item) => time(item.at) > time(clearedAt.value))
      // someone you've since removed isn't news
      .filter((item) => item.kind !== 'online' || friendIds.has(item.friendId))
      .sort((a, b) => time(b.at) - time(a.at))
      .slice(0, KEEP)
      .map(({ seen, ...item }) => ({ ...item, read: Boolean(seen) || time(item.at) <= time(readAt.value) }))
  }

  // Rebuilds the list. A failed look at the visits or the activity keeps the ones already found
  // until the next check.
  async function check() {
    if (!readerId.value) return
    await loaded
    ;[visits, activity, notes] = await Promise.all([
      recentVisits().catch(() => visits),
      recentActivity().catch(() => activity),
      recentNotes().catch(() => notes),
    ])
    online = [...newlyOnline(), ...online].slice(0, KEEP)
    build()
  }

  // The list as it is now, without asking the server: after the reader answers a request, say.
  function rebuild() {
    build()
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
    activity = []
    build()
    saveTimes({ clearedAt: clearedAt.value })
  }

  return { items, unread, start, check, rebuild, markRead, clear }
})
