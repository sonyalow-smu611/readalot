<template>
  <span aria-label="Rating">
    <span v-for="star in 5" :key="star">{{ star <= rating ? "★" : "☆" }}</span>
  </span>
</template>

<script setup>
defineProps({
  rating: {
    type: Number,
    default: 0
  }
});
</script>
