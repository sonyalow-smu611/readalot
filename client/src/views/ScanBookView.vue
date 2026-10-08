<template>
  <section class="app-shell">
    <h1 class="h3 mb-3">Scan Book</h1>
    <input class="form-control mb-3" type="file" accept="image/*" @change="scan">

    <RouterLink
      v-if="book"
      class="d-flex gap-3 text-decoration-none text-dark p-3 border bg-white rounded-2"
      :to="`/books/${book.id}`"
    >
      <BookCover :cover-url="book.coverUrl" :title="book.title" />
      <div>
        <h2 class="h5">{{ book.title }}</h2>
        <p class="small text-muted mb-0">{{ detectedText }}</p>
      </div>
    </RouterLink>
  </section>
</template>

<script setup>
import { ref } from "vue";
import BookCover from "../components/BookCover.vue";
import { scanBook } from "../services/api.js";

const book = ref(null);
const detectedText = ref("");

async function scan(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const imageBase64 = await toBase64(file);
  const result = await scanBook(imageBase64);
  book.value = result.book;
  detectedText.value = result.detectedText;
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
</script>
