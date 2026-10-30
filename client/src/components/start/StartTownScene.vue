<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The landing page's picture: the real town map at half size, panning slowly along the main
// road while a few townsfolk walk the pavement. It is only a picture, so it is hidden from
// screen readers; the page's heading says what it shows.
defineProps({
  // townsfolk to walk the pavement, by sprite id (public/town/avatars/<id>.png)
  walkers: { type: Array, default: () => ['maya', 'theo', 'nova'] },
})
</script>

<template>
  <div class="scene" aria-hidden="true">
    <div class="scene__zoom">
      <div class="scene__map">
        <img
          v-for="(id, i) in walkers"
          :key="id"
          class="scene__walker"
          :class="{ 'scene__walker--back': i % 2 === 1 }"
          :style="{ animationDelay: `${i * -17}s, 0s` }"
          :src="`/town/avatars/${id}.png`"
          alt=""
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  /* the town's grass, in case a tall screen runs past the map's edge */
  background: #6fb24f;
}

.scene::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(30, 26, 36, 0) 45%, rgba(30, 26, 36, 0.35) 100%);
}

/* Half size keeps every map pixel crisp; the main road (y 1210) sits in the middle. */
.scene__zoom {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: scale(0.5);
  transform-origin: 0 0;
}

.scene__map {
  position: relative;
  width: 3584px;
  height: 2560px;
  background: url('/town/map.png') no-repeat;
  image-rendering: pixelated;
  /* the pan stays inside the map's edges on a laptop-wide screen */
  transform: translate(-1450px, -1210px);
  animation: scene-pan 90s steps(350, end) infinite alternate;
}

@keyframes scene-pan {
  to { transform: translate(-2150px, -1210px); }
}

/* The pavement above the main road; feet on the kerb. */
.scene__walker {
  position: absolute;
  left: 0;
  top: 1024px;
  width: 60px;
  height: 116px;
  image-rendering: pixelated;
  animation: scene-walk 51s linear infinite, scene-step 0.5s steps(2, end) infinite;
}

.scene__walker--back {
  animation-direction: reverse, normal;
}

@keyframes scene-walk {
  from { left: 300px; }
  to { left: 3300px; }
}

@keyframes scene-step {
  50% { translate: 0 -4px; }
}

@media (prefers-reduced-motion: reduce) {
  .scene__map,
  .scene__walker {
    animation: none;
  }

  .scene__walker {
    left: 1700px;
  }

  .scene__walker--back {
    left: 1900px;
  }
}
</style>
