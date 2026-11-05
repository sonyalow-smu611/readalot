// Scaffolded with AI assistance — see AI_USAGE.md
// Your friends, requests and the readers near you. Going public and sharing your last rough area
// are one setting (profiles.discoverable), changed here for both the town and the salon.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  answerFriendRequest,
  checkInNearby,
  getFriendships,
  removeFriendship,
  sendFriendRequest,
} from '@/services/api.js'
import { saveProfile } from '@/services/auth.js'
import { currentPosition } from '@/services/location.js'
import { useUserStore } from '@/stores/user'
import { nameFriendHouses } from '@/town/places.js'
import { yourUsername } from '@/town/username.js'

export const useNearbyStore = defineStore('nearby', () => {
  const friends = ref([])
  // [{ requestId, reader }]
  const incoming = ref([])
  // reader ids you've asked
  const outgoing = ref([])
  // [{ requestId, reader, at }]: the requests you've sent that are still waiting
  const sent = ref([])
  const nearby = ref([])

  const user = useUserStore()
  const houses = computed(() => nameFriendHouses(friends.value))
  // under-18s are always private
  const minor = computed(() => user.profile.age !== '' && Number(user.profile.age) < 18)

  async function loadFriends() {
    const data = await getFriendships()
    friends.value = data.friends
    incoming.value = data.incoming
    outgoing.value = data.outgoing
    sent.value = data.sent ?? []
  }

  // The town's refresh. Throws when it can't reach the server; what's on screen stays.
  async function refresh() {
    // without a position the server keeps your last area
    const position = user.profile.discoverable ? await currentPosition().catch(() => undefined) : undefined
    const { readers } = await checkInNearby(position)
    nearby.value = readers
    await loadFriends()
  }

  // Goes public or private; throws with a message to show when that didn't happen. Going public
  // asks the browser for your location first, so a blocked browser leaves you private.
  async function setPublic(on) {
    const position = on ? await currentPosition() : undefined
    const details = { discoverable: on, locationAsked: new Date().toISOString() }
    const saved = await saveProfile(details)
    if (saved.error) throw new Error(saved.error.message)
    user.mergeProfile(details)
    nearby.value = on ? (await checkInNearby(position)).readers : []
  }

  // Each of these throws when it isn't saved. They reload only the friend list, not the whole
  // refresh: that asks the browser for your location first, which can take seconds.
  // A request shows as sent straight away, and comes back off if it didn't send.
  async function addFriend(readerId) {
    const already = outgoing.value.includes(readerId)
    if (!already) outgoing.value = [...outgoing.value, readerId]
    try {
      await sendFriendRequest(readerId)
    } catch (err) {
      if (!already) outgoing.value = outgoing.value.filter((id) => id !== readerId)
      throw err
    }
    await loadFriends()
  }

  // Asks a reader by username (town/username.js says what's left to wire up). Returns how it went:
  // 'you', 'already-friends', 'already-asked', 'friends' (they had asked you, or are a demo reader
  // who accepts straight away) or 'asked'. Throws when nobody has that username.
  async function addByUsername(username) {
    const isFriend = () => friends.value.some((reader) => reader.username === username || reader.id === username)
    if (username === yourUsername(user.profile)) return 'you'
    if (isFriend()) return 'already-friends'
    if (outgoing.value.includes(username)) return 'already-asked'
    await addFriend(username)
    return isFriend() ? 'friends' : 'asked'
  }

  async function answer(requestId, accept) {
    await answerFriendRequest(requestId, accept)
    await loadFriends()
  }

  // Goes from the map and the lists straight away, and comes back if it didn't save.
  function forget(readerIds) {
    const gone = new Set(readerIds)
    const before = { friends: friends.value, nearby: nearby.value }
    friends.value = friends.value.filter((reader) => !gone.has(reader.id))
    nearby.value = nearby.value.filter((reader) => !gone.has(reader.id))
    return () => {
      friends.value = before.friends
      nearby.value = before.nearby
    }
  }

  async function removeFriend(readerId) {
    const undo = forget([readerId])
    try {
      await removeFriendship(readerId)
    } catch (err) {
      undo()
      throw err
    }
    await loadFriends()
  }

  // Removes several at once. Throws saying how many didn't go; the rest are still removed.
  async function removeFriends(readerIds) {
    forget(readerIds)
    const results = await Promise.allSettled(readerIds.map((id) => removeFriendship(id)))
    await loadFriends()
    const failed = results.filter((result) => result.status === 'rejected').length
    if (failed) throw new Error(`${failed} of ${readerIds.length} couldn't be removed. Try again.`)
  }

  // signed out: the next reader fetches their own
  function reset() {
    friends.value = []
    incoming.value = []
    outgoing.value = []
    sent.value = []
    nearby.value = []
  }

  return { friends, incoming, outgoing, sent, nearby, houses, minor, loadFriends, refresh, setPublic, addFriend, addByUsername, answer, removeFriend, removeFriends, reset }
})
