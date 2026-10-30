<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
import { nextTick, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import { useToast } from '@/composables/useToast'

const { state, hide } = useToast()
const el = ref(null)

function act() {
  const { run } = state.action
  hide()
  run()
}

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
  <p v-if="state.visible" ref="el" class="app-toast" role="status">
    {{ state.message }}
    <button v-if="state.action" type="button" class="btn btn-accent btn-sm app-toast__action" @click="act">{{ state.action.label }}</button>
  </p>
</template>

<style scoped>
.app-toast {
  position: absolute;
  left: 50%;
  bottom: 88px;
  z-index: 30;
  max-width: calc(100% - 32px);
  /* the message and its button (Undo) side by side */
  display: flex;
  align-items: center;
  gap: 12px;
  width: max-content;
  margin: 0;
  padding: 10px 16px;
  transform: translateX(-50%);
  font-family: var(--font-heading);
  font-weight: 600;
  text-align: center;
  background: var(--ink);
  color: var(--paper);
  border: var(--outline);
  border-radius: 999px;
  box-shadow: var(--shadow-sticker-sm);
}

.app-toast__action {
  flex: none;
}
</style>
