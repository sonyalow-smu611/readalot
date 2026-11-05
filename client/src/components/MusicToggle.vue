<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The music on/off button: a note when music is on, the same note struck through when it's off.
// It sits beside the Daily task button wherever that is (the town's corner, or DailyDock on every
// other page), in the same row, so it slides along as the Daily button widens. The row places it.
import { computed } from 'vue'
import { useMusicStore } from '@/stores/music.js'

const music = useMusicStore()

const label = computed(() => (music.enabled ? 'Turn music off' : 'Turn music on'))
</script>

<template>
  <button
    type="button"
    class="btn btn-secondary btn-icon px-sign music-toggle"
    :class="{ 'music-toggle--off': !music.enabled }"
    :aria-label="label"
    :aria-pressed="music.enabled"
    :title="label"
    @click="music.toggle()"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <!-- when off, a gap is cut out of the note along the strike, so the line reads clearly on any
           button colour (hover and press included) -->
      <defs>
        <mask id="music-toggle-gap" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <rect width="24" height="24" fill="#fff" />
          <path d="M4 4l16 16" stroke="#000" stroke-width="5.5" />
        </mask>
      </defs>
      <!-- an eighth note: head, stem and flag -->
      <g :mask="music.enabled ? null : 'url(#music-toggle-gap)'">
        <ellipse class="music-toggle__head" cx="9" cy="17.5" rx="3.6" ry="2.8" transform="rotate(-20 9 17.5)" />
        <path d="M12.3 16.6V4.2" />
        <path d="M12.3 4.2c1.2 2.4 5.6 3 5.2 7.4" />
      </g>
      <path v-if="!music.enabled" d="M4 4l16 16" />
    </svg>
  </button>
</template>

<style scoped>
.music-toggle {
  flex: none;
  pointer-events: auto;
}

.music-toggle svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.music-toggle__head {
  fill: currentColor;
}
</style>
