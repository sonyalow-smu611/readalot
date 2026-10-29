<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The landing page's bar, which stays at the top while the page scrolls: the name (back to the
// top), a link to each section (the one in view is marked) and Sign up. Picking a section asks
// the page to go there. The dark highlight slides along to the marked link, and on a phone the
// row of links scrolls to keep it in view. Warm paper with a dark pixel line, like the cards.
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { prefersReducedMotion } from '@/lib/motion'

const props = defineProps({
  // [{ id, label }]
  items: { type: Array, required: true },
  // the section in view, if any
  active: { type: String, default: '' },
})
const emit = defineEmits(['go', 'choose'])

const row = ref(null)
const links = {}
const highlight = ref({ opacity: 0 })

function place() {
  const link = links[props.active]
  if (!link || !row.value) {
    highlight.value = { ...highlight.value, opacity: 0 }
    return
  }
  highlight.value = { opacity: 1, width: `${link.offsetWidth}px`, transform: `translateX(${link.offsetLeft}px)` }
  // keep the marked link in view when the row is wider than the screen
  const left = link.offsetLeft - (row.value.clientWidth - link.offsetWidth) / 2
  row.value.scrollTo({ left, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

watch(() => props.active, place)
onMounted(() => {
  nextTick(place)
  window.addEventListener('resize', place)
})
onBeforeUnmount(() => window.removeEventListener('resize', place))
</script>

<template>
  <nav class="start-nav" aria-label="Landing page">
    <button type="button" class="start-nav__brand" aria-label="IKDA, back to the top" @click="emit('go', 'home')">IKDA</button>
    <div ref="row" class="start-nav__links">
      <span class="start-nav__highlight" :style="highlight" aria-hidden="true" />
      <button
        v-for="item in items"
        :key="item.id"
        :ref="(el) => (links[item.id] = el)"
        type="button"
        class="start-nav__link"
        :class="{ 'is-active': active === item.id }"
        :aria-current="active === item.id ? 'true' : undefined"
        @click="emit('go', item.id)"
      >
        {{ item.label }}
      </button>
    </div>
    <RouterLink :to="{ name: 'register' }" class="start-nav__signup" @click="emit('choose')">Sign up</RouterLink>
  </nav>
</template>

<style scoped>
.start-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 16px;
  height: 60px;
  margin-bottom: -60px;
  padding: 0 20px;
  background: rgba(255, 248, 239, 0.94);
  border-bottom: 3px solid var(--s-ink);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.start-nav__brand {
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: none;
  font-family: var(--rl-font-title);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--s-blue);
  text-shadow: 0 2px 0 var(--s-gold);
}

.start-nav__links {
  position: relative;
  display: flex;
  gap: 2px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.start-nav__links::-webkit-scrollbar {
  display: none;
}

/* the dark highlight behind the marked link; it slides from one link to the next */
.start-nav__highlight {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-radius: 4px;
  background: var(--s-ink);
  transition: transform 0.3s ease, width 0.3s ease, opacity 0.2s ease;
}

.start-nav__link {
  position: relative;
  flex-shrink: 0;
  padding: 6px 12px;
  border: 0;
  border-radius: 4px;
  background: none;
  color: var(--s-ink);
  font-size: 14px;
  font-weight: 600;
}

.start-nav__link:hover {
  background: var(--s-paper-dark);
}

.start-nav__link.is-active {
  color: var(--s-paper);
  transition: color 0.2s ease;
}

.start-nav__link.is-active:hover {
  background: none;
}

.start-nav__signup {
  flex-shrink: 0;
  padding: 6px 16px;
  border: 3px solid var(--s-ink);
  border-radius: 6px;
  background: var(--s-green);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 3px 0 var(--s-ink);
}

@media (prefers-reduced-motion: reduce) {
  .start-nav__highlight {
    transition: none;
  }
}

@media (max-width: 575px) {
  .start-nav {
    flex-wrap: wrap;
    align-content: center;
    row-gap: 6px;
    height: 100px;
    margin-bottom: -100px;
    padding: 0 12px;
  }

  .start-nav__brand {
    margin-right: auto;
    font-size: 20px;
  }

  .start-nav__links {
    order: 3;
    flex-basis: 100%;
  }
}
</style>
