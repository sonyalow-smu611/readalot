// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
// Vue Router — maps URLs to views so every tab is deep-linkable and the back button works.
import { createRouter, createWebHistory } from 'vue-router'
import RoomView from '@/views/RoomView.vue'
import BookDetailsView from '@/views/BookDetailsView.vue'
import DiscoverBooksView from '@/views/DiscoverBooksView.vue'
import DiscoverPeopleView from '@/views/DiscoverPeopleView.vue'
import GenreShelfView from '@/views/GenreShelfView.vue'
import MoodView from '@/views/MoodView.vue'
import PlaygroundView from '@/views/PlaygroundView.vue'
import ProfileView from '@/views/ProfileView.vue'
import ReaderRoomView from '@/views/ReaderRoomView.vue'
import ReaderShelfView from '@/views/ReaderShelfView.vue'
import ScanBookView from '@/views/ScanBookView.vue'
import SearchView from '@/views/SearchView.vue'
import LoginView from '@/views/LoginView.vue'
import VerifyView from '@/views/VerifyView.vue'
import WelcomeView from '@/views/WelcomeView.vue'
import { useUserStore } from '@/stores/user'

// `meta.order` is the tab a page belongs to (left→right in the bottom nav); it decides which
// way the page slides in. `meta.fullBleed` pages fill the frame and skip the shared header.
const routes = [
  { path: '/', name: 'room', component: RoomView, meta: { title: 'My Room', fullBleed: true, order: 0 } },
  { path: '/room', redirect: '/' },
  { path: '/discover', name: 'discover-books', component: DiscoverBooksView, meta: { order: 1 } },
  { path: '/discover/:genre', name: 'genre-shelf', component: GenreShelfView, meta: { order: 1 } },
  { path: '/search', name: 'search', component: SearchView, meta: { order: 1 } },
  { path: '/people', name: 'discover-people', component: DiscoverPeopleView, meta: { order: 2 } },
  { path: '/people/:id', name: 'reader-room', component: ReaderRoomView, meta: { order: 2 } },
  { path: '/people/:id/shelf', name: 'reader-shelf', component: ReaderShelfView, meta: { order: 2 } },
  { path: '/scan', name: 'scan-book', component: ScanBookView, meta: { order: 3 } },
  { path: '/profile', name: 'profile', component: ProfileView, meta: { title: 'Profile', hideHeader: true, order: 4 } },
  { path: '/books/:id', name: 'book-details', component: BookDetailsView },
  { path: '/login', name: 'login', component: LoginView, meta: { title: 'Sign in', bare: true, guest: true, order: 0 } },
  { path: '/register', name: 'register', component: LoginView, meta: { title: 'Register', bare: true, guest: true, order: 0 } },
  { path: '/verify', name: 'verify', component: VerifyView, meta: { title: 'Verify email', bare: true, guest: true, order: 0 } },
  { path: '/welcome', name: 'welcome', component: WelcomeView, meta: { title: 'Welcome', bare: true, order: 0 } },
  // Not in the bottom nav; kept reachable until these pages are merged.
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
    return { name: user.profileComplete ? 'profile' : 'welcome' }
  }
  if (!user.signedIn && !to.meta.guest) return { name: 'login' }
  if (user.signedIn && user.profileComplete && to.name === 'welcome') {
    return { name: 'profile' }
  }
  if (user.signedIn && !user.profileComplete && to.name !== 'welcome') {
    return { name: 'welcome' }
  }
  return true
})

// Slide toward the tab the user tapped: moving right slides content left, and vice versa.
router.afterEach((to, from) => {
  const toOrder = to.meta.order ?? 0
  const fromOrder = from.meta.order ?? toOrder
  to.meta.transition = toOrder >= fromOrder ? 'slide-left' : 'slide-right'
  document.title = `${to.meta.title ?? 'Home'} · Readalot`
})

export default router
