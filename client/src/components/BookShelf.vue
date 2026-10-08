<template>
  <section class="mb-4">
    <div class="d-flex align-items-center justify-content-between mb-2">
      <h2 class="h5 mb-0">{{ title }}</h2>
      <slot name="action" />
    </div>
    <div class="d-flex gap-3 overflow-auto pb-2">
      <RouterLink
        v-for="book in books"
        :key="book.id"
        class="text-decoration-none text-dark"
        :to="`/books/${book.id}`"
      >
        <BookCover :cover-url="book.coverUrl" :title="book.title" />
        <p class="small mt-2 mb-0 text-truncate" style="width: 88px">{{ book.title }}</p>
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import BookCover from "./BookCover.vue";

defineProps({
  title: {
    type: String,
    required: true
  },
  books: {
    type: Array,
    default: () => []
  }
});
</script>
