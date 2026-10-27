<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Someone else's room, opened from their profile in the Cafe: the same room as My Room, drawn
// from the same template, with their books and furniture in it. Visitors look around; they can't
// change anything.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BuildingShell from '@/components/shared/BuildingShell.vue'
import RoomView from './RoomView.vue'
import { readerRoom } from './visitors.js'
import { PLACES } from '@/town/places.js'

const route = useRoute()
const place = PLACES.find((p) => p.id === 'house')
const reader = computed(() => readerRoom(route.params.id))
</script>

<template>
  <BuildingShell
    v-if="reader"
    :title="`${reader.firstName}'s Room`"
    subtitle="Visiting"
    :owner="reader.name"
    :accent="place.accent"
    flush
    :back="{ name: 'reader-room', params: { id: reader.id } }"
    :back-label="`Back to ${reader.firstName}'s profile`"
  >
    <RoomView :key="reader.id" :visiting="reader" :style="{ '--house-accent': place.accent }" />
  </BuildingShell>

  <BuildingShell v-else title="Room not found" :owner="place.owner" :accent="place.accent" :back="{ name: 'cafe' }" back-label="Back to the Cafe">
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
