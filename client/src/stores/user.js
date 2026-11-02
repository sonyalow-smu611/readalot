// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import usersData from '@/data/users.json'
import { currentSession, loadProfile, markTourSeen, watchAuth } from '@/services/auth.js'
import { normaliseCharacter } from '@/lib/avatar/catalogue.js'
import { useProgressStore } from '@/stores/progress.js'
import { usePeopleStore } from '@/stores/people.js'
import { useNearbyStore } from '@/town/nearbyStore.js'

// A new reader's first tour, played once in the town after Welcome: Next zooms the camera out and
// back in on each building in turn (focus: a place id from town/places.js, which TownView glides
// to). Once there, the map marks where the building is (data-tour-spot) and the card spotlights
// it and sits below it. A step with no target and no focus shows its card over a dimmed screen. Finishing or
// skipping saves profiles.tour_seen_at, so it never plays again on any device.
const GUIDE_STEPS = [
  {
    id: 'town-welcome',
    to: '/',
    target: null,
    title: 'Welcome to Readalot Town',
    copy: 'This is your town. Drag the map to look around, and tap a building to go inside. Each building is a part of Readalot.',
  },
  {
    id: 'town-house',
    to: '/',
    target: '[data-tour-spot="house"]',
    focus: 'house',
    title: 'Your house',
    copy: 'This blue house is yours. Inside is My Room: your bookshelf, the window with the live weather, and the chair with the book you are reading.',
  },
  {
    id: 'town-library',
    to: '/',
    target: '[data-tour-spot="library"]',
    focus: 'library',
    title: 'The library',
    copy: 'Discover books here: search for a title, browse shelves by genre, and open any book to read about it.',
  },
  {
    id: 'town-cafe',
    to: '/',
    target: '[data-tour-spot="cafe"]',
    focus: 'cafe',
    title: 'The cafe',
    copy: 'Meet other readers. See who reads like you, find them on the map, and follow them.',
  },
  {
    id: 'town-salon',
    to: '/',
    target: '[data-tour-spot="salon"]',
    focus: 'salon',
    title: 'The hair salon',
    copy: 'Restyle your character here, and edit your profile, your lists and your privacy.',
  },
  {
    id: 'town-friend',
    to: '/',
    target: '[data-tour-spot="friend-spot-0"]',
    focus: 'friend-spot-0',
    title: 'Friends’ houses',
    copy: 'This lawn is waiting for a friend. When you add a reader, their house appears in town, and you can tap it to visit their room.',
  },
]

function emptyProfile() {
  return {
    id: '',
    email: '',
    name: '',
    avatar: '🐨',
    // the town character, always complete and valid (see lib/avatar/catalogue.js)
    character: normaliseCharacter(null),
    gender: '',
    age: '',
    religion: '',
    favouriteGenres: [],
    location: '',
    discoverable: false,
    // when they answered the public or private question, '' until then
    locationAsked: '',
  }
}

export const useUserStore = defineStore('user', () => {
  const profile = ref(emptyProfile())
  const ready = ref(false)
  const guideStep = ref(-1)
  // a profiles row exists: the reader finished Welcome
  const hasProfile = ref(false)
  const tourSeen = ref(false)
  // the profile could not be loaded (not the same as "no profile yet")
  const profileError = ref('')
  const readers = ref(structuredClone(usersData))
  let stopWatch = () => {}
  // the load in progress, so the auth watcher and Verify don't load the same reader twice
  let loading = null
  let loadingId = ''

  const readersByCompatibility = computed(() =>
    [...readers.value].sort((a, b) => b.compatibility - a.compatibility),
  )

  const signedIn = computed(() => Boolean(profile.value.id))
  const profileComplete = computed(() => hasProfile.value)
  const guide = computed(() => (guideStep.value >= 0 ? GUIDE_STEPS[guideStep.value] : null))
  const guideCount = computed(() => GUIDE_STEPS.length)
  // a new reader on their way to the town for the first time: the tour is about to start
  const tourPending = computed(() => hasProfile.value && !tourSeen.value)

  function findReader(id) {
    return readers.value.find((reader) => reader.id === id) ?? null
  }

  // Signs the reader in or out of the store and loads their saved profile.
  function applySession(session) {
    const user = session?.user
    if (!user) {
      loading = null
      loadingId = ''
      profile.value = emptyProfile()
      hasProfile.value = false
      tourSeen.value = false
      profileError.value = ''
      useProgressStore().reset()
      usePeopleStore().reset()
      useNearbyStore().reset()
      return Promise.resolve()
    }
    if (user.id === loadingId && loading) return loading
    loadingId = user.id
    profile.value = { ...emptyProfile(), id: user.id, email: user.email || '' }
    hasProfile.value = false
    loading = fetchProfile(user.id)
    return loading
  }

  async function fetchProfile(id) {
    profileError.value = ''
    const { data, error } = await loadProfile(id)
    if (profile.value.id !== id) return
    if (error) {
      profileError.value = 'Your profile could not be loaded. Check your connection and try again.'
      loading = null
      return
    }
    if (!data) return
    const { tourSeen: seen, ...details } = data
    mergeProfile(details)
    tourSeen.value = seen
    hasProfile.value = true
    // XP and coins load alongside; nothing waits for them
    useProgressStore().load()
  }

  function reloadProfile() {
    if (!profile.value.id) return Promise.resolve()
    loading = fetchProfile(profile.value.id)
    return loading
  }

  // Welcome saved the profile: the row now exists.
  function profileSaved(details) {
    mergeProfile(details)
    hasProfile.value = true
    useProgressStore().load()
  }

  async function restore() {
    if (ready.value) return
    const { data } = await currentSession()
    await applySession(data.session)
    stopWatch()
    stopWatch = watchAuth(applySession)
    ready.value = true
  }

  function openGuideIfNew() {
    if (guideStep.value >= 0) return
    if (!hasProfile.value || tourSeen.value) return
    guideStep.value = 0
  }

  function nextGuide() {
    if (guideStep.value < 0) return
    if (guideStep.value >= GUIDE_STEPS.length - 1) {
      closeGuide()
      return
    }
    guideStep.value += 1
  }

  // Done or Skip. If saving fails the tour stays closed now and shows again next session.
  function closeGuide() {
    guideStep.value = -1
    tourSeen.value = true
    if (profile.value.id) markTourSeen(profile.value.id)
  }

  function dismissGuide() {
    guideStep.value = -1
  }

  function mergeProfile(details) {
    profile.value = {
      ...profile.value,
      ...details,
      character: normaliseCharacter(details.character ?? profile.value.character),
      id: profile.value.id,
      email: profile.value.email,
    }
  }

  return {
    profile,
    ready,
    guideStep,
    guide,
    guideCount,
    readers,
    readersByCompatibility,
    signedIn,
    profileComplete,
    profileError,
    tourSeen,
    tourPending,
    findReader,
    applySession,
    restore,
    reloadProfile,
    profileSaved,
    openGuideIfNew,
    nextGuide,
    closeGuide,
    dismissGuide,
    mergeProfile,
  }
})
