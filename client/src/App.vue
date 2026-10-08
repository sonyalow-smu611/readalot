<script setup>
// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { ref } from 'vue'
import PhoneFrame from '@/components/PhoneFrame.vue'
import IntroAnimation from '@/components/IntroAnimation.vue'
import BottomTabBar from '@/components/BottomTabBar.vue'
import BookOpenOverlay from '@/components/BookOpenOverlay.vue'
import Toast from '@/components/Toast.vue'

// The shell mounts only after the intro so its own entrance animations are actually seen.
const introDone = ref(false)
const main = ref(null)

function resetScroll() {
  main.value?.scrollTo({ top: 0 })
}
</script>

<template>
  <PhoneFrame>
    <IntroAnimation v-if="!introDone" @done="introDone = true" />

    <template v-else>
      <main ref="main" class="app-main">
        <RouterView v-slot="{ Component, route }">
          <Transition :name="route.meta.transition ?? 'fade'" mode="out-in" @before-enter="resetScroll">
            <component :is="Component" :key="route.path" />
          </Transition>
        </RouterView>
      </main>
      <BottomTabBar />
      <BookOpenOverlay />
      <Toast />
    </template>
  </PhoneFrame>
</template>

<style scoped>
.app-main {
  flex: 1 1 auto;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
