<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Your house → My Room. Owner: Sonz. Everything inside this folder is yours to change.
// The room page, its 3D room and their parts all live in this folder.
import BuildingShell from '@/components/shared/BuildingShell.vue'
import RoomView from './RoomView.vue'
import { PLACES } from '@/town/places.js'

const place = PLACES.find((p) => p.id === 'house')
</script>

<template>
  <BuildingShell :title="place.name" :subtitle="place.tab" :owner="place.owner" flush>
    <!-- the house's colour from the town, for the room's buttons and cards -->
    <RoomView :style="{ '--house-accent': place.accent }" />
  </BuildingShell>
</template>
