<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { justChoseOnLanding } from '@/lib/landing.js'
import PhoneFrame from '@/components/PhoneFrame.vue'
import AppHeader from '@/components/AppHeader.vue'
import DailyDock from '@/components/town/DailyDock.vue'
import BookOpenOverlay from '@/components/BookOpenOverlay.vue'
import GuideTour from '@/components/GuideTour.vue'
import { BAR_HEIGHT } from '@/lib/walkthrough.js'
import LoadingScreen from '@/components/LoadingScreen.vue'
import Toast from '@/components/Toast.vue'
import MusicToggle from '@/components/MusicToggle.vue'
import { useMusicStore } from '@/stores/music.js'

const route = useRoute()
const router = useRouter()
const main = ref(null)
// no page or chrome is drawn until the first page is known, so the landing page opens straight away
const ready = ref(false)
// the town wakes up (LoadingScreen) only when the visitor picks Sign up or Log in on the landing page
const booting = ref(false)
const stopWatching = router.afterEach((to, from, failure) => {
  ready.value = true
  if (!failure && from.name === 'start' && justChoseOnLanding()) booting.value = true
})
onBeforeUnmount(stopWatching)
const { guide, signedIn } = storeToRefs(useUserStore())
const showChrome = computed(() => ready.value && !route.meta.bare)

// Background music plays only for a signed-in reader, never on the landing or sign-in pages, and
// each building has its own track (stores/music.js).
const music = useMusicStore()
watch(
  () => [ready.value, signedIn.value, route.name, Boolean(route.meta.bare)],
  ([isReady, isSignedIn, routeName, bare]) => {
    if (isReady) music.follow({ signedIn: isSignedIn, routeName, bare })
  },
  { immediate: true },
)
// the toggle stays out of the way of the loading screen and the tour's bar
const showMusicToggle = computed(() => showChrome.value && signedIn.value && !booting.value && !guide.value)
// the town has its own Daily button, and the tour shouldn't have anything over it
const showDaily = computed(() => showChrome.value && route.name !== 'town' && !guide.value)

function resetScroll() {
  main.value?.scrollTo({ top: 0 })
}
</script>

<template>
  <PhoneFrame :full="booting || !ready" :class="{ 'app-wall': route.meta.wall }">
    <LoadingScreen v-if="booting" @done="booting = false" />
    <!-- only shows if the first page is slow to arrive, so a quick load doesn't flash it -->
    <p v-if="!ready" class="app-waiting" role="status">Opening the town…</p>
    <!-- full-bleed pages (the room) draw to the edges and bring their own chrome -->
    <AppHeader v-if="showChrome && !route.meta.fullBleed && !route.meta.hideHeader" />
    <main
      ref="main"
      class="app-main"
      :class="route.meta.bare || route.meta.fullBleed ? 'app-main--bleed' : 'container py-4'"
      :style="guide ? { marginBottom: `${BAR_HEIGHT}px` } : null"
    >
      <RouterView v-slot="{ Component, route: current }">
        <Transition :name="current.meta.transition ?? 'fade'" mode="out-in" @before-enter="resetScroll">
          <component :is="Component" :key="current.path" />
        </Transition>
      </RouterView>
    </main>
    <DailyDock v-if="showDaily" />
    <MusicToggle v-if="showMusicToggle" />
    <GuideTour />
    <BookOpenOverlay />
    <Toast />
  </PhoneFrame>
</template>

<style scoped>
/* pages that stand books on bookcases (a genre) sit on the library's wall: parchment with its faint
   wallpaper stripes and a wooden crown along the top, like the search page and the hall */
.app-wall :deep(.phone-frame) {
  border-top: 10px solid #6b4329;
  background:
    repeating-linear-gradient(to right, transparent 0 18px, #e3cba1 18px 24px, transparent 24px 36px),
    #efdcb8;
}

.app-main {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.app-main--bleed {
  overflow: hidden;
}

.app-waiting {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  color: var(--ink-muted);
  animation: app-waiting-in 0.2s ease 0.4s both;
}

@keyframes app-waiting-in {
  from {
    opacity: 0;
  }
}
</style>
