<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Someone else's room, opened from their profile in the Cafe: the same room as My Room, drawn
// from the same template, with their books and furniture in it. Visitors look around; they can't
// change anything.
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BuildingShell from '@/components/shared/BuildingShell.vue'
import RoomView from './RoomView.vue'
import { readerRoom } from './visitors.js'
import { PLACES } from '@/town/places.js'
import { useProgressStore } from '@/stores/progress.js'

const route = useRoute()
const place = PLACES.find((p) => p.id === 'house')
const reader = ref(null)
const loading = ref(true)
const error = ref('')
const progress = useProgressStore()

async function load(id) {
  loading.value = true
  error.value = ''
  try {
    reader.value = await readerRoom(id)
    // visiting a reader's room earns XP, once per reader a day
    if (reader.value) progress.earn('visit_room', reader.value.id)
  } catch (err) {
    reader.value = null
    error.value = err.message || "Couldn't load their room."
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, load, { immediate: true })
</script>

<template>
  <BuildingShell
    v-if="reader"
    :title="`${reader.firstName}'s Room`"
    subtitle="Visiting"
    :owner="reader.name"
    flush
    :back="{ name: 'reader-room', params: { id: reader.id } }"
    :back-label="`Back to ${reader.firstName}'s profile`"
  >
    <RoomView :key="reader.id" :visiting="reader" :style="{ '--house-accent': place.accent }" />
  </BuildingShell>

  <BuildingShell v-else-if="loading" title="Visiting" :owner="place.owner" :back="{ name: 'cafe' }" back-label="Back to the Cafe">
    <p class="visit-missing" role="status">Knocking on the door…</p>
  </BuildingShell>

  <BuildingShell v-else-if="error" title="Visiting" :owner="place.owner" :back="{ name: 'cafe' }" back-label="Back to the Cafe">
    <div class="visit-missing" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="btn btn-link" @click="load(route.params.id)">Try again</button>
    </div>
  </BuildingShell>

  <BuildingShell v-else title="Room not found" :owner="place.owner" :back="{ name: 'cafe' }" back-label="Back to the Cafe">
    <div class="visit-missing">
      <p>We couldn't find that reader.</p>
      <RouterLink :to="{ name: 'cafe' }">Find readers in the Cafe</RouterLink>
    </div>
  </BuildingShell>
</template>

<style scoped>
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
