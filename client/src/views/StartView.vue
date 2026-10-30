<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The landing page a first-time visitor sees before signing in, under the name IKDA. A bar stays
// on top with a link to each section and Sign up. It opens on the town map in daylight with the
// IKDA sign and the way in; then, as the visitor scrolls, evening falls over the sky behind the
// page (StartBackdrop): Meet Maya, the town's buildings, making your character, levels, how it
// works, questions, and finally your house at night with Sign up again. The words fade in as they
// arrive. Leaving through Sign up or Log in remembers the page has been seen (lib/landing.js), so
// after that the router sends visitors straight to sign in.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { prefersReducedMotion } from '@/lib/motion'
import { markLandingSeen } from '@/lib/landing.js'
import { presetCharacter } from '@/lib/avatar/catalogue.js'
import { useScrollFade } from '@/composables/useScrollFade.js'
import StartNav from '@/components/start/StartNav.vue'
import StartHero from '@/components/start/StartHero.vue'
import StartBackdrop from '@/components/start/StartBackdrop.vue'
import StartPersona from '@/components/start/StartPersona.vue'
import StartTown from '@/components/start/StartTown.vue'
import StartCharacter from '@/components/start/StartCharacter.vue'
import StartLevels from '@/components/start/StartLevels.vue'
import StartSteps from '@/components/start/StartSteps.vue'
import StartFaq from '@/components/start/StartFaq.vue'
import StartEnd from '@/components/start/StartEnd.vue'

const NAV = [
  { id: 'maya', label: 'Meet Maya' },
  { id: 'town', label: 'The town' },
  { id: 'you', label: 'Your character' },
  { id: 'levels', label: 'Levels' },
  { id: 'how', label: 'How it works' },
  { id: 'faq', label: 'FAQ' },
]

// the character the visitor makes, shown again on the level badge and at their door
const character = ref(presetCharacter('rosie'))
const name = ref('')

const scroller = ref(null)
useScrollFade(scroller, { hold: 0.1, span: 0.35, drift: 20 })

// how far down the page the visitor is (0 to 1), for the sky
const progress = ref(0)
let frame = 0

function measure() {
  frame = 0
  const el = scroller.value
  // the page may have been left since this was asked for
  if (!el) return
  const room = el.scrollHeight - el.clientHeight
  progress.value = room > 0 ? el.scrollTop / room : 0
}

function onScroll() {
  if (!frame) frame = window.requestAnimationFrame(measure)
}

// the section most in view, for the bar
const active = ref('')
let watcher = null
// while the page scrolls to a section picked in the bar, the bar keeps that one marked
let heading = ''
let headingTimer = 0

function arrive() {
  heading = ''
  window.clearTimeout(headingTimer)
}

function go(id) {
  const target = document.getElementById(`start-${id}`)
  if (!target) return
  active.value = NAV.some((item) => item.id === id) ? id : ''
  heading = id
  window.clearTimeout(headingTimer)
  // scrollend says when the page has got there; the timer is for browsers without it
  headingTimer = window.setTimeout(arrive, 1200)
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}

onMounted(() => {
  // the router names every page "… · Readalot"; the landing page goes by IKDA
  document.title = 'IKDA · Social media, but for book lovers'
  measure()
  scroller.value.addEventListener('scrollend', arrive)
  if (!('IntersectionObserver' in window)) return
  watcher = new IntersectionObserver(
    (entries) => {
      if (heading) return
      for (const entry of entries) {
        const id = entry.target.id.replace('start-', '')
        if (entry.isIntersecting) active.value = NAV.some((item) => item.id === id) ? id : ''
      }
    },
    // a section counts as in view while it crosses the middle of the screen
    { root: scroller.value, rootMargin: '-50% 0px -50% 0px' },
  )
  for (const el of scroller.value.querySelectorAll('section[id^="start-"]')) watcher.observe(el)
})

onBeforeUnmount(() => {
  watcher?.disconnect()
  window.clearTimeout(headingTimer)
  scroller.value?.removeEventListener('scrollend', arrive)
  window.cancelAnimationFrame(frame)
})
</script>

<template>
  <div class="start">
    <StartBackdrop :progress="progress" />
    <div ref="scroller" class="start__scroll" @scroll.passive="onScroll">
      <StartNav :items="NAV" :active="active" @go="go" @choose="markLandingSeen" />
      <StartHero @choose="markLandingSeen" @how="go('how')" />
      <StartPersona />
      <StartTown />
      <StartCharacter v-model:character="character" v-model:name="name" />
      <StartLevels :character="character" />
      <StartSteps />
      <StartFaq />
      <StartEnd :character="character" :name="name" @choose="markLandingSeen" />
    </div>
  </div>
</template>

<style>
/* Nunito for buttons, tabs and small labels, as on the IKDA page */
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&display=swap');
</style>

<style scoped>
/* the landing page's colours: warm paper and dark pixel outlines, with the sign's blue and gold
   and a green for the way in. Words are in the serif; buttons and labels in Nunito. */
.start {
  --s-ink: #2b1d24;
  --s-paper: #fff8ef;
  --s-paper-dark: #f4e6d6;
  --s-muted: #6e5b52;
  --s-blue: #2f5fb3;
  --s-gold: #f6e27a;
  --s-green: #3fae5a;
  --s-pink: #d0608e;
  --s-ui: 'Nunito', 'Trebuchet MS', system-ui, sans-serif;
  position: relative;
  height: 100%;
  overflow: hidden;
  background: #1e1a24;
  color: var(--s-ink);
  font-family: var(--rl-font-title);
  font-size: 17px;
}

.start :deep(:where(button, input, .actions__btn, .actions__login, .start-nav__signup, .place__name, .inside__tab, .controls__label, .end__tag, .step__number, .step__time, .step__where, .step__gets, .badge__level, .badge__coins, .badge__news, .badge__next, .hero__note)) {
  font-family: var(--s-ui);
}

/* the name in the bar stays in the sign's serif */
.start :deep(.start-nav__brand) {
  font-family: var(--rl-font-title);
}

.start__scroll {
  position: absolute;
  inset: 0;
  overflow-x: hidden;
  overflow-y: auto;
  scroll-padding-top: 60px;
}

@media (max-width: 575px) {
  .start__scroll {
    scroll-padding-top: 100px;
  }
}
</style>
