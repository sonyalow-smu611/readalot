<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The reader's corner of the salon, in the town map's pixel style: a tall mirror ringed with
// bulbs, the counter and the barber chair, and the reader standing beside it as their town
// sprite, alive and wearing the look being styled. Their reflection shows in the mirror.
// Pixel sparkles burst when a look is saved.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import PixelCharacter from '@/components/shared/PixelCharacter.vue'
import { describeCharacter } from '@/lib/avatar/catalogue.js'
import { CHARACTER_BOX, FEET, MIRROR_GLASS, STATION_H, STATION_W } from '@/buildings/salon/salonArt.js'

const props = defineProps({
  // the look on the reader right now (saved, or being tried on)
  character: { type: Object, required: true },
  // true when that look isn't saved yet
  changed: { type: Boolean, default: false },
  // pictures from drawSalon()
  art: { type: Object, required: true },
  name: { type: String, default: '' },
  // bump to make the reader hop, or to burst sparkles
  hop: { type: Number, default: 0 },
  celebrate: { type: Number, default: 0 },
})

const SPARKS = 12
// the reflection: the sprite at the station's own pixel size, standing on the counter's edge
const REFLECTION = { x: 17, y: 32 }
const root = ref(null)
const scale = ref(3)
let resize = null

const px = (n) => `${n * scale.value}px`
const box = (b) => ({ left: px(b.x), top: px(b.y), width: px(b.width), height: px(b.height) })
const plaque = computed(() => (props.changed ? 'Trying on a new look' : 'Looking sharp'))
const label = computed(() => `You: ${describeCharacter(props.character)}`)

function fit() {
  if (!root.value) return
  // leave room for the name plaque underneath
  const room = Math.min(root.value.clientWidth / STATION_W, (root.value.clientHeight - 90) / STATION_H)
  scale.value = Math.max(1, Math.min(7, Math.floor(room)))
}

onMounted(() => {
  fit()
  resize = new ResizeObserver(fit)
  resize.observe(root.value)
})

onBeforeUnmount(() => resize?.disconnect())
</script>

<template>
  <div ref="root" class="stage">
    <div class="stage__station" :style="{ width: px(STATION_W), height: px(STATION_H) }">
      <span class="stage__spot" :style="{ left: px(FEET.x), top: px(FEET.y) }" aria-hidden="true" />
      <img class="stage__layer" :src="art.mirror" alt="" />
      <div class="stage__glass" :style="{ ...box(MIRROR_GLASS), '--arch': px(MIRROR_GLASS.width / 2) }" aria-hidden="true">
        <div class="stage__reflection" :style="{ left: px(REFLECTION.x), top: px(REFLECTION.y) }">
          <PixelCharacter :character="character" :scale="scale" :hop="hop" mirror decorative />
        </div>
      </div>
      <img class="stage__layer" :src="art.front" alt="" />
      <div class="stage__model" :style="box(CHARACTER_BOX)">
        <PixelCharacter :character="character" :scale="scale * 2" :hop="hop" :label="label" />
      </div>
      <div
        v-if="celebrate"
        :key="celebrate"
        class="stage__sparks"
        :style="{ left: px(FEET.x), top: px(CHARACTER_BOX.y + 20) }"
        aria-hidden="true"
      >
        <span v-for="n in SPARKS" :key="n" class="spark" :style="{ '--a': `${(360 / SPARKS) * n}deg`, '--d': `${(n % 3) * 60}ms` }" />
      </div>
    </div>

    <p class="stage__plaque">
      <span class="stage__name">{{ name || 'You' }}</span>
      <span class="stage__tag" :class="{ 'is-new': changed }">{{ plaque }}</span>
    </p>
  </div>
</template>

<style scoped>
.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-height: 0;
}

.stage__station {
  position: relative;
  flex: none;
}

.stage__layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  pointer-events: none;
}

/* a warm spotlight from above onto where the reader stands */
.stage__spot {
  position: absolute;
  width: 55%;
  aspect-ratio: 0.8;
  background: radial-gradient(ellipse at 50% 100%, rgba(255, 241, 184, 0.8), rgba(246, 226, 122, 0.22) 50%, transparent 72%);
  transform: translate(-50%, -100%);
  animation: glow 4s ease-in-out infinite;
}

.stage__model {
  position: absolute;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/* the mirror's glass: the reflection inside it, a little faded, under a sheen */
.stage__glass {
  position: absolute;
  overflow: hidden;
  border-radius: var(--arch) var(--arch) 0 0;
}

.stage__glass::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0 18%, transparent 18% 30%, rgba(255, 255, 255, 0.18) 30% 36%, transparent 36%),
    rgba(207, 227, 236, 0.35);
}

.stage__reflection {
  position: absolute;
  opacity: 0.75;
}

.stage__sparks {
  position: absolute;
  width: 0;
  height: 0;
}

/* a gold pixel star flying out */
.spark {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #f6e27a;
  box-shadow:
    8px 0 0 #f6e27a, -8px 0 0 #f6e27a, 0 8px 0 #f6e27a, 0 -8px 0 #f6e27a,
    0 0 0 2px #1e1a24;
  opacity: 0;
  animation: spark 0.9s ease-out var(--d) forwards;
}

/* a name plate like the town's chips */
.stage__plaque {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin: 10px 0 0;
  padding: 8px 22px;
  border: 3px solid #1e1a24;
  border-radius: 999px;
  background: #fffdf9;
  box-shadow: 0 5px 0 #1e1a24;
}

.stage__name {
  font-family: var(--rl-font-title);
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.1;
}

.stage__tag {
  color: var(--rl-muted);
  font-size: 0.8125rem;
}

.stage__tag.is-new {
  color: #a84874;
  font-weight: 700;
}

@keyframes glow {
  50% { opacity: 0.7; }
}

@keyframes spark {
  0% { opacity: 1; transform: rotate(var(--a)) translateY(0) scale(0.4); }
  70% { opacity: 1; }
  100% { opacity: 0; transform: rotate(var(--a)) translateY(-120px) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .stage__spot,
  .spark {
    animation: none;
  }
}
</style>
