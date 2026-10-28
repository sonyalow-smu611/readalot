<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The moving air behind a landing page screen: pixel clouds drifting across and little square
// sparkles rising and twinkling. Each layer shifts with the mouse by its own depth (the page sets
// --px and --py, see usePointerParallax), so the far ones move least. Only a picture.
import { computed } from 'vue'

const props = defineProps({
  // the sparkles' colour
  colour: { type: String, default: '#fffdf9' },
  // picks where the sparkles start, so each screen's pattern differs
  seed: { type: Number, default: 1 },
  count: { type: Number, default: 18 },
  clouds: { type: Boolean, default: true },
})

// a small repeatable random sequence, so the sparkles sit in the same places on every visit
function sequence(seed) {
  let n = seed * 9301 + 49297
  return () => {
    n = (n * 9301 + 49297) % 233280
    return n / 233280
  }
}

const sparkles = computed(() => {
  const next = sequence(props.seed)
  return Array.from({ length: props.count }, (_, i) => ({
    id: i,
    size: [4, 4, 6, 8][Math.floor(next() * 4)],
    left: `${Math.round(next() * 96 + 2)}%`,
    top: `${Math.round(next() * 90 + 5)}%`,
    duration: `${(6 + next() * 8).toFixed(1)}s`,
    delay: `${(-next() * 12).toFixed(1)}s`,
    near: i % 3 === 0,
  }))
})

const CLOUDS = [
  { id: 0, top: '12%', scale: 6, duration: '70s', delay: '-10s' },
  { id: 1, top: '38%', scale: 4, duration: '95s', delay: '-60s' },
  { id: 2, top: '72%', scale: 5, duration: '80s', delay: '-35s' },
]
</script>

<template>
  <div class="sky" :style="{ '--sky-colour': colour }" aria-hidden="true">
    <div v-if="clouds" class="sky__layer sky__layer--far">
      <img
        v-for="cloud in CLOUDS"
        :key="cloud.id"
        class="sky__cloud"
        src="/room/strip/hang-cloud.png"
        alt=""
        :style="{ top: cloud.top, width: `${20 * cloud.scale}px`, height: `${12 * cloud.scale}px`, animationDuration: cloud.duration, animationDelay: cloud.delay }"
      />
    </div>
    <div class="sky__layer sky__layer--mid">
      <span
        v-for="s in sparkles.filter((s) => !s.near)"
        :key="s.id"
        class="sky__sparkle"
        :style="{ left: s.left, top: s.top, width: `${s.size}px`, height: `${s.size}px`, animationDuration: s.duration, animationDelay: s.delay }"
      />
    </div>
    <div class="sky__layer sky__layer--near">
      <span
        v-for="s in sparkles.filter((s) => s.near)"
        :key="s.id"
        class="sky__sparkle"
        :style="{ left: s.left, top: s.top, width: `${s.size + 2}px`, height: `${s.size + 2}px`, animationDuration: s.duration, animationDelay: s.delay }"
      />
    </div>
  </div>
</template>

<style scoped>
.sky {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.sky__layer {
  position: absolute;
  inset: -24px;
}

.sky__layer--far {
  translate: calc(var(--px, 0) * -8px) calc(var(--py, 0) * -6px);
}

.sky__layer--mid {
  translate: calc(var(--px, 0) * -18px) calc(var(--py, 0) * -12px);
}

.sky__layer--near {
  translate: calc(var(--px, 0) * -34px) calc(var(--py, 0) * -22px);
}

.sky__cloud {
  position: absolute;
  left: 0;
  opacity: 0.22;
  image-rendering: pixelated;
  animation: sky-drift linear infinite;
}

@keyframes sky-drift {
  from { transform: translateX(-160px); }
  to { transform: translateX(calc(100vw + 160px)); }
}

/* a square of light that rises a little and blinks, a pixel step at a time */
.sky__sparkle {
  position: absolute;
  background: var(--sky-colour);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--sky-colour) 30%, transparent);
  opacity: 0;
  animation: sky-twinkle ease-in-out infinite;
}

@keyframes sky-twinkle {
  0% { opacity: 0; transform: translateY(0); }
  30% { opacity: 0.85; }
  60% { opacity: 0.25; }
  80% { opacity: 0.7; }
  100% { opacity: 0; transform: translateY(-48px); }
}

@media (prefers-reduced-motion: reduce) {
  .sky__cloud,
  .sky__sparkle {
    animation: none;
  }

  .sky__sparkle {
    opacity: 0.5;
  }

  .sky__cloud {
    left: 20%;
  }
}
</style>
