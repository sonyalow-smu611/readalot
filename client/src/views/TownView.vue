<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Home after signing in: the town. This view only holds the state and wires the town's parts
// together; each building opens one teammate's page (see src/buildings/).
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { PLACES } from '@/town/places.js'
import { useUserStore } from '@/stores/user'
import TownMap from '@/components/town/TownMap.vue'
import TownHud from '@/components/town/TownHud.vue'
import PlacesMenu from '@/components/town/PlacesMenu.vue'
import PlaceCard from '@/components/town/PlaceCard.vue'

const router = useRouter()
const { profile } = storeToRefs(useUserStore())

const ready = ref(false)
const selected = ref(null)
const placesOpen = ref(false)
const focus = ref(null)
const hint = ref(true)

function select(place) {
  selected.value = place
  placesOpen.value = false
  hint.value = false
}

function togglePlaces() {
  placesOpen.value = !placesOpen.value
  hint.value = false
}

function go(id) {
  focus.value = { id, key: Date.now() }
}

function enter(place) {
  router.push(place.route)
}
</script>

<template>
  <section class="town" aria-label="Readalot Town">
    <TownMap :focus="focus" :selected-id="selected?.id ?? null" @select="select" @ready="ready = true" />
    <TownHud :name="profile.name || 'You'" :avatar="profile.avatar" :places-open="placesOpen" @toggle-places="togglePlaces" />
    <PlacesMenu :places="PLACES" :open="placesOpen" @go="go" />

    <Transition name="town-fade">
      <p v-if="hint && ready && !selected" class="town__hint">Drag to look around. Tap a building to go in.</p>
    </Transition>

    <Transition name="town-card">
      <PlaceCard v-if="selected" :key="selected.id" :place="selected" @enter="enter" @close="selected = null" />
    </Transition>
  </section>
</template>

<style scoped>
.town {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: #6fb14b;
  touch-action: none;
}

.town__hint {
  position: absolute;
  left: 50%;
  top: 72px;
  z-index: 4;
  margin: 0;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(65, 72, 51, 0.88);
  color: var(--rl-surface);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  transform: translateX(-50%);
  pointer-events: none;
}

.town-card-enter-active,
.town-card-leave-active,
.town-fade-enter-active,
.town-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.town-card-enter-from,
.town-card-leave-to {
  opacity: 0;
  transform: translateY(24px);
}

.town-fade-enter-from,
.town-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .town-card-enter-active,
  .town-card-leave-active,
  .town-fade-enter-active,
  .town-fade-leave-active {
    transition: none;
  }
}
</style>
