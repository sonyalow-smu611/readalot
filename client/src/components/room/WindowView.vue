<!--
  The view outside the window, following the live weather: sun and passing birds, drifting
  clouds, or rain, with a moon when it is clear at night. It fills whatever box it is given; the
  3D room shows it behind its canvas, where the bay window's glass is.
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
    width: 3 + (index % 2),
    height: 12 + (index % 4) * 2,
    delay: `${-(pass * 0.95 + column * 0.13)}s`,
    duration: `${1.35 + (index % 5) * 0.16}s`,
  }
})
</script>

<template>
  <div class="view" :class="[`view--${scene}`, { 'is-night': night }]" data-testid="window-view" aria-hidden="true">
    <template v-if="scene === 'sunny'">
      <span class="view__sun" />
      <span class="view__glare" />
      <template v-if="!night">
        <span v-for="n in 3" :key="`bird-${n}`" class="view__bird" :class="`view__bird--${n}`" data-testid="bird">
          <svg class="view__wing" viewBox="0 0 24 12">
            <path d="M1 9 Q7 1 12 6 Q17 1 23 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
        </span>
      </template>
    </template>
    <template v-if="scene === 'cloudy' || scene === 'rain'">
      <span v-for="n in 4" :key="`cloud-${n}`" class="view__cloud" :class="`view__cloud--${n}`" />
    </template>
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
  transition: background 1.2s ease;
}

.view--sunny { background: linear-gradient(to bottom, #f3d7a6, #9ec4e0); }
.view--cloudy { background: linear-gradient(to bottom, #c5d0da, #8ea0b0); }
.view--rain { background: linear-gradient(to bottom, #5e6c78, #3e4a54); }
.view--sunny.is-night { background: linear-gradient(to bottom, #1d2740, #44557a); }
.view--cloudy.is-night,
.view--rain.is-night { filter: brightness(0.62); }

.view__sun {
  position: absolute;
  top: 12%;
  left: 16%;
  width: 28%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #ffe7a3;
  box-shadow:
    0 0 10px 4px rgba(255, 226, 150, 0.95),
    0 0 28px 14px rgba(255, 196, 110, 0.55);
}

/* a clear night shows the same disc as a pale moon */
.is-night .view__sun {
  background: #f1ecd8;
  box-shadow: 0 0 12px 3px rgba(241, 236, 216, 0.45);
}

.view__glare {
  position: absolute;
  inset: -10%;
  background: linear-gradient(
    118deg,
    transparent 36%,
    rgba(255, 255, 255, 0.18) 46%,
    rgba(255, 255, 255, 0.55) 50%,
    rgba(255, 255, 255, 0.16) 54%,
    transparent 64%
  );
  animation: view-glare 6.5s ease-in-out infinite;
  pointer-events: none;
}

.is-night .view__glare {
  opacity: 0.25;
  animation: none;
}

.view__bird {
  position: absolute;
  left: 0;
  width: 13cqw;
  color: #2a2824;
  animation: view-fly 9s linear infinite;
}

.view__wing {
  display: block;
  width: 100%;
  height: auto;
  animation: view-flap 0.42s ease-in-out infinite;
  transform-origin: center;
}

.view__bird--1 { top: 28%; animation-duration: 8s; }
.view__bird--2 { top: 46%; animation-duration: 11s; animation-delay: -4s; }
.view__bird--3 { top: 18%; width: 10cqw; animation-duration: 13s; animation-delay: -7s; }

.view__cloud {
  position: absolute;
  left: 0;
  width: 38cqw;
  height: 11cqw;
  border-radius: 20cqw;
  background: rgba(255, 255, 255, 0.92);
  animation: view-drift 22s linear infinite;
}

.view__cloud::before,
.view__cloud::after {
  content: '';
  position: absolute;
  background: inherit;
  border-radius: 50%;
}

.view__cloud::before {
  width: 15cqw;
  height: 15cqw;
  top: -8cqw;
  left: 7cqw;
}

.view__cloud::after {
  width: 11cqw;
  height: 11cqw;
  top: -5cqw;
  left: 18cqw;
}

.view__cloud--1 { top: 18%; animation-duration: 26s; }
.view__cloud--2 { top: 40%; width: 48cqw; animation-duration: 34s; animation-delay: -12s; }
.view__cloud--3 { top: 62%; width: 30cqw; animation-duration: 20s; animation-delay: -6s; }
.view__cloud--4 { top: 30%; width: 24cqw; opacity: 0.75; animation-duration: 30s; animation-delay: -18s; }

.view--rain .view__cloud {
  background: rgba(210, 216, 222, 0.55);
}

.view__drop {
  position: absolute;
  top: 0;
  border-radius: 40% 40% 46% 46%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.35),
    rgba(226, 236, 242, 0.92) 55%,
    rgba(186, 208, 220, 0.45)
  );
  animation: view-drip 1.6s linear infinite;
}

@keyframes view-glare {
  0%,
  100% { transform: translateX(-18%); opacity: 0.35; }
  50% { transform: translateX(12%); opacity: 0.85; }
}

@keyframes view-fly {
  from { transform: translate(-20cqw, 6cqh); }
  to { transform: translate(110cqw, -8cqh); }
}

@keyframes view-flap {
  0%,
  100% { transform: scaleY(1); }
  50% { transform: scaleY(0.35); }
}

@keyframes view-drift {
  from { transform: translateX(-60cqw); }
  to { transform: translateX(125cqw); }
}

@keyframes view-drip {
  0% { transform: translateY(-18px); opacity: 0; }
  8% { opacity: 0.95; }
  100% { transform: translateY(100cqh); opacity: 0.55; }
}
</style>
