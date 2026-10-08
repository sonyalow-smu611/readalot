<!--
  The bay window on the room wall. The view outside follows the live weather: sun and passing
  birds, drifting clouds, or rain, with a moon when it is clear at night. The temperature
  floats in the top right pane.
  The frame is drawn on a grid 164 wide and `rows` tall, so the window can be made taller
  without stretching its arch; the weather scene sits behind it, cut to the glass.
-->
<script setup>
import { computed, useId } from 'vue'

const props = defineProps({
  // 'sunny' | 'cloudy' | 'rain'
  scene: { type: String, default: 'cloudy' },
  night: { type: Boolean, default: false },
  // whole degrees Celsius, or null when the weather could not be fetched
  temperature: { type: Number, default: null },
  // height of the frame on its 164-wide grid: the arch and sill keep their size, the glass
  // between them takes up the rest
  rows: { type: Number, default: 262 },
})

const uid = useId()

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

// The frame's measurements on the grid. Everything below the arch is placed up from the sill.
const frame = computed(() => {
  const rows = props.rows
  const glassTop = 36 // crown of the arch in the glass
  const glassBottom = rows - 31
  const glassHeight = glassBottom - glassTop
  const outer = `M16 50Q82 2 148 50V${rows - 22}H16Z`
  const glass = `M25 56Q82 16 139 56V${glassBottom}H25Z`

  return {
    viewBox: `0 0 164 ${rows}`,
    outer,
    glass,
    // the frame with the glass left open
    surround: `${outer}${glass}`,
    // the glass outline as fractions of the glass box, so the cut scales with the window
    cut: `M0 ${20 / glassHeight}Q0.5 ${-20 / glassHeight} 1 ${20 / glassHeight}V1H0Z`,
    bars: `M82 27V${rows - 29}M21 ${Math.round(glassTop + glassHeight * 0.53)}H143`,
    sill: `M6 ${rows - 24}H158L164 ${rows - 8}H0Z`,
    sillEdge: `M8 ${rows - 22}H156`,
    sheen: [
      `M25 ${rows - 112}L92 16H112L25 ${rows - 72}Z`,
      `M70 ${glassBottom}L139 ${rows - 170}V${rows - 138}L86 ${glassBottom}Z`,
    ],
    boxStyle: { aspectRatio: `164 / ${rows}` },
    glassStyle: {
      top: `${(glassTop / rows) * 100}%`,
      height: `${(glassHeight / rows) * 100}%`,
      clipPath: `url(#${uid}-glass)`,
    },
    // a fixed step below the arch, however tall the glass is
    tempStyle: { top: `${(25 / glassHeight) * 100}%` },
  }
})

const label = computed(() => {
  const sky = `${SCENE_LABELS[props.scene] ?? 'Cloudy'}${props.night ? ' night' : ''}`
  return props.temperature === null ? `Window view: ${sky}` : `Window view: ${sky}, ${props.temperature} degrees`
})
</script>

<template>
  <div class="window" role="img" :aria-label="label" :style="frame.boxStyle">
    <!-- the view outside, cut to the arch of the glass -->
    <div class="window__glass" :style="frame.glassStyle">
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
      <span v-if="temperature !== null" class="window__temp" :style="frame.tempStyle">{{ temperature }}°</span>
    </div>

    <svg class="window__frame" :viewBox="frame.viewBox" aria-hidden="true">
      <defs>
        <clipPath :id="`${uid}-glass`" clipPathUnits="objectBoundingBox">
          <path :d="frame.cut" />
        </clipPath>
        <clipPath :id="`${uid}-sheen`">
          <path :d="frame.glass" />
        </clipPath>
      </defs>

      <path :d="frame.surround" fill="#FFFDF9" fill-rule="evenodd" />
      <path :d="frame.outer" fill="none" stroke="#6B4A34" stroke-width="5" />

      <!-- sheen on the glass -->
      <g :clip-path="`url(#${uid}-sheen)`" fill="#FFFFFF">
        <path :d="frame.sheen[0]" opacity="0.1" />
        <path :d="frame.sheen[1]" opacity="0.07" />
      </g>
      <path :d="frame.glass" fill="none" stroke="#3F2E24" stroke-opacity="0.25" stroke-width="2" />

      <!-- glazing bars -->
      <path :d="frame.bars" fill="none" stroke="#6B4A34" stroke-width="5" />

      <!-- sill -->
      <path :d="frame.sill" fill="#6B4A34" stroke="#3F2E24" stroke-width="1" />
      <path :d="frame.sillEdge" stroke="#8A6548" stroke-width="2" />
    </svg>
  </div>
</template>

<style scoped>
.window {
  position: relative;
}

.window__frame {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

/* the box around the glass: 25 to 139 across the grid; top and height depend on `rows` */
.window__glass {
  position: absolute;
  left: calc(25 / 164 * 100%);
  width: calc(114 / 164 * 100%);
}

.window__pane {
  position: absolute;
  inset: 0;
  overflow: hidden;
  container-type: size;
  transition: background 1.2s ease;
}

/* top right pane, clear of the glazing bars */
.window__temp {
  position: absolute;
  right: 8%;
  font-family: var(--font-serif);
  font-size: max(11px, calc(12 * var(--u)));
  font-weight: 700;
  line-height: 1;
  color: #fff;
  opacity: 0.9;
  /* keeps white readable against a pale morning sky */
  text-shadow: 0 1px 3px rgba(44, 36, 30, 0.45);
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
