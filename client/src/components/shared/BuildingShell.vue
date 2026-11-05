<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The frame every building's page sits in: the same back button everywhere, so no building has
// to build its own. The button goes to the page you came from: from the town that is the town, but
// a building reached from another page (the room's shop from the salon's profile) goes back there,
// to the tab and the place you left. Put the building's page in the default slot. There is no bar: the page's
// own background runs to the top of the screen.
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { backLabelFor } from '@/composables/useGoBack.js'

const props = defineProps({
  title: { type: String, required: true },
  // who builds this building, read out with the title
  owner: { type: String, required: true },
  subtitle: { type: String, default: '' },
  // true for pages that fill the screen and scroll themselves (the room): the back button floats
  // over them, and anything of theirs in the top left starts --building-back-space lower.
  // false adds the usual page padding and scrolling, with the button at the top of the page
  flush: { type: Boolean, default: false },
  // where the back button goes and what it says: the town, unless a page inside a building
  // goes back to that building instead
  back: { type: [String, Object], default: () => ({ name: 'town' }) },
  backLabel: { type: String, default: 'Back to town' },
  // what the button says on a phone when backLabel is too long for it; backLabel is still read out
  backShort: { type: String, default: '' },
})

const router = useRouter()
const route = useRoute()
const pathOf = (path) => String(path).split(/[?#]/)[0]
// the page before this one, when it was inside the app (the router keeps it in the history state)
const previous = computed(() => {
  // read again whenever the address changes: the history state is not reactive
  void route.fullPath
  return typeof window.history.state?.back === 'string' ? window.history.state.back : null
})
// true when that page isn't the one this button would go to anyway
const returns = computed(() => {
  if (!previous.value || pathOf(previous.value) === pathOf(route.path)) return false
  return pathOf(previous.value) !== pathOf(router.resolve(props.back).fullPath)
})

function goBack(event, navigate) {
  if (!returns.value) return navigate(event)
  event.preventDefault()
  router.back()
}
</script>

<template>
  <div class="building-shell" :class="{ 'building-shell--flush': flush }">
    <div class="visually-hidden">
      <h1>{{ title }}</h1>
      <p>{{ subtitle ? `${subtitle} · ` : '' }}{{ owner }}</p>
    </div>
    <RouterLink v-slot="{ href, navigate }" :to="back" custom>
      <a
        :href="href"
        class="btn btn-secondary building-shell__back"
        :aria-label="backShort && !returns ? backLabel : undefined"
        @click="goBack($event, navigate)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        <template v-if="returns">{{ backLabelFor(router, previous) }}</template>
        <template v-else>
          <span v-if="backShort" class="d-sm-none">{{ backShort }}</span>
          <span :class="{ 'd-none d-sm-inline': backShort }">{{ backLabel }}</span>
        </template>
      </a>
    </RouterLink>
    <div :class="flush ? 'building-shell__page' : 'container py-3'">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.building-shell {
  position: relative;
  height: 100%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.building-shell--flush {
  --building-back-space: 58px;
  overflow: hidden;
}

.building-shell__back {
  margin: 10px 0 0 12px;
  font-size: 14px;
}

/* above the page's own controls, below its dialogs (40 and up) */
.building-shell--flush .building-shell__back {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 35;
}

.building-shell__back svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.building-shell__page {
  height: 100%;
}
</style>
