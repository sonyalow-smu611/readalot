<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import PhoneFrame from '@/components/PhoneFrame.vue'
import AppHeader from '@/components/AppHeader.vue'
import BottomNav from '@/components/BottomNav.vue'
import BookOpenOverlay from '@/components/BookOpenOverlay.vue'
import Toast from '@/components/Toast.vue'

const route = useRoute()
const main = ref(null)

function resetScroll() {
  main.value?.scrollTo({ top: 0 })
}
</script>

<template>
  <PhoneFrame>
    <!-- full-bleed pages (the room) draw to the edges and bring their own chrome -->
    <AppHeader v-if="!route.meta.fullBleed" />
    <main
      ref="main"
      class="app-main"
      :class="route.meta.fullBleed ? 'app-main--bleed' : 'container py-4'"
    >
      <RouterView v-slot="{ Component, route: current }">
        <Transition :name="current.meta.transition ?? 'fade'" mode="out-in" @before-enter="resetScroll">
          <component :is="Component" :key="current.path" />
        </Transition>
      </RouterView>
    </main>
    <BottomNav />
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
