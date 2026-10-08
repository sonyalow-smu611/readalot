<!--
  The window on the room wall. The view outside follows the live weather: sun and passing
  birds, drifting clouds, or rain, with a moon when it is clear at night.
  Sizes use --u (one unit of the room's reference width) so it scales with the room.
-->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 'sunny' | 'cloudy' | 'rain'
  scene: { type: String, default: 'cloudy' },
  night: { type: Boolean, default: false },
  // whole degrees Celsius, or null when the weather could not be fetched
  temperature: { type: Number, default: null },
})

const SCENE_LABELS = { sunny: 'Clear', cloudy: 'Cloudy', rain: 'Rain' }

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

const label = computed(() => {
  const sky = `${SCENE_LABELS[props.scene] ?? 'Cloudy'}${props.night ? ' night' : ''}`
  return props.temperature === null ? `Window view: ${sky}` : `Window view: ${sky}, ${props.temperature} degrees`
})
</script>

<template>
  <div class="window" role="img" :aria-label="label">
    <div class="window__frame">
      <div class="window__pane" :class="[`window__pane--${scene}`, { 'is-night': night }]">
        <template v-if="scene === 'sunny'">
          <span class="window__sun" />
          <span class="window__glare" />
          <template v-if="!night">
            <span v-for="n in 3" :key="`bird-${n}`" class="window__bird" :class="`window__bird--${n}`">
              <svg class="window__wing" viewBox="0 0 24 12">
                <path
                  d="M1 9 Q7 1 12 6 Q17 1 23 9"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </svg>
            </span>
          </template>
        </template>
        <template v-if="scene === 'cloudy' || scene === 'rain'">
          <span v-for="n in 4" :key="`cloud-${n}`" class="window__cloud" :class="`window__cloud--${n}`" />
        </template>
        <template v-if="scene === 'rain'">
          <span
            v-for="(drop, index) in RAIN_DROPS"
            :key="`drop-${index}`"
            class="window__drop"
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
    </div>
    <div class="window__sill">
      <span v-if="temperature !== null" class="window__temp">{{ temperature }}°</span>
    </div>
  </div>
</template>

<style scoped>
.window {
  display: flex;
  flex-direction: column;
}

.window__frame {
  flex: 1 1 auto;
  min-height: 0;
  padding: calc(4 * var(--u));
  border: calc(4 * var(--u)) solid var(--wood);
  border-radius: calc(3 * var(--u));
  background: var(--paper);
  box-shadow: 0 calc(4 * var(--u)) calc(8 * var(--u)) rgba(63, 46, 36, 0.18);
}

.window__pane {
  position: relative;
  height: 100%;
  overflow: hidden;
  container-type: size;
  transition: background 1.2s ease;
}

.window__pane--sunny { background: linear-gradient(to bottom, #f3d7a6, #9ec4e0); }
.window__pane--cloudy { background: linear-gradient(to bottom, #c5d0da, #8ea0b0); }
.window__pane--rain { background: linear-gradient(to bottom, #5e6c78, #3e4a54); }
.window__pane--sunny.is-night { background: linear-gradient(to bottom, #1d2740, #44557a); }
.window__pane--cloudy.is-night,
.window__pane--rain.is-night { filter: brightness(0.62); }

.window__sun {
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
.is-night .window__sun {
  background: #f1ecd8;
  box-shadow: 0 0 12px 3px rgba(241, 236, 216, 0.45);
}

.window__glare {
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
  animation: window-glare 6.5s ease-in-out infinite;
  pointer-events: none;
}

.is-night .window__glare {
  opacity: 0.25;
  animation: none;
}

.window__bird {
  position: absolute;
  left: 0;
  width: 13cqw;
  color: #2a2824;
  animation: window-fly 9s linear infinite;
}

.window__wing {
  display: block;
  width: 100%;
  height: auto;
  animation: window-flap 0.42s ease-in-out infinite;
  transform-origin: center;
}

.window__bird--1 { top: 28%; animation-duration: 8s; }
.window__bird--2 { top: 46%; animation-duration: 11s; animation-delay: -4s; }
.window__bird--3 { top: 18%; width: 10cqw; animation-duration: 13s; animation-delay: -7s; }

.window__cloud {
  position: absolute;
  left: 0;
  width: 38cqw;
  height: 11cqw;
  border-radius: 20cqw;
  background: rgba(255, 255, 255, 0.92);
  animation: window-drift 22s linear infinite;
}

.window__cloud::before,
.window__cloud::after {
  content: '';
  position: absolute;
  background: inherit;
  border-radius: 50%;
}

.window__cloud::before {
  width: 15cqw;
  height: 15cqw;
  top: -8cqw;
  left: 7cqw;
}

.window__cloud::after {
  width: 11cqw;
  height: 11cqw;
  top: -5cqw;
  left: 18cqw;
}

.window__cloud--1 { top: 18%; animation-duration: 26s; }
.window__cloud--2 { top: 40%; width: 48cqw; animation-duration: 34s; animation-delay: -12s; }
.window__cloud--3 { top: 62%; width: 30cqw; animation-duration: 20s; animation-delay: -6s; }
.window__cloud--4 { top: 30%; width: 24cqw; opacity: 0.75; animation-duration: 30s; animation-delay: -18s; }

.window__pane--rain .window__cloud {
  background: rgba(210, 216, 222, 0.55);
}

.window__drop {
  position: absolute;
  top: 0;
  border-radius: 40% 40% 46% 46%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.35),
    rgba(226, 236, 242, 0.92) 55%,
    rgba(186, 208, 220, 0.45)
  );
  animation: window-drip 1.6s linear infinite;
}

.window__sill {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: none;
  height: calc(16 * var(--u));
  margin-inline: calc(-5 * var(--u));
  padding-inline: calc(7 * var(--u));
  border-radius: calc(2 * var(--u));
  background: var(--wood);
  box-shadow: 0 calc(3 * var(--u)) calc(4 * var(--u)) rgba(63, 46, 36, 0.22);
}

.window__temp {
  font-family: var(--font-serif);
  font-size: max(10px, calc(11 * var(--u)));
  line-height: 1;
  color: var(--paper);
}

@keyframes window-glare {
  0%,
  100% { transform: translateX(-18%); opacity: 0.35; }
  50% { transform: translateX(12%); opacity: 0.85; }
}

@keyframes window-fly {
  from { transform: translate(-20cqw, 6cqh); }
  to { transform: translate(110cqw, -8cqh); }
}

@keyframes window-flap {
  0%,
  100% { transform: scaleY(1); }
  50% { transform: scaleY(0.35); }
}

@keyframes window-drift {
  from { transform: translateX(-60cqw); }
  to { transform: translateX(125cqw); }
}

@keyframes window-drip {
  0% { transform: translateY(-18px); opacity: 0; }
  8% { opacity: 0.95; }
  100% { transform: translateY(100cqh); opacity: 0.55; }
}
</style>
