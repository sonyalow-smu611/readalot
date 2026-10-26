// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import usersData from '@/data/users.json'
import { currentSession, watchAuth } from '@/services/auth.js'
import { normaliseCharacter } from '@/lib/avatar/catalogue.js'

// A new reader's first tour. It starts in the town: the camera flies to each building (focus:
// a place id from town/places.js, which TownView glides to), then the town's buttons are pointed
// out (found by their labels), then it visits each building. A step with no target and no
// focus shows its card over a dimmed screen.
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
    target: null,
    focus: 'house',
    title: 'Your house',
    copy: 'This blue house is yours. Inside is My Room: your bookshelf, the window with the live weather, and the chair with the book you are reading.',
  },
  {
    id: 'town-library',
    to: '/',
    target: null,
    focus: 'library',
    title: 'The library',
    copy: 'Discover books here: search for a title, browse shelves by genre, and open any book to read about it.',
  },
  {
    id: 'town-cafe',
    to: '/',
    target: null,
    focus: 'cafe',
    title: 'The cafe',
    copy: 'Meet other readers. See who reads like you, find them on the map, and follow them.',
  },
  {
    id: 'town-salon',
    to: '/',
    target: null,
    focus: 'salon',
    title: 'The hair salon',
    copy: 'Restyle your character here, and edit your profile, your lists and your privacy.',
  },
  {
    id: 'town-friend',
    to: '/',
    target: null,
    focus: 'friend-reader-emma',
    title: 'Friends’ houses',
    copy: 'The small houses belong to readers you know. Tap one to visit their room and see their shelves.',
  },
  {
    id: 'town-places',
    to: '/',
    target: '[aria-controls="town-places"]',
    title: 'Places',
    copy: 'Lost? Places lists every building and every friend’s house. Pick one and the map takes you there.',
  },
  {
    id: 'town-weather',
    to: '/',
    target: '.weather-button',
    title: 'Live weather',
    copy: 'The sky follows the real weather in Singapore. Tap it to preview day, night and rain.',
  },
  {
    id: 'town-scan',
    to: '/',
    target: '[aria-label="Scan a book"]',
    title: 'Scan a book',
    copy: 'Point your camera at a cover to put a book on your shelves.',
  },
  {
    id: 'town-you',
    to: '/',
    target: '[aria-label="Your profile"]',
    title: 'That’s you',
    copy: 'Your name opens the Hair Salon, where you restyle your character and edit your profile. Next, a look inside your house.',
  },
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
    id: 'salon-studio',
    to: '/salon',
    target: '[data-tour="salon-studio"]',
    title: 'The style studio',
    copy: 'Pick a look, roll a surprise, or change your hair, skin, outfit and extras. The mirror shows each change, and Save look keeps it.',
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
    // the town character, always complete and valid (see lib/avatar/catalogue.js)
    character: normaliseCharacter(null),
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
      character: normaliseCharacter(meta.character),
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
