<script setup>
// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import AppButton from './AppButton.vue'

const emit = defineEmits(['done'])

const root = ref(null)

const BOOK_SPINES = [
  { color: 'tangerine', height: 64 },
  { color: 'mint', height: 80 },
  { color: 'hot-pink', height: 58 },
  { color: 'lilac', height: 74 },
  { color: 'butter', height: 86 },
]

let context = null
let finished = false

function finish() {
  if (finished) return
  finished = true
  emit('done')
}

function onKeydown(event) {
  if (event.key === 'Escape') finish()
}

// Logo pops, then the room assembles piece by piece, then the curtain lifts.
function playIntro() {
  gsap.timeline({ onComplete: finish })
    .from('.intro__logo', { scale: 0, rotation: -12, duration: 0.7, ease: 'back.out(2.2)' })
    .from('.intro__wall', { scaleY: 0, transformOrigin: '50% 100%', duration: 0.45, ease: 'power3.out' }, '-=0.2')
    .from('.intro__floor', { scaleX: 0, duration: 0.35, ease: 'power2.out' }, '<0.1')
    .from('.intro__window', { scale: 0, duration: 0.5, ease: 'back.out(2.5)' })
    .from('.intro__sky', { y: 20, autoAlpha: 0, duration: 0.4, stagger: 0.1, ease: 'back.out(2)' }, '-=0.15')
    .from('.intro__shelf', { scaleX: 0, transformOrigin: '0% 50%', duration: 0.35, ease: 'power2.out' }, '-=0.3')
    .from('.intro__book', { y: -140, autoAlpha: 0, duration: 0.6, stagger: 0.08, ease: 'bounce.out' }, '-=0.05')
    .from('.intro__plant', { scale: 0, transformOrigin: '50% 100%', duration: 0.45, ease: 'back.out(3)' }, '-=0.35')
    .from('.intro__tagline', { y: 12, autoAlpha: 0, duration: 0.35 }, '-=0.2')
    .to('.intro__logo', { scale: 1.08, duration: 0.18, yoyo: true, repeat: 1, ease: 'power1.inOut' }, '+=0.3')
    .to(root.value, { yPercent: -100, duration: 0.6, ease: 'power3.in' }, '+=0.15')
}

onMounted(() => {
  if (prefersReducedMotion()) {
    finish()
    return
  }
  context = gsap.context(playIntro, root.value)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  context?.revert()
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="intro grain">
    <AppButton variant="cream" class="intro__skip" @click="finish">Skip ⏭</AppButton>

    <p class="intro__logo mb-0"><span aria-hidden="true">📖</span> Readalot</p>

    <div class="intro__room" aria-hidden="true">
      <div class="intro__wall">
        <div class="intro__window">
          <span class="intro__sky intro__sun">☀️</span>
          <span class="intro__sky intro__cloud">☁️</span>
        </div>

        <div class="intro__shelf-unit">
          <div class="intro__books">
            <span
              v-for="spine in BOOK_SPINES"
              :key="spine.color"
              class="intro__book"
              :style="{ height: `${spine.height}px`, background: `var(--${spine.color})` }"
            />
          </div>
          <div class="intro__shelf" />
        </div>

        <span class="intro__plant">🪴</span>
      </div>
      <div class="intro__floor" />
    </div>

    <p class="intro__tagline mb-0">Building your reading room…</p>
  </div>
</template>

<style scoped>
.intro {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  background: var(--cream);
}

.intro__skip {
  position: absolute;
  top: calc(16px + env(safe-area-inset-top));
  right: 16px;
  min-height: 44px;
  padding: 0.4rem 1rem;
  font-size: 0.9rem;
}

.intro__logo {
  padding: 10px 22px;
  font-family: var(--font-heading);
  font-size: 2.4rem;
  font-weight: 700;
  background: var(--lilac);
  border: var(--outline);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sticker);
}

.intro__room {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.intro__wall {
  position: relative;
  width: 260px;
  height: 190px;
  background: var(--butter);
  border: var(--outline);
  border-bottom: 0;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.intro__window {
  position: absolute;
  top: 22px;
  left: 22px;
  width: 88px;
  height: 88px;
  overflow: hidden;
  background: var(--mint);
  border: var(--outline);
  border-radius: var(--radius-sm);
}

.intro__sun {
  position: absolute;
  top: 8px;
  left: 10px;
  font-size: 1.8rem;
}

.intro__cloud {
  position: absolute;
  right: 6px;
  bottom: 10px;
  font-size: 1.6rem;
}

.intro__shelf-unit {
  position: absolute;
  right: 22px;
  bottom: 40px;
  width: 112px;
}

.intro__books {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
}

.intro__book {
  display: block;
  width: 17px;
  border: var(--outline);
  border-radius: 4px 4px 2px 2px;
}

.intro__shelf {
  height: 12px;
  background: var(--tangerine);
  border: var(--outline);
  border-radius: 6px;
  box-shadow: var(--shadow-sticker-sm);
}

.intro__plant {
  position: absolute;
  bottom: 2px;
  left: 30px;
  font-size: 2.6rem;
  line-height: 1;
}

.intro__floor {
  width: 300px;
  height: 14px;
  background: var(--ink);
  border-radius: 8px;
}

.intro__tagline {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--ink-muted);
}
</style>
