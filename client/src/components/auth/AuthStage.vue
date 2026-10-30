<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The scene behind Log in, Register, Verify and Welcome: the real town map drifting by, the
// pixel cats sitting on it, and the page's form in a card like the town's panels.
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
const leaving = ref(false)

// The map rushes up as if the camera drops into town. Resolves when the page can change.
function enterTown() {
  if (prefersReducedMotion()) return Promise.resolve()
  leaving.value = true
  return new Promise((done) => window.setTimeout(done, 600))
}

function shake() {
  if (!sheet.value || prefersReducedMotion()) return
  gsap.fromTo(
    sheet.value,
    { x: 0 },
    { x: 7, duration: 0.06, yoyo: true, repeat: 5, overwrite: 'auto', force3D: false },
  )
}

defineExpose({ shake, enterTown })
</script>

<template>
  <section class="stage" :class="{ 'is-leaving': leaving }">
    <div class="town" aria-hidden="true">
      <div class="town__map" />
    </div>
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
  /* the town's grass, in case a very wide screen runs past the map's edge */
  background: #6fb24f;
}

/* The real town map at 1:1, so its pixels stay crisp. It pans one whole pixel per step. */
.town {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  transform-origin: 30% 60%;
  transition: transform 0.6s ease-in;
}

.town::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(30, 26, 36, 0) 55%, rgba(30, 26, 36, 0.28) 100%);
}

.town__map {
  position: absolute;
  top: 50%;
  left: 0;
  width: 3584px;
  height: 2560px;
  margin-top: -1180px;
  background: url('/town/map.png') no-repeat;
  image-rendering: pixelated;
  transform: translateX(-300px);
  animation: pan 168s steps(1684, end) infinite alternate;
}

@keyframes pan {
  to { transform: translateX(-1984px); }
}

.stage.is-leaving .town {
  transform: scale(2.4);
}

.stage :deep(.mascots),
.air,
.pane {
  transition: opacity 0.3s ease;
}

.stage.is-leaving :deep(.mascots),
.stage.is-leaving .air,
.stage.is-leaving .pane {
  opacity: 0;
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
  /* the same card as the town's place cards */
  box-shadow: 0 14px 36px rgba(63, 46, 36, 0.25);
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
  .town__map {
    animation: none;
  }

  .town,
  .sheet {
    animation: none;
    transition: none;
  }
}
</style>
