// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
// Vue Router — maps URLs to views so every tab is deep-linkable and the back button works.
import { createRouter, createWebHistory } from 'vue-router'
import RoomView from '@/views/RoomView.vue'
import DiscoverView from '@/views/DiscoverView.vue'
import MoodView from '@/views/MoodView.vue'
import PeopleView from '@/views/PeopleView.vue'
import ScanView from '@/views/ScanView.vue'
import PlaygroundView from '@/views/PlaygroundView.vue'

// `meta` drives the bottom tab bar: order (left→right), label, emoji icon and pill colour.
const routes = [
  { path: '/', redirect: '/room' },
  {
    path: '/room',
    name: 'room',
    component: RoomView,
    meta: { tab: true, order: 0, label: 'Room', icon: '🛋️', color: 'butter', title: 'My Room' },
  },
  {
    path: '/discover',
    name: 'discover',
    component: DiscoverView,
    meta: { tab: true, order: 1, label: 'Discover', icon: '🔭', color: 'mint', title: 'Discover' },
  },
  {
    path: '/mood',
    name: 'mood',
    component: MoodView,
    meta: { tab: true, order: 2, label: 'Mood', icon: '🌈', color: 'hot-pink', title: 'Mood' },
  },
  {
    path: '/people',
    name: 'people',
    component: PeopleView,
    meta: { tab: true, order: 3, label: 'People', icon: '👯', color: 'lilac', title: 'People' },
  },
  {
    path: '/scan',
    name: 'scan',
    component: ScanView,
    meta: { tab: true, order: 4, label: 'Scan', icon: '📷', color: 'tangerine', title: 'Scan' },
  },
  {
    path: '/playground',
    name: 'playground',
    component: PlaygroundView,
    meta: { title: 'Playground' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/room' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Slide toward the tab the user tapped: moving right slides content left, and vice versa.
router.afterEach((to, from) => {
  const toOrder = to.meta.order ?? 0
  const fromOrder = from.meta.order ?? toOrder
  to.meta.transition = toOrder >= fromOrder ? 'slide-left' : 'slide-right'
  document.title = `${to.meta.title ?? 'Home'} · Readalot`
})

export default router
