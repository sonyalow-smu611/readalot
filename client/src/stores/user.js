// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import usersData from '@/data/users.json'
import { currentSession, loadProfile, markTourSeen, watchAuth } from '@/services/auth.js'
import { normaliseCharacter } from '@/lib/avatar/catalogue.js'
import { useProgressStore } from '@/stores/progress.js'
import { usePeopleStore } from '@/stores/people.js'
import { useNearbyStore } from '@/town/nearbyStore.js'
import { WALKTHROUGH } from '@/lib/walkthrough.js'

// The walkthrough (lib/walkthrough.js) plays once after Welcome; finishing or skipping saves
// profiles.tour_seen_at, so it doesn't play again by itself on any device. The salon replays it.
const GUIDE_STEPS = WALKTHROUGH

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

  function backGuide() {
    if (guideStep.value > 0) guideStep.value -= 1
  }

  // "Skip this part": on to the first step of the next part, or the end
  function skipGuideSection() {
    if (guideStep.value < 0) return
    const section = GUIDE_STEPS[guideStep.value].section
    const next = GUIDE_STEPS.findIndex((step, index) => index > guideStep.value && step.section !== section)
    if (next < 0) closeGuide()
    else guideStep.value = next
  }

  // the salon's Replay the walkthrough
  function replayGuide() {
    guideStep.value = 0
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
    backGuide,
    skipGuideSection,
    replayGuide,
    closeGuide,
    dismissGuide,
    mergeProfile,
  }
})
