<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Someone else's room, opened from their profile in the Cafe: the same room as My Room, drawn
// from the same template, with their books and furniture in it. Visitors look around; they can't
// change anything.
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BuildingShell from '@/components/shared/BuildingShell.vue'
import RoomView from './RoomView.vue'
import KnockingDoor from './components/KnockingDoor.vue'
import { knownFirstName, readerRoom } from './visitors.js'
import { PLACES } from '@/town/places.js'
import { useProgressStore } from '@/stores/progress.js'

const route = useRoute()
const place = PLACES.find((p) => p.id === 'house')
const reader = ref(null)
const loading = ref(true)
const error = ref('')
const progress = useProgressStore()
// true once the door has opened and the room can show
const entered = ref(false)
const knockingOn = computed(() => reader.value?.firstName ?? knownFirstName(route.params.id))
// came in through their front door on the map (?from=town): back goes to the town; otherwise
// they came from the reader's profile, so back goes there (or the Cafe, before the room loads)
const fromTown = computed(() => route.query.from === 'town')
const roomBack = computed(() =>
  fromTown.value
    ? { to: { name: 'town' }, label: 'Back to town' }
    : { to: { name: 'reader-room', params: { id: reader.value?.id } }, label: `Back to ${reader.value?.firstName}'s profile` },
)
const outsideBack = computed(() =>
  fromTown.value ? { to: { name: 'town' }, label: 'Back to town' } : { to: { name: 'cafe' }, label: 'Back to the Cafe' },
)

async function load(id) {
  loading.value = true
  error.value = ''
  reader.value = null
  entered.value = false
  let room = null
  let failure = ''
  try {
    room = await readerRoom(id)
  } catch (err) {
    failure = err.message || "Couldn't load their room."
  }
  // they've left, or gone on to someone else's room, while this one loaded
  if (id !== route.params.id) return
  reader.value = room
  error.value = failure
  loading.value = false
  // visiting a reader's room earns XP, once per reader a day
  if (room) progress.earn('visit_room', room.id)
}

watch(() => route.params.id, load, { immediate: true })
</script>

<template>
  <BuildingShell
    v-if="reader && entered"
    class="visit-arrive"
    :title="`${reader.firstName}'s Room`"
    subtitle="Visiting"
    :owner="reader.name"
    flush
    :back="roomBack.to"
    :back-label="roomBack.label"
  >
    <RoomView :key="reader.id" :visiting="reader" :style="{ '--house-accent': place.accent }" />
  </BuildingShell>

  <BuildingShell v-else-if="loading || reader" title="Visiting" :owner="place.owner" flush :back="outsideBack.to" :back-label="outsideBack.label">
    <KnockingDoor :name="knockingOn" :ready="Boolean(reader)" @opened="entered = true" />
  </BuildingShell>

  <BuildingShell v-else-if="error" title="Visiting" :owner="place.owner" :back="outsideBack.to" :back-label="outsideBack.label">
    <div class="visit-missing" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="btn btn-secondary btn-sm" @click="load(route.params.id)">Try again</button>
    </div>
  </BuildingShell>

  <BuildingShell v-else title="Room not found" :owner="place.owner" :back="outsideBack.to" :back-label="outsideBack.label">
    <div class="visit-missing">
      <p>We couldn't find that reader.</p>
      <RouterLink class="btn btn-secondary btn-sm" :to="{ name: 'cafe' }">Find readers in the Cafe</RouterLink>
    </div>
  </BuildingShell>
</template>

<style scoped>
.visit-arrive {
  animation: visit-arrive 0.2s ease;
}

@keyframes visit-arrive {
  from {
    opacity: 0;
  }
}

.visit-missing {
  padding: 18px;
  border: 1px solid var(--rl-line);
  border-radius: 16px;
  background: var(--rl-surface);
  text-align: center;
}

.visit-missing a {
  font-weight: 700;
  color: var(--house-accent, var(--rl-primary));
}
</style>
