<template>
  <img
    v-if="coverUrl"
    class="book-cover"
    :src="coverUrl"
    :alt="title"
  >
  <div v-else class="book-cover d-flex align-items-center justify-content-center text-center small px-2">
    {{ title }}
  </div>
</template>

<script setup>
defineProps({
  coverUrl: String,
  title: {
    type: String,
    default: "Untitled"
  }
});
</script>
