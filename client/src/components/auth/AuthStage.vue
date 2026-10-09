<script setup>
import { ref } from 'vue'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import { bookSpots } from '@/lib/floatBooks'
import DeskMascots from '@/components/auth/DeskMascots.vue'
import FloatingBooks from '@/components/auth/FloatingBooks.vue'

const props = defineProps({
  gaze: { type: String, default: 'idle' },
  pageNudge: { type: Number, default: 0 },
  spines: { type: Array, default: () => [] },
  hop: { type: Number, default: 0 },
})

const rightBooks = bookSpots([
  [60, 5], [76, 9], [92, 4],
  [64, 16], [86, 17],
  [58, 86], [74, 91], [90, 87],
  [66, 78],
])
const sheet = ref(null)

function shake() {
  if (!sheet.value || prefersReducedMotion()) return
  gsap.fromTo(
    sheet.value,
    { x: 0 },
    { x: 7, duration: 0.06, yoyo: true, repeat: 5, overwrite: 'auto', force3D: false },
  )
}

defineExpose({ shake })
</script>

<template>
  <section class="stage">
    <FloatingBooks class="air" :books="rightBooks" aria-hidden="true" />
    <DeskMascots :gaze="props.gaze" :page-nudge="props.pageNudge" :spines="props.spines" :hop="props.hop" />
    <div class="pane">
      <div ref="sheet" class="sheet">
        <slot />
      </div>
    </div>
  </section>
</template>

<style scoped>
.stage {
  position: relative;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: center;
  padding: 0;
  background:
    radial-gradient(circle at 80% 12%, rgba(255, 253, 249, 0.9), transparent 28%),
    var(--rl-canvas);
}

.air {
  z-index: 1;
}

.pane {
  position: relative;
  z-index: 2;
  flex: 0 0 50%;
  max-width: none;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  padding: 22px 12px;
}

.sheet {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  height: auto;
  flex: 0 0 auto;
  margin: auto 0;
  max-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  background: var(--rl-surface);
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-modal);
  padding: 28px 14px 20px;
  box-shadow: 0 12px 32px rgba(63, 46, 36, 0.08);
  transition: transform 0.28s ease, box-shadow 0.28s ease;
}

.sheet:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 36px rgba(63, 46, 36, 0.16);
}

.sheet :deep(h1) {
  font-size: 1.35rem;
  line-height: 1.15;
}

.sheet :deep(.form-label) {
  margin-bottom: 0.25rem;
  font-size: 0.8rem;
}

.sheet :deep(.form-control),
.sheet :deep(.input-group) {
  min-width: 0;
}

.sheet :deep(.form-control:hover),
.sheet :deep(.form-control:focus) {
  border-color: var(--rl-accent);
  box-shadow: 0 0 0 0.2rem rgba(154, 122, 85, 0.25);
}

.sheet :deep(.btn-primary) {
  position: relative;
  overflow: hidden;
  border-radius: 999px;
  box-shadow: 0 5px 0 #2c241e;
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.sheet :deep(.btn-primary::after) {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 28%, rgba(255, 253, 249, 0.5) 50%, transparent 72%);
  transform: translateX(-130%);
  pointer-events: none;
}

.sheet :deep(.btn-primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 7px 0 #2c241e, 0 12px 20px rgba(63, 46, 36, 0.16);
}

.sheet :deep(.btn-primary:hover::after) {
  transform: translateX(130%);
  transition: transform 0.5s ease;
}

.sheet :deep(.btn-primary:active) {
  transform: translateY(4px);
  box-shadow: 0 1px 0 #2c241e;
}

.sheet :deep(.btn-outline-primary) {
  transition: transform 0.16s ease, background 0.16s ease;
}

.sheet :deep(.btn-outline-primary:active) {
  transform: scale(0.96);
}

@media (max-width: 767px) {
  .stage {
    flex-direction: column;
  }

  .air {
    display: none;
  }

  .pane {
    flex: 1 1 auto;
    min-height: 0;
    justify-content: flex-start;
    padding: 10px 16px 16px;
  }

  .sheet {
    width: 100%;
    margin: 0;
    padding: 20px 16px 16px;
  }
}

@media (min-width: 768px) {
  .pane {
    align-items: center;
    padding: 36px 4vw;
  }

  .sheet {
    width: min(420px, 100%);
    padding: 36px 28px 24px;
  }

  .sheet :deep(h1) {
    font-size: 1.85rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sheet,
  .sheet :deep(.btn-primary),
  .sheet :deep(.btn-primary::after),
  .sheet :deep(.btn-outline-primary) {
    animation: none;
    transition: none;
  }

  .sheet:hover,
  .sheet :deep(.btn-primary:hover),
  .sheet :deep(.btn-primary:active),
  .sheet :deep(.btn-outline-primary:active) {
    transform: none;
  }
}
</style>
