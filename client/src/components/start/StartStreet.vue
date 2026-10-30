<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A street from the town along the bottom of a landing page screen: a far row of houses, a near
// row on the pavement, and townsfolk walking past. The rows shift with the mouse by their own
// depth (the page sets --px, --py). Only a picture.
import { computed } from 'vue'

// each house picture's size, from public/town/buildings/
const SIZES = {
  'cottage-brick': [404, 320],
  'cottage-green': [380, 300],
  'cottage-grey': [392, 320],
  'cottage-lilac': [354, 296],
  'cottage-white': [404, 328],
  house: [532, 420],
  library: [636, 532],
  cafe: [482, 388],
  salon: [482, 448],
}

const props = defineProps({
  // the near row, by picture name; the far row uses the same houses the other way round
  houses: { type: Array, required: true },
  // townsfolk walking the pavement (public/town/avatars/<id>.png)
  walkers: { type: Array, default: () => [] },
})

function row(names, scale) {
  // the row repeats so it fills a wide window
  return [...names, ...names].map((name, i) => {
    const [w, h] = SIZES[name]
    return { key: `${name}-${i}`, src: `/town/buildings/${name}.png`, width: `${Math.round(w * scale)}px`, height: `${Math.round(h * scale)}px` }
  })
}

const near = computed(() => row(props.houses, 0.42))
const far = computed(() => row([...props.houses].reverse(), 0.28))
</script>

<template>
  <div class="street" aria-hidden="true">
    <div class="street__row street__row--far">
      <img v-for="house in far" :key="house.key" :src="house.src" :style="{ width: house.width, height: house.height }" alt="" />
    </div>
    <div class="street__row street__row--near">
      <img v-for="house in near" :key="house.key" :src="house.src" :style="{ width: house.width, height: house.height }" alt="" />
    </div>
    <div class="street__pavement" />
    <img
      v-for="(id, i) in walkers"
      :key="id"
      class="street__walker"
      :class="{ 'street__walker--back': i % 2 === 1 }"
      :src="`/town/avatars/${id}.png`"
      :style="{ animationDelay: `${i * -13}s, 0s` }"
      alt=""
    />
  </div>
</template>

<style scoped>
.street {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 240px;
  overflow: hidden;
  pointer-events: none;
}

.street img {
  image-rendering: pixelated;
}

.street__row {
  position: absolute;
  left: 50%;
  display: flex;
  align-items: flex-end;
  gap: 28px;
  transform: translateX(-50%);
}

/* the far row sits back in the evening haze */
.street__row--far {
  bottom: 70px;
  gap: 40px;
  opacity: 0.45;
  filter: brightness(0.75) saturate(0.6);
  translate: calc(var(--px, 0) * -10px) 0;
}

.street__row--near {
  bottom: 40px;
  translate: calc(var(--px, 0) * -28px) 0;
}

/* the town's paving stones, with a kerb on top */
.street__pavement {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 44px;
  border-top: 4px solid #b9ad97;
  background:
    linear-gradient(90deg, rgba(0, 0, 0, 0.08) 2px, transparent 2px) 0 0 / 40px 100%,
    #d8cdb8;
}

.street__walker {
  position: absolute;
  bottom: 12px;
  left: 0;
  width: 60px;
  height: 116px;
  animation: street-walk 42s linear infinite, street-step 0.5s steps(2, end) infinite;
}

.street__walker--back {
  animation-direction: reverse, normal;
}

@keyframes street-walk {
  from { left: -80px; }
  to { left: calc(100% + 20px); }
}

@keyframes street-step {
  50% { translate: 0 -4px; }
}

@media (max-width: 767px) {
  .street {
    height: 170px;
  }

  .street__row--far {
    display: none;
  }

  .street__row--near {
    bottom: 36px;
    zoom: 0.7;
  }

  .street__pavement {
    height: 36px;
  }

  .street__walker {
    bottom: 8px;
    zoom: 0.8;
  }
}

@media (prefers-reduced-motion: reduce) {
  .street__walker {
    animation: none;
    left: 30%;
  }

  .street__walker--back {
    left: 62%;
  }
}
</style>
