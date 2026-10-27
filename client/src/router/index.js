// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
// Vue Router — maps URLs to views so every building is deep-linkable and the back button works.
import { createRouter, createWebHistory } from 'vue-router'
import BookDetailsView from '@/views/BookDetailsView.vue'
import DiscoverPeopleView from '@/views/DiscoverPeopleView.vue'
import GenreShelfView from '@/views/GenreShelfView.vue'
import MoodView from '@/views/MoodView.vue'
import PlaygroundView from '@/views/PlaygroundView.vue'
import ReaderRoomView from '@/views/ReaderRoomView.vue'
import ReaderShelfView from '@/views/ReaderShelfView.vue'
import ScanBookView from '@/views/ScanBookView.vue'
import SearchView from '@/views/SearchView.vue'
import LoginView from '@/views/LoginView.vue'
import VerifyView from '@/views/VerifyView.vue'
import WelcomeView from '@/views/WelcomeView.vue'
import { useUserStore } from '@/stores/user'

// `meta.order` decides which way a page slides in: deeper pages (higher) slide in from the
// right. `meta.fullBleed` pages fill the frame and skip the shared header.
const routes = [
  // The town is home; each building opens one teammate's page (src/buildings/).
  // Phaser loads only with the town.
  { path: '/', name: 'town', component: () => import('@/views/TownView.vue'), meta: { title: 'Town', fullBleed: true, wide: true, order: 0 } },
  { path: '/house', name: 'house', component: () => import('@/buildings/house/HouseView.vue'), meta: { title: 'My Room', fullBleed: true, wide: true, order: 1 } },
  { path: '/house/shelf', name: 'my-shelf', component: () => import('@/buildings/house/ShelfView.vue'), meta: { title: 'My Shelf', fullBleed: true, wide: true, order: 2 } },
  { path: '/library', name: 'library', component: () => import('@/buildings/library/LibraryView.vue'), meta: { title: 'Library', fullBleed: true, order: 1 } },
  { path: '/cafe', name: 'cafe', component: () => import('@/buildings/cafe/CafeView.vue'), meta: { title: 'Cafe', fullBleed: true, order: 1 } },
  { path: '/salon', name: 'salon', component: () => import('@/buildings/salon/SalonView.vue'), meta: { title: 'Hair Salon', fullBleed: true, order: 1 } },
  // The old addresses, and the names the pages link to, now open the buildings.
  { path: '/room', name: 'room', redirect: { name: 'house' } },
  { path: '/discover', name: 'discover-books', redirect: { name: 'library' } },
  { path: '/people', name: 'discover-people', redirect: { name: 'cafe' } },
  { path: '/profile', name: 'profile', redirect: { name: 'salon' } },
  // Pages opened from inside a building
  { path: '/discover/:genre', name: 'genre-shelf', component: GenreShelfView, meta: { title: 'Discover', back: true, order: 2 } },
  { path: '/search', name: 'search', component: SearchView, meta: { title: 'Search', back: true, hideSearch: true, order: 2 } },
  { path: '/people/:id', name: 'reader-room', component: ReaderRoomView, meta: { order: 2 } },
  { path: '/people/:id/shelf', name: 'reader-shelf', component: ReaderShelfView, meta: { order: 3 } },
  { path: '/scan', name: 'scan-book', component: ScanBookView, meta: { order: 2 } },
  { path: '/books/:id', name: 'book-details', component: BookDetailsView, meta: { title: 'Book details', fullBleed: true, order: 3 } },
  { path: '/login', name: 'login', component: LoginView, meta: { title: 'Sign in', bare: true, guest: true, order: 0 } },
  { path: '/register', name: 'register', component: LoginView, meta: { title: 'Register', bare: true, guest: true, order: 0 } },
  { path: '/verify', name: 'verify', component: VerifyView, meta: { title: 'Verify email', bare: true, guest: true, order: 0 } },
  { path: '/welcome', name: 'welcome', component: WelcomeView, meta: { title: 'Welcome', bare: true, order: 0 } },
  // Not in the town yet; kept reachable until these pages are merged.
  { path: '/mood', name: 'mood', component: MoodView, meta: { title: 'Mood' } },
  { path: '/playground', name: 'playground', component: PlaygroundView, meta: { title: 'Playground' } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const user = useUserStore()
  if (!user.ready) await user.restore()
  if (user.signedIn && to.meta.guest) {
    return { name: user.profileComplete ? 'town' : 'welcome' }
  }
  if (!user.signedIn && !to.meta.guest) return { name: 'login' }
  if (user.signedIn && user.profileComplete && to.name === 'welcome') {
    return { name: 'town' }
  }
  if (user.signedIn && !user.profileComplete && to.name !== 'welcome') {
    return { name: 'welcome' }
  }
  return true
})

// Going deeper (town → building → book) slides the page in from the right; coming back, from the left.
router.afterEach((to, from) => {
  const toOrder = to.meta.order ?? 0
  const fromOrder = from.meta.order ?? toOrder
  to.meta.transition = toOrder >= fromOrder ? 'slide-left' : 'slide-right'
  document.title = `${to.meta.title ?? 'Home'} · Readalot`
})

export default router
