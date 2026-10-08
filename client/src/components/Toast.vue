<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
import { nextTick, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import { useToast } from '@/composables/useToast'

const { state } = useToast()
const el = ref(null)

watch(
  () => state.visible,
  async (visible) => {
    if (!visible || prefersReducedMotion()) return
    await nextTick()
    if (!el.value) return
    gsap.from(el.value, { y: 16, autoAlpha: 0, duration: 0.35, ease: 'back.out(1.7)' })
  },
)
</script>

<template>
  <p v-if="state.visible" ref="el" class="toast" role="status">{{ state.message }}</p>
</template>

<style scoped>
.toast {
  position: absolute;
  left: 50%;
  bottom: 88px;
  z-index: 30;
  max-width: calc(100% - 32px);
  margin: 0;
  padding: 10px 16px;
  transform: translateX(-50%);
  font-family: var(--font-heading);
  font-weight: 600;
  text-align: center;
  background: var(--ink);
  color: var(--cream);
  border: var(--outline);
  border-radius: 999px;
  box-shadow: var(--shadow-sticker-sm);
}
</style>
