<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
import { computed, onBeforeUnmount, ref } from 'vue'
import { START_LOCATION, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import PhoneFrame from '@/components/PhoneFrame.vue'
import AppHeader from '@/components/AppHeader.vue'
import DailyDock from '@/components/town/DailyDock.vue'
import BookOpenOverlay from '@/components/BookOpenOverlay.vue'
import GuideTour from '@/components/GuideTour.vue'
import LoadingScreen from '@/components/LoadingScreen.vue'
import Toast from '@/components/Toast.vue'

const route = useRoute()
const router = useRouter()
const main = ref(null)
// nothing is drawn until the first page is known, so the landing page opens straight away
const ready = ref(false)
// the town wakes up (LoadingScreen) on the way in: at the first page of a visit, or on leaving
// the landing page through Sign up or Log in. The landing page itself never waits for it.
const booting = ref(false)
const stopWatching = router.afterEach((to, from, failure) => {
  ready.value = true
  if (failure) return
  if (to.name !== 'start' && (from === START_LOCATION || from.name === 'start')) booting.value = true
})
onBeforeUnmount(stopWatching)
const { guide } = storeToRefs(useUserStore())
const showChrome = computed(() => !route.meta.bare)
// the town has its own Daily button, and the tour shouldn't have anything over it
const showDaily = computed(() => !booting.value && showChrome.value && route.name !== 'town' && !guide.value)

function resetScroll() {
  main.value?.scrollTo({ top: 0 })
}
</script>

<template>
  <PhoneFrame :full="booting">
    <LoadingScreen v-if="booting" @done="booting = false" />
    <!-- full-bleed pages (the room) draw to the edges and bring their own chrome -->
    <AppHeader v-if="ready && showChrome && !route.meta.fullBleed && !route.meta.hideHeader" />
    <main
      ref="main"
      class="app-main"
      :class="route.meta.bare || route.meta.fullBleed ? 'app-main--bleed' : 'container py-4'"
    >
      <RouterView v-slot="{ Component, route: current }">
        <Transition :name="current.meta.transition ?? 'fade'" mode="out-in" @before-enter="resetScroll">
          <component :is="Component" :key="current.path" />
        </Transition>
      </RouterView>
    </main>
    <DailyDock v-if="showDaily" />
    <GuideTour />
    <BookOpenOverlay />
    <Toast />
  </PhoneFrame>
</template>

<style scoped>
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
</style>
