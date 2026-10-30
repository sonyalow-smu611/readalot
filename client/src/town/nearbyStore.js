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

export const useNearbyStore = defineStore('nearby', () => {
  const friends = ref([])
  // [{ requestId, reader }]
  const incoming = ref([])
  // reader ids you've asked
  const outgoing = ref([])
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

  // Each of these throws when it isn't saved.
  async function addFriend(readerId) {
    await sendFriendRequest(readerId)
    await refresh()
  }

  async function answer(requestId, accept) {
    await answerFriendRequest(requestId, accept)
    await refresh()
  }

  async function removeFriend(readerId) {
    await removeFriendship(readerId)
    await refresh()
  }

  // signed out: the next reader fetches their own
  function reset() {
    friends.value = []
    incoming.value = []
    outgoing.value = []
    nearby.value = []
  }

  return { friends, incoming, outgoing, nearby, houses, minor, refresh, setPublic, addFriend, answer, removeFriend, reset }
})
