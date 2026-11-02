<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const root = ref(null)
const card = ref(null)
const spot = ref(null)
const cardOnTop = ref(false)
const hostWidth = ref(0)
// a building on the map: the card sits under it, its arrow pointing up at it
const CARD_WIDTH = 420
const EDGE = 16
const { guide, guideStep, guideCount } = storeToRefs(user)

const ringStyle = computed(() => {
  if (!spot.value) return null
  return {
    top: `${spot.value.top}px`,
    left: `${spot.value.left}px`,
    width: `${spot.value.width}px`,
    height: `${spot.value.height}px`,
  }
})

// under the building, as wide as fits, its arrow lined up with the building's middle
const cardStyle = computed(() => {
  if (!guide.value?.focus || !spot.value) return null
  const width = Math.min(CARD_WIDTH, hostWidth.value - EDGE * 2)
  const middle = spot.value.left + spot.value.width / 2
  const left = Math.min(Math.max(middle - width / 2, EDGE), hostWidth.value - EDGE - width)
  return {
    top: `${spot.value.top + spot.value.height + 14}px`,
    bottom: 'auto',
    left: `${left}px`,
    right: 'auto',
    width: `${width}px`,
    '--arrow-x': `${Math.min(Math.max(middle - left, 24), width - 24)}px`,
  }
})

let hunt = 0

function measure() {
  const host = root.value
  const selector = guide.value?.target
  if (!host || !selector) {
    spot.value = null
    return false
  }
  const target = document.querySelector(selector)
  if (!target) {
    spot.value = null
    return false
  }
  const box = target.getBoundingClientRect()
  if (box.width < 2 || box.height < 2) {
    spot.value = null
    return false
  }
  const hostBox = host.getBoundingClientRect()
  hostWidth.value = hostBox.width
  const pad = 8
  spot.value = {
    top: box.top - hostBox.top - pad,
    left: box.left - hostBox.left - pad,
    width: box.width + pad * 2,
    height: box.height + pad * 2,
  }
  cardOnTop.value = !guide.value?.focus && box.top + box.height / 2 > hostBox.top + hostBox.height * 0.58
  return true
}

function follow() {
  window.clearTimeout(hunt)
  let tries = 0
  const step = () => {
    const selector = guide.value?.target
    const target = selector ? document.querySelector(selector) : null
    if (tries === 0 && target) target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    // a building stop keeps looking until the camera arrives, however long the glide takes on a slow device
    if (measure() || (tries >= 24 && !guide.value?.focus)) return
    tries += 1
    hunt = window.setTimeout(step, 150)
  }
  step()
}

watch(guideStep, async (step) => {
  if (step < 0 || !guide.value) return
  if (route.path !== guide.value.to) {
    await router.push(guide.value.to).catch(() => {})
  }
  await nextTick()
  follow()
  // a building stop's card waits for the camera to arrive (see the watch below)
  if (guide.value.focus) return
  showCard()
}, { immediate: true })

// the camera has settled on the building: the card comes up under it
watch(
  () => Boolean(guide.value?.focus && spot.value),
  async (arrived) => {
    if (!arrived) return
    await nextTick()
    showCard()
  },
)

function showCard() {
  if (!card.value || prefersReducedMotion()) return
  gsap.fromTo(card.value, { y: cardOnTop.value ? -12 : 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, force3D: false })
}

watch(() => route.path, () => {
  if (guide.value) follow()
})

// A new reader's tour begins when they reach the town after Welcome.
watch(() => route.name, (name) => {
  if (name === 'town') user.openGuideIfNew()
}, { immediate: true })

onMounted(() => {
  window.addEventListener('resize', measure)
  if (guide.value) follow()
})
onBeforeUnmount(() => {
  window.clearTimeout(hunt)
  window.removeEventListener('resize', measure)
})
</script>

<template>
  <div v-if="guide" ref="root" class="guide" :class="{ 'guide--top': cardOnTop }">
    <!-- a fly-to step keeps the map in view until the camera arrives, then spotlights the building -->
    <div v-if="!ringStyle && !guide.focus" class="guide__dim" />
    <div v-else-if="ringStyle" class="guide__ring" :class="{ 'guide__ring--building': guide.focus }" :style="ringStyle" />
    <article
      v-show="!guide.focus || ringStyle"
      ref="card"
      class="guide__card"
      :class="{ 'guide__card--under': cardStyle }"
      :style="cardStyle"
    >
      <p class="text-muted mb-1">{{ guideStep + 1 }} of {{ guideCount }}</p>
      <h2 class="h3 mb-2">{{ guide.title }}</h2>
      <p class="mb-3">{{ guide.copy }}</p>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-outline-primary" @click="user.closeGuide()">Skip</button>
        <button type="button" class="btn btn-primary flex-grow-1" @click="user.nextGuide()">
          {{ guideStep === guideCount - 1 ? 'Done' : 'Next' }}
        </button>
      </div>
    </article>
  </div>
</template>

<style scoped>
.guide {
  position: absolute;
  z-index: 25;
  inset: 0 0 var(--rl-nav-height) 0;
  pointer-events: none;
}

.guide__dim {
  position: absolute;
  inset: 0;
  background: rgba(44, 36, 30, 0.55);
}

.guide__ring {
  position: absolute;
  border: 3px solid #fffdf9;
  border-radius: 50%;
  box-shadow:
    0 0 0 4px rgba(154, 122, 85, 0.95),
    0 0 0 9999px rgba(44, 36, 30, 0.55);
  animation: guide-pulse 1.35s ease-in-out infinite;
}

.guide__card {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  z-index: 2;
  padding: 16px;
  pointer-events: auto;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-modal);
  background: var(--rl-surface);
  box-shadow: 0 12px 32px rgba(63, 46, 36, 0.16);
}

.guide__ring--building {
  border-radius: 18px;
}

/* the arrow pointing up at the building */
.guide__card--under::before {
  content: '';
  position: absolute;
  top: -9px;
  left: calc(var(--arrow-x) - 9px);
  width: 18px;
  height: 18px;
  border-top: 1px solid var(--rl-line);
  border-left: 1px solid var(--rl-line);
  background: var(--rl-surface);
  transform: rotate(45deg);
}

.guide--top .guide__card {
  top: 16px;
  bottom: auto;
}

@keyframes guide-pulse {
  50% {
    box-shadow:
      0 0 0 8px rgba(154, 122, 85, 0.28),
      0 0 0 9999px rgba(44, 36, 30, 0.55);
  }
}

@media (prefers-reduced-motion: reduce) {
  .guide__ring {
    animation: none;
  }
}
</style>
