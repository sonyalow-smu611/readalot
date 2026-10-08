<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gsap, prefersReducedMotion } from '@/lib/motion'

const router = useRouter()
const route = useRoute()

const bar = ref(null)
const pill = ref(null)

// Tabs come from route meta, so adding a tab only means adding a route.
const tabs = router
  .getRoutes()
  .filter((record) => record.meta.tab)
  .sort((a, b) => a.meta.order - b.meta.order)

const activeIndex = computed(() => tabs.findIndex((tab) => tab.name === route.name))

// The pill is exactly one tab wide, so xPercent = index * 100 lands it on the tab.
function movePill(index, animate) {
  if (index < 0) return
  const position = { xPercent: index * 100 }
  if (!animate || prefersReducedMotion()) {
    gsap.set(pill.value, position)
    return
  }
  gsap.to(pill.value, { ...position, duration: 0.45, ease: 'back.out(1.6)', overwrite: true })
}

function bounceIcon(index) {
  if (prefersReducedMotion()) return
  const icon = bar.value.querySelector(`[data-tab-index="${index}"] .tab-bar__icon`)
  if (!icon) return
  gsap.timeline()
    .to(icon, { y: -8, scale: 1.25, duration: 0.16, ease: 'power2.out' })
    .to(icon, { y: 0, scale: 1, duration: 0.5, ease: 'back.out(3)' })
}

watch(activeIndex, (index) => {
  movePill(index, true)
  bounceIcon(index)
})

onMounted(() => {
  movePill(activeIndex.value, false)
  if (prefersReducedMotion()) return
  gsap.from(bar.value, { yPercent: 120, duration: 0.6, delay: 0.15, ease: 'back.out(1.4)', clearProps: 'transform' })
})
</script>

<template>
  <nav ref="bar" class="tab-bar" aria-label="Main">
    <div class="tab-bar__track">
      <span ref="pill" class="tab-bar__pill" aria-hidden="true" />
      <RouterLink
        v-for="(tab, index) in tabs"
        :key="tab.name"
        :to="tab.path"
        :data-tab-index="index"
        class="tab-bar__link"
        :class="{ 'is-active': index === activeIndex }"
      >
        <span class="tab-bar__icon" aria-hidden="true">{{ tab.meta.icon }}</span>
        <span class="tab-bar__label">{{ tab.meta.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.tab-bar {
  flex: none;
  position: relative;
  z-index: 10;
  padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
  background: var(--paper);
  border-top: 1px solid rgba(28, 27, 25, 0.16);
}

.tab-bar__track {
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
}

.tab-bar__pill {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 0;
  width: 20%;
  background: rgba(28, 27, 25, 0.06);
  border-radius: 12px;
}

.tab-bar__link {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 56px;
  color: var(--ink-muted);
  text-decoration: none;
  border-radius: var(--radius-sm);
  touch-action: manipulation;
}

.tab-bar__link.is-active {
  color: var(--ink);
}

.tab-bar__icon {
  display: inline-block;
  font-size: 1.45rem;
  line-height: 1;
}

.tab-bar__label {
  font-family: var(--font-body);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.01em;
}
</style>
