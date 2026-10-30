<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Explore the town: the four buildings stand along a strip of grass as tabs. Picking one shows
// what you do there: its scene drawn from the app's own art, a line and a few points.
// The tabs follow the usual keys: left and right arrows, Home and End.
import { computed, nextTick, ref } from 'vue'
import { STOPS } from './stops.js'
import StartSection from './StartSection.vue'
import StartPanel from './StartPanel.vue'
import StartStopArt from './StartStopArt.vue'
import StartBookcase from './StartBookcase.vue'

const picked = ref(STOPS[0].id)
const stop = computed(() => STOPS.find((s) => s.id === picked.value))
const tabs = ref([])

function pick(id) {
  picked.value = id
}

async function step(event, index) {
  const keys = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: STOPS.length - 1 }
  if (!(event.key in keys)) return
  event.preventDefault()
  const next = (keys[event.key] + STOPS.length) % STOPS.length
  pick(STOPS[next].id)
  await nextTick()
  tabs.value[next]?.focus()
}
</script>

<template>
  <StartSection id="town" title="Explore the town" lede="Each building is one part of IKDA. Tap one to see what you can do there.">
    <div class="town__street" role="tablist" aria-label="Places in town">
      <button
        v-for="(place, i) in STOPS"
        :id="`start-tab-${place.id}`"
        :key="place.id"
        ref="tabs"
        type="button"
        role="tab"
        class="place"
        :aria-selected="picked === place.id ? 'true' : 'false'"
        aria-controls="start-place"
        :tabindex="picked === place.id ? 0 : -1"
        @click="pick(place.id)"
        @keydown="step($event, i)"
      >
        <img class="place__building" :src="`/town/buildings/${place.id}.png`" alt="" />
        <span class="place__name">{{ place.title }}</span>
      </button>
    </div>
    <StartPanel id="start-place" class="inside" role="tabpanel" :aria-labelledby="`start-tab-${picked}`">
      <Transition name="inside" mode="out-in">
        <div :key="stop.id" class="inside__body" :style="{ '--place': stop.accent }">
          <div class="inside__words">
            <span class="inside__tab">{{ stop.tab }}</span>
            <h3 class="inside__title">{{ stop.heading }}</h3>
            <p class="inside__line">{{ stop.line }}</p>
            <ul class="inside__points">
              <li v-for="point in stop.points" :key="point">{{ point }}</li>
            </ul>
          </div>
          <div class="inside__scene" :class="{ 'inside__scene--case': stop.art.bookcase }">
            <StartBookcase v-if="stop.art.bookcase" />
            <StartStopArt v-else :art="stop.art" :accent="stop.accent" />
          </div>
        </div>
      </Transition>
    </StartPanel>
  </StartSection>
</template>

<style scoped>
/* the buildings stand on a strip of grass */
.town__street {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-items: end;
  gap: 12px;
  padding: 0 8px;
  border-bottom: 10px solid #4f8c35;
  background: linear-gradient(transparent 82%, #6fb14b 82%);
}

.place {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 4px 10px;
  border: 0;
  background: none;
  transition: transform 0.2s ease;
}

.place__building {
  width: 100%;
  max-width: 200px;
  height: auto;
  image-rendering: pixelated;
  filter: drop-shadow(0 6px 0 rgba(30, 26, 36, 0.25));
}

.place__name {
  padding: 2px 12px;
  border: 3px solid var(--s-ink);
  border-radius: 6px;
  background: var(--s-paper);
  color: var(--s-ink);
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
}

.place:hover {
  transform: translateY(-4px);
}

.place[aria-selected='true'] {
  transform: translateY(-8px);
}

.place[aria-selected='true'] .place__name {
  background: var(--s-ink);
  color: var(--s-paper);
}

.inside {
  margin-top: 24px;
  padding: 28px;
}

.inside__body {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  gap: 28px;
  align-items: center;
}

.inside__tab {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  background: var(--place);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.inside__title {
  margin: 10px 0 8px;
  font-family: var(--rl-font-title);
  font-size: 28px;
  font-weight: 700;
}

.inside__line {
  margin: 0;
  line-height: 1.55;
}

.inside__points {
  margin: 14px 0 0;
  padding-left: 20px;
}

.inside__points li {
  margin-bottom: 6px;
}

.inside__points li::marker {
  color: var(--place);
}

.inside__scene {
  display: flex;
  justify-content: center;
  min-width: 0;
}

/* the scene's own frame, kept at one size here so the panel doesn't jump between places */
.inside__scene :deep(.art) {
  --k: 1;
  max-width: 100%;
}

/* the reader's bookcase is drawn big, so it is shown smaller here */
.inside__scene--case :deep(.case) {
  zoom: 0.62;
}

.inside-enter-active,
.inside-leave-active {
  transition: opacity 0.2s ease;
}

.inside-enter-from,
.inside-leave-to {
  opacity: 0;
}

@media (max-width: 899px) {
  .inside__body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 575px) {
  .town__street {
    gap: 4px;
    padding: 0;
  }

  .place__name {
    padding: 2px 6px;
    font-size: 12px;
  }

  .inside {
    padding: 18px;
  }

  .inside__scene :deep(.art) {
    --k: 0.62;
  }

  .inside__scene--case :deep(.case) {
    zoom: 0.45;
  }
}

@media (prefers-reduced-motion: reduce) {
  .place,
  .inside-enter-active,
  .inside-leave-active {
    transition: none;
  }
}
</style>
