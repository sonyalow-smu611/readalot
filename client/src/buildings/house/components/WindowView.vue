<!--
  The view outside the window, following the live weather: sun and passing birds, drifting
  clouds, or rain, with a moon when it is clear at night. It fills whatever box it is given; the
  3D room shows it behind its canvas, where the bay window's glass is.
  Drawn as pixel art in the town's colours: bands of sky, and sun, birds and clouds made of
  square pixels (crisp-edged SVG), like the town's sky and rain (src/town).
-->
<script setup>
defineProps({
  // 'sunny' | 'cloudy' | 'rain'
  scene: { type: String, default: 'cloudy' },
  night: { type: Boolean, default: false },
})

const RAIN_DROPS = Array.from({ length: 22 }, (_, index) => {
  const column = index % 11
  const pass = Math.floor(index / 11)
  return {
    left: `${3 + column * 8.8}%`,
    width: 2 + (index % 2),
    height: 12 + (index % 4) * 2,
    delay: `${-(pass * 0.95 + column * 0.13)}s`,
    duration: `${1.35 + (index % 5) * 0.16}s`,
  }
})
</script>

<template>
  <div class="view" :class="[`view--${scene}`, { 'is-night': night }]" data-testid="window-view" aria-hidden="true">
    <template v-if="scene === 'sunny'">
      <!-- the sun by day, the moon at night: a round disc on an 8 x 8 grid -->
      <svg class="view__sun" viewBox="0 0 8 8" shape-rendering="crispEdges">
        <path class="view__sun-rim" d="M2 0h4v1h1v1h1v4h-1v1h-1v1h-4v-1h-1v-1h-1v-4h1v-1h1z" />
        <path class="view__sun-face" d="M2 1h4v1h1v4h-1v1h-4v-1h-1v-4h1z" />
        <path class="view__sun-shine" d="M2 2h2v1h-1v1h-1z" />
      </svg>
      <template v-if="!night">
        <span v-for="n in 3" :key="`bird-${n}`" class="view__bird" :class="`view__bird--${n}`" data-testid="bird">
          <svg class="view__wing" viewBox="0 0 7 3" shape-rendering="crispEdges">
            <path d="M0 0h1v1h-1zM1 1h1v1h-1zM2 2h1v1h-1zM3 1h1v1h-1zM4 2h1v1h-1zM5 1h1v1h-1zM6 0h1v1h-1z" />
          </svg>
        </span>
      </template>
    </template>
    <template v-if="scene === 'cloudy' || scene === 'rain'">
      <svg
        v-for="n in 4"
        :key="`cloud-${n}`"
        class="view__cloud"
        :class="`view__cloud--${n}`"
        viewBox="0 0 16 6"
        shape-rendering="crispEdges"
      >
        <path class="view__cloud-top" d="M5 0h4v1h2v1h2v1h2v1h1v2h-16v-2h1v-1h2v-1h2z" />
        <path class="view__cloud-shade" d="M0 5h16v1h-16z" />
      </svg>
    </template>
    <!-- the town across the street: rooftops, a tree and a street lamp; their windows and the
         lamp light up after dark -->
    <svg class="view__town" viewBox="0 0 88 30" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges">
      <circle v-if="night" class="view__glow" cx="84.5" cy="11" r="7" />
      <path class="view__ground" d="M0 26h88v4h-88z" />
      <path class="view__wall" d="M2 14h18v12h-18zM26 16h14v10h-14zM58 12h22v14h-22z" />
      <path class="view__roof-blue" d="M0 14l11-8l11 8z" />
      <path class="view__roof-red" d="M24 16l9-7l9 7z" />
      <path class="view__roof-slate" d="M56 12l13-8l13 8z" />
      <path class="view__door" d="M10 20h3v6h-3z" />
      <path class="view__tree" d="M46 13h8v2h1v5h-1v2h-8v-2h-1v-5h1z" />
      <path class="view__trunk" d="M49 22h2v4h-2z" />
      <path class="view__post" d="M84 12h1v14h-1z" />
      <path
        class="view__lit"
        data-testid="town-lights"
        d="M5 17h3v3h-3zM14 17h3v3h-3zM29 19h3v3h-3zM35 19h3v3h-3zM61 15h3v3h-3zM67 15h3v3h-3zM74 15h3v3h-3zM61 20h3v3h-3zM74 20h3v3h-3zM83 10h3v2h-3z"
      />
    </svg>
    <template v-if="scene === 'rain'">
      <span
        v-for="(drop, index) in RAIN_DROPS"
        :key="`drop-${index}`"
        class="view__drop"
        data-testid="raindrop"
        :style="{
          left: drop.left,
          width: `${drop.width}px`,
          height: `${drop.height}px`,
          animationDelay: drop.delay,
          animationDuration: drop.duration,
        }"
      />
    </template>
  </div>
</template>

<style scoped>
.view {
  overflow: hidden;
  container-type: size;
}

/* flat bands of sky, top to bottom, in the town's colours */
.view--sunny { background: linear-gradient(to bottom, #7fb6d9 0 34%, #9fd4ee 34% 68%, #bfe6f5 68%); }
.view--cloudy { background: linear-gradient(to bottom, #a39a8c 0 34%, #b9b09d 34% 68%, #cfc6b4 68%); }
.view--rain { background: linear-gradient(to bottom, #3a3a48 0 34%, #5a5a68 34% 68%, #6e665b 68%); }
.view--sunny.is-night { background: linear-gradient(to bottom, #1d2740 0 34%, #2c3a5e 34% 68%, #44557a 68%); }
.view--cloudy.is-night,
.view--rain.is-night { filter: brightness(0.55) saturate(0.8); }

svg {
  display: block;
  overflow: visible;
}

.view__sun {
  position: absolute;
  top: 10%;
  left: 14%;
  width: 15%;
  height: auto;
}

.view__sun-rim { fill: #e3b04b; }
.view__sun-face { fill: #ffe08a; }
.view__sun-shine { fill: #fdf7ec; }

/* a clear night shows the same disc as a pale moon */
.is-night .view__sun-rim { fill: #c9c0ad; }
.is-night .view__sun-face { fill: #f4efe2; }
.is-night .view__sun-shine { fill: #fdf7ec; }

.view__bird {
  position: absolute;
  left: 0;
  width: 9cqw;
  animation: view-fly 9s linear infinite;
}

.view__wing {
  width: 100%;
  height: auto;
  fill: #1e1a24;
  /* two frames, wings up and down, like a sprite */
  animation: view-flap 0.42s steps(1) infinite;
  transform-origin: center;
}

.view__bird--1 { top: 28%; animation-duration: 8s; }
.view__bird--2 { top: 46%; animation-duration: 11s; animation-delay: -4s; }
.view__bird--3 { top: 18%; width: 7cqw; animation-duration: 13s; animation-delay: -7s; }

.view__cloud {
  position: absolute;
  left: 0;
  width: 38cqw;
  height: auto;
  animation: view-drift 22s linear infinite;
}

.view__cloud-top { fill: #fdf7ec; }
.view__cloud-shade { fill: #e6dfcf; }

.view__cloud--1 { top: 18%; animation-duration: 26s; }
.view__cloud--2 { top: 40%; width: 48cqw; animation-duration: 34s; animation-delay: -12s; }
.view__cloud--3 { top: 62%; width: 30cqw; animation-duration: 20s; animation-delay: -6s; }
.view__cloud--4 { top: 30%; width: 24cqw; opacity: 0.8; animation-duration: 30s; animation-delay: -18s; }

.view--rain .view__cloud-top { fill: #a9a092; }
.view--rain .view__cloud-shade { fill: #8a8478; }

/* the town across the street, along the bottom of the view */
.view__town {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 38%;
}

.view__ground { fill: #7fa760; }
.view__wall { fill: #eef0ec; }
.view__roof-blue { fill: #4a7fb0; }
.view__roof-red { fill: #c0563f; }
.view__roof-slate { fill: #5a5a68; }
.view__door { fill: #8a5432; }
.view__tree { fill: #4f8f3a; }
.view__trunk,
.view__post { fill: #5a3a24; }
.view__lit { fill: #cfe3ee; }
.view__glow { fill: rgba(255, 224, 138, 0.35); }

/* after dark: the houses dim and blue, their windows and the street lamp warm yellow */
.is-night .view__ground { fill: #3d5a3a; }
.is-night .view__wall { fill: #6f7898; }
.is-night .view__roof-blue { fill: #34507a; }
.is-night .view__roof-red { fill: #7a3e3a; }
.is-night .view__roof-slate { fill: #3a3a4c; }
.is-night .view__tree { fill: #2f5232; }
.is-night .view__lit { fill: #ffe08a; }

/* square streaks, the town's rain colour */
.view__drop {
  position: absolute;
  top: 0;
  background: #e1eeff;
  opacity: 0.85;
  animation: view-drip 1.6s linear infinite;
}

@keyframes view-fly {
  from { transform: translate(-20cqw, 6cqh); }
  to { transform: translate(110cqw, -8cqh); }
}

@keyframes view-flap {
  0% { transform: scaleY(1); }
  50% { transform: scaleY(-1); }
}

@keyframes view-drift {
  from { transform: translateX(-60cqw); }
  to { transform: translateX(125cqw); }
}

@keyframes view-drip {
  0% { transform: translateY(-18px); opacity: 0; }
  8% { opacity: 0.85; }
  100% { transform: translateY(100cqh); opacity: 0.5; }
}
</style>
