<script setup>
// Opening shelf. Flat motion only: rise, scale, and fade.
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { gsap, prefersReducedMotion } from '@/lib/motion'

const emit = defineEmits(['done'])
const root = ref(null)
const router = useRouter()
const spines = ['#3f2e24', '#6b4a34', '#9a7a55', '#c49264', '#2c241e', '#7e7065', '#e7d3bc']
const letters = 'Readalot'.split('')

onMounted(async () => {
  await router.isReady()
  if (prefersReducedMotion() || !root.value) {
    emit('done')
    return
  }
  const q = (selector) => root.value.querySelectorAll(selector)
  const tl = gsap.timeline({
    defaults: { force3D: false },
    onComplete: () => emit('done'),
  })
  tl.from(q('.boot__spine'), { y: 56, stagger: 0.07, duration: 0.5, ease: 'power2.out' })
    .from(q('.boot__letter'), { y: 16, autoAlpha: 0, stagger: 0.045, duration: 0.32 }, '-=0.25')
    .from(q('.boot__rule'), { scaleX: 0, duration: 0.55, ease: 'power1.out' }, '-=0.05')
    .from(q('.boot__glow'), { autoAlpha: 0, scale: 0.7, duration: 0.9 }, 0)
    .from(q('.boot__mote'), { y: 20, autoAlpha: 0, stagger: 0.08, duration: 0.6 }, 0.1)
    .to(root.value, { autoAlpha: 0, duration: 0.45 }, '+=0.45')
})
</script>

<template>
  <div ref="root" class="boot" role="status" aria-live="polite">
    <span class="boot__glow" />
    <span class="boot__mote boot__mote--a" />
    <span class="boot__mote boot__mote--b" />
    <span class="boot__mote boot__mote--c" />
    <p class="boot__brand" aria-label="Readalot">
      <span v-for="(letter, index) in letters" :key="index" class="boot__letter">{{ letter }}</span>
    </p>
    <span class="boot__rule" />
    <p class="boot__note">Opening your shelf</p>
    <div class="boot__shelf" aria-hidden="true">
      <span v-for="(color, index) in spines" :key="index" class="boot__spine" :style="{ background: color }" />
    </div>
  </div>
</template>

<style scoped>
.boot {
  position: absolute;
  inset: 0;
  z-index: 80;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 18%, rgba(255, 253, 249, 0.95), transparent 42%),
    linear-gradient(180deg, #f8f2e9 0%, #e7dccb 100%);
  color: var(--rl-text);
}

.boot__glow {
  position: absolute;
  top: 12%;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 253, 249, 0.95), rgba(196, 146, 100, 0.18) 46%, transparent 70%);
}

.boot__mote {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 253, 249, 0.9);
}

.boot__mote--a { left: 18%; top: 28%; }
.boot__mote--b { right: 16%; top: 22%; width: 6px; height: 6px; background: rgba(154, 122, 85, 0.55); }
.boot__mote--c { left: 70%; top: 64%; width: 5px; height: 5px; }

.boot__brand {
  position: relative;
  margin: 0;
  font-family: var(--rl-font-title);
  font-size: 2.4rem;
  letter-spacing: 0.04em;
  color: var(--rl-primary);
}

.boot__letter {
  display: inline-block;
}

.boot__rule {
  position: relative;
  width: 120px;
  height: 2px;
  margin: 12px 0 8px;
  background: var(--rl-accent);
  transform-origin: left center;
}

.boot__note {
  position: relative;
  margin: 0 0 28px;
  color: var(--rl-muted);
  font-size: 0.85rem;
  letter-spacing: 0.08em;
}

.boot__shelf {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 92px;
  padding: 0 8px 8px;
  border-bottom: 8px solid #6b4a34;
}

.boot__spine {
  width: 18px;
  height: 74px;
  border-radius: 2px 2px 0 0;
}

.boot__spine:nth-child(2) { height: 86px; }
.boot__spine:nth-child(4) { height: 64px; }
.boot__spine:nth-child(5) { height: 80px; }
.boot__spine:nth-child(7) { height: 58px; }
</style>
