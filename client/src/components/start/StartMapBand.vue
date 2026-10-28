<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A corner of the town along the bottom of a landing page screen: a strip of the real town map
// (public/town/map.png) around one spot, fading up into the sky, with a few townsfolk out and
// about in it. The strip shifts with the mouse (the page sets --px). Only a picture.
defineProps({
  // the spot to show, in map pixels: { x, bottom } puts map point (x, bottom) at the strip's
  // bottom middle
  focus: { type: Object, required: true },
  // townsfolk standing about: [{ id, x, y, pace }] in map pixels (feet at y); pace walks them
  // that many map pixels back and forth
  people: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="band" aria-hidden="true">
    <div class="band__zoom">
      <div class="band__map" :style="{ transform: `translate(${-focus.x}px, ${2560 - focus.bottom}px)` }">
        <img
          v-for="(person, i) in people"
          :key="`${person.id}-${i}`"
          class="band__person"
          :class="{ 'band__person--pacing': person.pace }"
          :src="`/town/avatars/${person.id}.png`"
          :style="{ left: `${person.x - 30}px`, top: `${person.y - 116}px`, '--pace': `${person.pace || 0}px`, animationDelay: `${i * -1.7}s, ${i * -0.3}s` }"
          alt=""
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.band {
  --k: 0.75;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 320px;
  overflow: hidden;
  pointer-events: none;
  /* fades up into the sky, and softly at the sides */
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 45%), linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
  -webkit-mask-composite: source-in;
  mask-image: linear-gradient(to bottom, transparent, #000 45%), linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
  mask-composite: intersect;
}

.band__zoom {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: scale(var(--k));
  transform-origin: 0 100%;
  translate: calc(var(--px, 0) * -20px) 0;
}

.band__map {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 3584px;
  height: 2560px;
  background: url('/town/map.png') no-repeat;
  image-rendering: pixelated;
}

.band__person {
  position: absolute;
  width: 60px;
  height: 116px;
  image-rendering: pixelated;
  animation: band-idle 1.6s steps(2, end) infinite;
}

.band__person--pacing {
  animation: band-pace 9s linear infinite alternate, band-idle 0.5s steps(2, end) infinite;
}

@keyframes band-idle {
  50% { translate: 0 -3px; }
}

@keyframes band-pace {
  to { transform: translateX(var(--pace)); }
}

@media (max-width: 767px) {
  .band {
    --k: 0.5;
    height: 220px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .band__person,
  .band__person--pacing {
    animation: none;
  }
}
</style>
