<template>
  <section class="app-shell">
    <h1 class="h3 mb-3">Mood Check-in</h1>
    <div class="d-flex flex-wrap gap-2 mb-4">
      <button
        v-for="mood in moods"
        :key="mood"
        class="btn"
        :class="selectedMood === mood ? 'btn-success' : 'btn-outline-success'"
        type="button"
        @click="chooseMood(mood)"
      >
        {{ mood }}
      </button>
    </div>

    <RouterLink
      v-if="book"
      class="d-flex gap-3 text-decoration-none text-dark p-3 border bg-white rounded-2"
      :to="`/books/${book.id}`"
    >
      <BookCover :cover-url="book.coverUrl" :title="book.title" />
      <div>
        <h2 class="h5">{{ book.title }}</h2>
        <p class="small text-muted mb-0">{{ book.description }}</p>
      </div>
    </RouterLink>
  </section>
</template>

<script setup>
import { ref } from "vue";
import BookCover from "../components/BookCover.vue";
import { getRecommendations } from "../services/api.js";

const moods = ["sad", "stressed", "bored", "reflective", "romantic"];
const selectedMood = ref("");
const book = ref(null);

async function chooseMood(mood) {
  selectedMood.value = mood;
  book.value = (await getRecommendations(mood)).book;
}
</script>
