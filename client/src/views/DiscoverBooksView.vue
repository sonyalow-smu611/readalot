<template>
  <section class="app-shell">
    <div class="d-flex gap-2 mb-4">
      <input v-model="query" class="form-control" placeholder="Search books">
      <button class="btn btn-success" type="button" @click="loadBooks">Search</button>
    </div>

    <BookCarousel title="Search Results" :books="books" />
  </section>
</template>

<script setup>
import { onMounted, ref } from "vue";
import BookCarousel from "../components/BookCarousel.vue";
import { searchBooks } from "../services/api.js";

const query = ref("popular fiction");
const books = ref([]);

async function loadBooks() {
  books.value = (await searchBooks(query.value)).books;
}

onMounted(loadBooks);
</script>
