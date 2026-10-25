// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import usersData from '@/data/users.json'
import { currentSession, watchAuth } from '@/services/auth.js'

const GUIDE_STEPS = [
  {
    id: 'window',
    to: '/house',
    target: '[data-tour="window"]',
    title: 'The window',
    copy: 'This is the weather outside. Sun, cloud, and rain all move across the glass, and the temperature sits in the corner.',
  },
  {
    id: 'clock',
    to: '/house',
    target: '[data-tour="clock"]',
    title: 'The clock',
    copy: 'The clock on the wall shows the time in Singapore.',
  },
  {
    id: 'credits',
    to: '/house',
    target: '[data-tour="credits"]',
    title: 'Credits',
    copy: 'This is your spending money. Buying something in the shop takes credits from here.',
  },
  {
    id: 'shelf',
    to: '/house',
    target: '[data-tour="shelf"]',
    title: 'Your bookshelf',
    copy: 'Tap the shelf to open it. Reading, to read, and finished each have a row, and you can switch between spines and covers.',
  },
  {
    id: 'quote',
    to: '/house',
    target: '[data-tour="quote"]',
    title: 'Quote of the day',
    copy: 'The note stuck on the shelf opens today’s quote.',
  },
  {
    id: 'chair',
    to: '/house',
    target: '[data-tour="chair"]',
    title: 'Currently reading',
    copy: 'The book on the chair is the one you are reading now. Tap it to see that book.',
  },
  {
    id: 'menu',
    to: '/house',
    target: '[data-tour="menu"]',
    title: 'Room menu',
    copy: 'Open this button for a mood check-in, your inventory, and the shop where decorations are bought.',
  },
  {
    id: 'discover-search',
    to: '/library',
    target: '[data-tour="discover-search"]',
    title: 'Search',
    copy: 'Type a title or an author. Search opens a results page, and Back brings you here.',
  },
  {
    id: 'discover-filters',
    to: '/library',
    target: '[data-tour="discover-filters"]',
    title: 'Shelf filters',
    copy: 'These chips narrow the shelves. For You shows all of them. Genres, Awards, and Community each show their own set.',
  },
  {
    id: 'discover-shelf',
    to: '/library',
    target: '[data-tour="discover-shelf"]',
    title: 'A shelf',
    copy: 'Swipe the covers. Tap one for a preview, or See all to open that whole genre.',
  },
  {
    id: 'people-search',
    to: '/cafe',
    target: '[data-tour="people-search"]',
    title: 'Find a reader',
    copy: 'Search by name or a favourite genre. The list and the map both follow what you type.',
  },
  {
    id: 'people-map',
    to: '/cafe',
    target: '[data-tour="people-map"]',
    title: 'Readers on the map',
    copy: 'Pins are other readers in Singapore. Tap a pin to choose someone, then visit their room.',
  },
  {
    id: 'people-follow',
    to: '/cafe',
    target: '[data-tour="people-follow"]',
    title: 'Follow',
    copy: 'Follow keeps that reader. The match score is how much your books and genres overlap.',
  },
  {
    id: 'scan-camera',
    to: '/scan',
    target: '[data-tour="scan-camera"]',
    title: 'The camera',
    copy: 'Point this at a book cover. If the camera is blocked, you can still add a photo below.',
  },
  {
    id: 'scan-snap',
    to: '/scan',
    target: '[data-tour="scan-snap"]',
    title: 'Snap cover',
    copy: 'Snap reads the cover and looks up the book. A match opens so you can put it on a shelf.',
  },
  {
    id: 'scan-upload',
    to: '/scan',
    target: '[data-tour="scan-upload"]',
    title: 'Upload a photo',
    copy: 'A photo of the cover works the same way as the camera.',
  },
  {
    id: 'profile-edit',
    to: '/salon',
    target: '[data-tour="profile-edit"]',
    title: 'Edit profile',
    copy: 'Change your name, avatar, age, genres, and the rest. It stays on this page.',
  },
  {
    id: 'profile-shelves',
    to: '/salon',
    target: '[data-tour="profile-shelves"]',
    title: 'Your lists',
    copy: 'Reading, To read, and Finished. Tap a number to see the books in that list.',
  },
  {
    id: 'profile-shop',
    to: '/salon',
    target: '[data-tour="profile-shop"]',
    title: 'Coins',
    copy: 'This is the same balance as the room. Visit the shop to spend coins on decorations.',
  },
  {
    id: 'profile-map',
    to: '/salon',
    target: '[data-tour="profile-map"]',
    title: 'People map',
    copy: 'Turn this on if other readers may find your room on the People map.',
  },
  {
    id: 'profile-logout',
    to: '/salon',
    target: '[data-tour="profile-logout"]',
    title: 'Log out',
    copy: 'This asks before it closes the book. Logging in again skips this tour.',
  },
]

const TOUR_PENDING = 'readalot-tour-pending'

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

  function expectTour() {
    sessionStorage.setItem(TOUR_PENDING, '1')
  }

  function clearTour() {
    sessionStorage.removeItem(TOUR_PENDING)
  }

  function openGuideIfNew() {
    if (guideStep.value >= 0) return
    if (!profile.value.id || !profile.value.name) return
    if (sessionStorage.getItem(TOUR_PENDING) !== '1') return
    if (localStorage.getItem(guideKey(profile.value.id)) === 'seen') {
      sessionStorage.removeItem(TOUR_PENDING)
      return
    }
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
    sessionStorage.removeItem(TOUR_PENDING)
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
    expectTour,
    clearTour,
    openGuideIfNew,
    nextGuide,
    closeGuide,
    dismissGuide,
    mergeProfile,
  }
})
