<script setup>
// AI-assisted scaffold — have a teammate review and record it in AI_USAGE.md.
// Cafe → the town's social building. All new behaviour stays in buildings/cafe/.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BuildingShell from '@/components/shared/BuildingShell.vue'
import CafeScene from '@/buildings/cafe/components/CafeScene.vue'
import CafeReaderCard from '@/buildings/cafe/components/CafeReaderCard.vue'
import { drawCafeArt } from '@/buildings/cafe/cafeArt.js'
import {
  getCompatibility, getCurrentlyReading, getDemoReader, getSharedBooks,
  isFollowing, toggleFollow,
} from '@/services/peopleDemo.js'
import { useUserStore } from '@/stores/user'
import { PLACES } from '@/town/places.js'

const place = PLACES.find((p) => p.id === 'cafe')
const router = useRouter()
const user = useUserStore()
const art = drawCafeArt()
const activeId = ref('')
const error = ref('')
const following = ref(false)

const activeReader = computed(() => activeId.value ? getDemoReader(activeId.value) : null)
const sharedBooks = computed(() => activeReader.value ? getSharedBooks(activeReader.value) : [])
const currentBook = computed(() => activeReader.value ? getCurrentlyReading(activeReader.value) : null)
const match = computed(() => activeReader.value ? getCompatibility(activeReader.value) : 0)

function select(id) {
  activeId.value = id
  error.value = ''
  following.value = id ? isFollowing(id) : false
}

function follow() {
  if (!activeReader.value) return
  try {
    following.value = toggleFollow(activeReader.value.id)
    error.value = ''
  } catch (err) {
    error.value = err.message || 'Could not save your follow.'
  }
}

function visitRoom() {
  if (!activeReader.value) return
  router.push({ name: 'reader-room', params: { id: activeReader.value.id } })
}
</script>

<template>
  <BuildingShell
    :title="place.name" :subtitle="place.tab" :owner="place.owner" :accent="place.accent" flush
  >
    <div class="cafe-view" data-tour="people-map">
      <CafeScene :art="art" :character="user.profile.character" :selected-id="activeId" @select="select" />
      <Transition name="cafe-popup">
        <CafeReaderCard
          v-if="activeReader" :key="activeReader.id" :reader="activeReader"
          :score="match" :shared-books="sharedBooks" :currently-reading="currentBook"
          :following="following" :error="error"
          @close="select('')" @follow="follow" @visit="visitRoom"
        />
      </Transition>
    </div>
  </BuildingShell>
</template>

<style scoped>
.cafe-view { position:relative; width:100%; height:100%; min-height:0; background:#a7784d; }
.cafe-popup-enter-active, .cafe-popup-leave-active { transition: opacity 150ms ease, transform 150ms ease; }
.cafe-popup-enter-from, .cafe-popup-leave-to { opacity:0; transform:translate(-50%, 9px); }
@media(prefers-reduced-motion:reduce) { .cafe-popup-enter-active, .cafe-popup-leave-active { transition:none; } }
</style>
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
