<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Library → Discover. Owner: Aasim. Everything inside this folder is yours to change.
// For now it shows the existing Discover page; move DiscoverBooksView and its parts in here when ready.
import BuildingShell from '@/components/shared/BuildingShell.vue'
import DiscoverBooksView from '@/views/DiscoverBooksView.vue'
import { PLACES } from '@/town/places.js'

const place = PLACES.find((p) => p.id === 'library')
</script>

<template>
  <BuildingShell :title="place.name" :subtitle="place.tab" :owner="place.owner" :accent="place.accent">
    <DiscoverBooksView />
  </BuildingShell>
</template>
