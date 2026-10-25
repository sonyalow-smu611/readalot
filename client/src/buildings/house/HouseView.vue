<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Your house → My Room. Owner: Sonz. Everything inside this folder is yours to change.
// For now it shows the existing room page; move RoomView and its parts in here when ready.
import BuildingShell from '@/components/shared/BuildingShell.vue'
import RoomView from '@/views/RoomView.vue'
import { PLACES } from '@/town/places.js'

const place = PLACES.find((p) => p.id === 'house')
</script>

<template>
  <BuildingShell :title="place.name" :subtitle="place.tab" :owner="place.owner" :accent="place.accent" flush>
    <RoomView />
  </BuildingShell>
</template>
