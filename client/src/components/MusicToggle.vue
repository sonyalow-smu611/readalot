<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The music on/off button, in the top-right corner of every signed-in page. A note when music is
// on; the same note struck through when it's off.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMusicStore } from '@/stores/music.js'

const music = useMusicStore()
const route = useRoute()

const label = computed(() => (music.enabled ? 'Turn music off' : 'Turn music on'))

// pages whose top-right corner is laid out differently (see the styles)
// a Back button alone in the top row: the note joins that row
const TOP_ROW_PAGES = ['book-details', 'search', 'reader-room']
// pages with the shared title bar (AppHeader): the note sits just under it
const HEADER_PAGES = ['genre-shelf', 'reader-shelf', 'mood', 'playground']
const place = computed(() => {
  if (TOP_ROW_PAGES.includes(route.name)) return 'music-toggle--top-row'
  if (HEADER_PAGES.includes(route.name)) return 'music-toggle--under-header'
  return null
})
</script>

<template>
  <button
    type="button"
    class="btn btn-secondary btn-icon px-sign music-toggle"
    :class="[place, { 'music-toggle--off': !music.enabled }]"
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
/* top right, under what each page already keeps in that corner (the town's Friends button, a
   building's weather or coins) */
.music-toggle {
  position: absolute;
  top: 70px;
  right: 16px;
  z-index: 35;
  pointer-events: auto;
}

/* in line with the page's Back button (on a book, above the card and clear of its close button) */
.music-toggle--top-row {
  top: 18px;
}

.music-toggle--under-header {
  top: 94px;
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
