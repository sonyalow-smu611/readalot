<template>
  <img
    v-if="coverUrl"
    class="book-cover"
    :src="coverUrl"
    :alt="title"
  >
  <div
    v-else
    class="book-cover d-flex align-items-center justify-content-center text-center small px-2"
    :style="{ background: look.colour, color: look.ink }"
  >
    {{ title }}
  </div>
</template>

<script setup>
import { computed } from "vue";
import { spineLook } from "../services/shelves.js";

const props = defineProps({
  coverUrl: String,
  title: {
    type: String,
    default: "Untitled"
  },
  // usually the book id, so the placeholder matches the book's spine colour
  seed: String
});

// no cover image: fall back to a plain cloth cover in the book's own colour
const look = computed(() => spineLook({ id: props.seed || props.title }));
</script>
