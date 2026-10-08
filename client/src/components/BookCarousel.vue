<template>
  <BookShelf :title="title" :books="books" />
</template>

<script setup>
import BookShelf from "./BookShelf.vue";

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
