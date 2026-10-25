<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Hair Salon → Profile. Owner: Aalric. Everything inside this folder is yours to change.
// For now it shows the existing Profile page; move ProfileView and its parts in here when ready.
// The character picker is still to build: the town reads the choice from profile.character.
import BuildingShell from '@/components/shared/BuildingShell.vue'
import WipPanel from '@/components/shared/WipPanel.vue'
import ProfileView from '@/views/ProfileView.vue'
import { PLACES } from '@/town/places.js'

const place = PLACES.find((p) => p.id === 'salon')
const pickerPlan = [
  'Pick one of the five characters: Rosie, Maya, Rex, Jay or Nova (public/town/avatars/)',
  'Save the choice as profile.character so the town can draw you',
]
</script>

<template>
  <BuildingShell :title="place.name" :subtitle="place.tab" :owner="place.owner" :accent="place.accent">
    <WipPanel class="mb-4" :owner="place.owner" :items="pickerPlan" />
    <ProfileView />
  </BuildingShell>
</template>
