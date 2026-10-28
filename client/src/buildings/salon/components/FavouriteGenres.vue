<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The reader's favourite genres; each opens that genre's shelf.
import ProfileBlock from '@/buildings/salon/components/ProfileBlock.vue'

defineProps({
  genres: { type: Array, required: true },
})
</script>

<template>
  <ProfileBlock title="Favourite genres">
    <ul v-if="genres.length" class="tags">
      <li v-for="genre in genres" :key="genre">
        <RouterLink class="tag" :to="{ name: 'genre-shelf', params: { genre } }">
          {{ genre }}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
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
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-height: 44px;
  padding: 6px 10px 6px 14px;
  border: 2px solid #1e1a24;
  border-radius: 999px;
  background: #fbe7f0;
  color: #1e1a24;
  font-weight: 700;
  font-size: 0.875rem;
  text-decoration: none;
}

.tag:hover {
  background: #f6c9dc;
  color: #1e1a24;
  animation: tag-bounce 0.45s steps(5, end);
}

.tag:active {
  transform: translateY(2px);
}

li:nth-child(odd) .tag {
  background: #fff2c9;
}

@keyframes tag-bounce {
  30% {
    transform: translateY(-6px);
  }
  60% {
    transform: translateY(1px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tag:hover {
    animation: none;
  }
}

.tag svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
