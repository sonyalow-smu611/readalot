<template>
  <section class="app-shell">
    <div class="d-flex align-items-start justify-content-between mb-4">
      <div>
        <p class="text-uppercase small text-success mb-1">My Room</p>
        <h1 class="h3 mb-1">Welcome back, reader</h1>
        <p class="text-muted mb-0">{{ quote?.quoteText || "Loading quote..." }}</p>
      </div>
      <RouterLink class="btn btn-outline-success btn-sm" to="/mood">Mood</RouterLink>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <div class="p-3 border bg-white rounded-2">
          <h2 class="h6">Weather Window</h2>
          <p class="mb-0">{{ weatherText }}</p>
        </div>
      </div>
      <div class="col-md-6">
        <div class="p-3 border bg-white rounded-2">
          <h2 class="h6">Currently Reading</h2>
          <p class="mb-0">Save a book as Reading to show it here.</p>
        </div>
      </div>
    </div>

    <BookShelf title="To Be Read" :books="books" />
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import BookShelf from "../components/BookShelf.vue";
import { getTodayQuote, getWeather, searchBooks } from "../services/api.js";

const books = ref([]);
const quote = ref(null);
const weather = ref(null);

const weatherText = computed(() => {
  if (!weather.value) return "Weather appears here once location is available.";
  return `${weather.value.temperature}°C, wind ${weather.value.windSpeed} km/h`;
});

onMounted(async () => {
  quote.value = await getTodayQuote();
  books.value = (await searchBooks("cozy fiction")).books;
  weather.value = await getWeather(1.3521, 103.8198);
});
</script>
