<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The reader's favourite genres, each a button that opens that genre's bookcase in the library.
// A genre is the name of a bookcase (lib/genreShelves.js), so every one has somewhere to go.
import { computed } from 'vue'
import ProfileBlock from '@/buildings/salon/components/ProfileBlock.vue'
import { shelfOf } from '@/lib/genreShelves.js'

const props = defineProps({
  genres: { type: Array, required: true },
})

// each genre with the bookcase it opens; one with no bookcase (an old saved name) isn't shown
const shelves = computed(() =>
  props.genres
    .map((genre) => ({ genre, shelf: shelfOf(genre) }))
    .filter((entry) => entry.shelf),
)
</script>

<template>
  <ProfileBlock title="Favourite genres">
    <ul v-if="shelves.length" class="tags" data-tour="profile-genres">
      <li v-for="({ shelf }, index) in shelves" :key="shelf.key">
        <RouterLink
          class="btn btn-secondary tag"
          :data-tour="index === 0 ? 'profile-genre' : null"
          :to="{ name: 'library', query: { shelf: shelf.key } }"
          :aria-label="`${shelf.label} bookcase in the library`"
        >
          {{ shelf.label }}
        </RouterLink>
      </li>
    </ul>
    <p v-else class="block__empty">None picked yet. Edit your profile to add some.</p>
  </ProfileBlock>
</template>

<style scoped>
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tag {
  font-size: 0.875rem;
}
</style>
