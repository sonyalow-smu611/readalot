// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import usersData from '@/data/users.json'
import { currentSession, watchAuth } from '@/services/auth.js'

const GUIDE_STEPS = [
  {
    id: 'window',
    to: '/',
    target: '[data-tour="window"]',
    title: 'The window',
    copy: 'This is the weather outside. Sun, cloud, and rain all move across the glass, and the temperature sits in the corner.',
  },
  {
    id: 'clock',
    to: '/',
    target: '[data-tour="clock"]',
    title: 'The clock',
    copy: 'The clock on the wall shows the time in Singapore.',
  },
  {
    id: 'credits',
    to: '/',
    target: '[data-tour="credits"]',
    title: 'Credits',
    copy: 'This is your spending money. Buying something in the shop takes credits from here.',
  },
  {
    id: 'shelf',
    to: '/',
    target: '[data-tour="shelf"]',
    title: 'Your bookshelf',
    copy: 'Tap the shelf to open it. Reading, to read, and finished each have a row, and you can switch between spines and covers.',
  },
  {
    id: 'quote',
    to: '/',
    target: '[data-tour="quote"]',
    title: 'Quote of the day',
    copy: 'The note stuck on the shelf opens today’s quote.',
  },
  {
    id: 'chair',
    to: '/',
    target: '[data-tour="chair"]',
    title: 'Currently reading',
    copy: 'The book on the chair is the one you are reading now. Tap it to see that book.',
  },
  {
    id: 'menu',
    to: '/',
    target: '[data-tour="menu"]',
    title: 'Room menu',
    copy: 'Open this button for a mood check-in, your inventory, and the shop where decorations are bought.',
  },
]

function emptyProfile() {
  return {
    id: '',
    email: '',
    name: '',
    avatar: '🐨',
    gender: '',
    age: '',
    religion: '',
    favouriteGenres: [],
    location: '',
    discoverable: false,
  }
}

function guideKey(id) {
  return `readalot-guide:${id}`
}

export const useUserStore = defineStore('user', () => {
  const profile = ref(emptyProfile())
  const ready = ref(false)
  const guideStep = ref(-1)
  const readers = ref(structuredClone(usersData))
  let stopWatch = () => {}

  const readersByCompatibility = computed(() =>
    [...readers.value].sort((a, b) => b.compatibility - a.compatibility),
  )

  const signedIn = computed(() => Boolean(profile.value.id))
  const profileComplete = computed(() => Boolean(profile.value.name))
  const guide = computed(() => (guideStep.value >= 0 ? GUIDE_STEPS[guideStep.value] : null))
  const guideCount = computed(() => GUIDE_STEPS.length)

  function findReader(id) {
    return readers.value.find((reader) => reader.id === id) ?? null
  }

  function applySession(session) {
    const user = session?.user
    if (!user) {
      profile.value = emptyProfile()
      return
    }
    const meta = user.user_metadata || {}
    profile.value = {
      id: user.id,
      email: user.email || '',
      name: meta.name || '',
      avatar: meta.avatar || '🐨',
      gender: meta.gender || '',
      age: meta.age ?? '',
      religion: meta.religion || '',
      favouriteGenres: Array.isArray(meta.favouriteGenres) ? meta.favouriteGenres : [],
      location: meta.location || '',
      discoverable: meta.discoverable === true,
    }
  }

  async function restore() {
    if (ready.value) return
    const { data } = await currentSession()
    applySession(data.session)
    stopWatch()
    stopWatch = watchAuth(applySession)
    ready.value = true
  }

  function openGuideIfNew() {
    if (guideStep.value >= 0) return
    if (!profile.value.id || !profile.value.name) return
    if (localStorage.getItem(guideKey(profile.value.id)) === 'seen') return
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

  function closeGuide() {
    if (profile.value.id) localStorage.setItem(guideKey(profile.value.id), 'seen')
    guideStep.value = -1
  }

  function dismissGuide() {
    guideStep.value = -1
  }

  function mergeProfile(details) {
    profile.value = {
      ...profile.value,
      ...details,
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
    findReader,
    applySession,
    restore,
    openGuideIfNew,
    nextGuide,
    closeGuide,
    dismissGuide,
    mergeProfile,
  }
})
