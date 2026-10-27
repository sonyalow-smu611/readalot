<script setup>
// Scaffolded with AI assistance (layout only) — see AI_USAGE.md
// One horizontal Discover shelf: title, "See all" link and a Swiper row of covers.
// The parent owns the data; this only displays `books` and emits `select` when a cover is tapped.
import { Swiper, SwiperSlide } from 'swiper/vue'
import { FreeMode } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/free-mode'
import BookTile from './BookTile.vue'
import SkeletonBlock from './SkeletonBlock.vue'

defineProps({
  title: { type: String, required: true },
  emoji: { type: String, default: '📚' },
  books: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  // Route for "See all", e.g. { name: 'genre-shelf', params: { genre: 'fantasy' } }; hidden when empty
  seeAll: { type: [String, Object], default: null },
  // what an empty shelf says
  empty: { type: String, default: 'No books on this shelf yet.' },
})

defineEmits(['select'])

const SKELETON_CARDS = 4
</script>

<template>
  <section class="discover-shelf">
    <header class="discover-shelf__head">
      <h2 class="discover-shelf__title">
        <span aria-hidden="true">{{ emoji }}</span> {{ title }}
      </h2>
      <RouterLink v-if="seeAll" class="discover-shelf__all" :to="seeAll">See all</RouterLink>
    </header>

    <div v-if="loading" class="discover-shelf__row">
      <div v-for="n in SKELETON_CARDS" :key="n" class="discover-card">
        <SkeletonBlock height="150px" radius="10px" class="mb-2" />
        <SkeletonBlock width="85%" height="10px" class="mb-1" />
        <SkeletonBlock width="55%" height="10px" />
      </div>
    </div>

    <p v-else-if="!books.length" class="discover-shelf__empty">{{ empty }}</p>

    <!-- slides-per-view "auto" + fixed card width leaves the next card partly visible -->
    <Swiper
      v-else
      :modules="[FreeMode]"
      free-mode
      slides-per-view="auto"
      :space-between="12"
      class="discover-shelf__swiper"
    >
      <SwiperSlide v-for="book in books" :key="book.id" class="discover-card">
        <BookTile :book="book" @select="$emit('select', $event)" />
      </SwiperSlide>
    </Swiper>
  </section>
</template>

<style scoped>
.discover-shelf {
  margin-bottom: 24px;
}

.discover-shelf__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.discover-shelf__title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1.1rem;
  color: var(--ink);
}

.discover-shelf__all {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink-muted);
  text-decoration: none;
}

.discover-shelf__row {
  display: flex;
  gap: 12px;
  overflow: hidden;
}

.discover-shelf__empty {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ink-muted);
}

.discover-shelf__swiper {
  overflow: visible;
}

.discover-card {
  width: 108px;
  flex-shrink: 0;
}
</style>
