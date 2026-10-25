<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Cafe → Social. Owner: Emiley. Everything inside this folder is yours to change.
// For now it shows the existing People page; move PeopleView and its parts in here when ready.
import BuildingShell from '@/components/shared/BuildingShell.vue'
import PeopleView from '@/views/PeopleView.vue'
import { PLACES } from '@/town/places.js'

const place = PLACES.find((p) => p.id === 'cafe')
</script>

<template>
  <BuildingShell :title="place.name" :subtitle="place.tab" :owner="place.owner" :accent="place.accent">
    <PeopleView />
  </BuildingShell>
</template>
