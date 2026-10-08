<template>
  <section v-if="book" class="app-shell">
    <div class="d-flex gap-3 mb-4">
      <BookCover :cover-url="book.coverUrl" :title="book.title" />
      <div>
        <h1 class="h3">{{ book.title }}</h1>
        <p class="text-muted mb-2">{{ book.authors?.join(", ") }}</p>
        <ReadingStatusButtons v-model="status" />
      </div>
    </div>

    <p>{{ book.description }}</p>
    <RatingStars :rating="Math.round(book.averageRating || 0)" />
  </section>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import BookCover from "../components/BookCover.vue";
import RatingStars from "../components/RatingStars.vue";
import ReadingStatusButtons from "../components/ReadingStatusButtons.vue";
import { getBook, saveUserBook } from "../services/api.js";

const route = useRoute();
const book = ref(null);
const status = ref("");

watch(status, async (nextStatus) => {
  if (nextStatus && book.value) {
    await saveUserBook({ bookId: book.value.id, status: nextStatus });
  }
});

onMounted(async () => {
  book.value = (await getBook(route.params.id)).book;
});
</script>
