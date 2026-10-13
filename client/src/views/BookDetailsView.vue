<template>
  <section class="app-shell">
    <StateView :loading="loading" :error="error" @retry="load">
      <template v-if="book">
        <div class="d-flex gap-3 mb-4">
          <BookCover :cover-url="book.coverUrl" :title="book.title" :seed="book.id" />
          <div>
            <h1 class="h3">{{ book.title }}</h1>
            <p class="text-muted mb-2">{{ book.authors?.join(", ") }}</p>
            <p v-if="facts" class="text-muted small mb-2">{{ facts }}</p>
            <ReadingStatusButtons v-model="status" />
          </div>
        </div>

        <p v-if="book.genres?.length" class="small text-muted">{{ book.genres.join(" · ") }}</p>
        <p class="book-details__description">{{ book.description || "No description for this book." }}</p>
        <!-- Google Books has a rating for only a few books -->
        <template v-if="book.averageRating">
          <RatingStars :rating="Math.round(book.averageRating)" />
          <p class="text-muted small">
            {{ book.averageRating }} from {{ book.ratingsCount }} {{ book.ratingsCount === 1 ? "rating" : "ratings" }}
          </p>
        </template>
      </template>
    </StateView>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import BookCover from "../components/BookCover.vue";
import RatingStars from "../components/RatingStars.vue";
import ReadingStatusButtons from "../components/ReadingStatusButtons.vue";
import StateView from "../components/StateView.vue";
import { useAsync } from "../composables/useAsync.js";
import { getBook, saveUserBook } from "../services/api.js";

const route = useRoute();
const status = ref("");
const { data, error, loading, run } = useAsync(() => getBook(route.params.id));

const book = computed(() => data.value?.book || null);

// publisher, year and length, leaving out whatever Google Books does not have
const facts = computed(() =>
  [
    book.value.publisher,
    book.value.publishedDate?.slice(0, 4),
    book.value.pageCount ? `${book.value.pageCount} pages` : ""
  ]
    .filter(Boolean)
    .join(" · ")
);

function load() {
  return run().catch(() => {});
}

watch(status, async (nextStatus) => {
  if (nextStatus && book.value) {
    await saveUserBook({ bookId: book.value.id, status: nextStatus });
  }
});

onMounted(load);
</script>

<style scoped>
/* the description keeps the paragraph breaks Google Books sends */
.book-details__description {
  white-space: pre-line;
}
</style>
