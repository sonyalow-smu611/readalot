<!--
  A book's own page. It is the room's Book details card, at the same size and in the same
  place, over a soft picture of the room; ✕ goes back to wherever the reader came from.
  A book on the reader's shelf shows at once from the shelf's copy while the full details load.
  Written with AI assistance: see AI_USAGE.md.
-->
<template>
  <section class="book-page">
    <img class="book-page__room" :src="roomArt" alt="" draggable="false" />
    <BookCard class="book-page__card" close-label="Back" @close="goBack">
      <BookDetailsContent v-if="book" :book="book" title-tag="h1" :links-to-page="false" />
      <div v-else-if="loading || (!data && !error)" class="book-page__state" role="status">
        <span class="spinner-border" aria-hidden="true"></span>
        Opening the book…
      </div>
      <div v-else class="book-page__state" role="alert">
        <strong>Couldn't open this book.</strong>
        {{ error || "It may have been taken off the shelves." }}
        <button type="button" class="btn book-page__retry" @click="load">Retry</button>
      </div>
    </BookCard>
  </section>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import roomArt from "@/assets/room/room.webp";
import BookCard from "@/components/book/BookCard.vue";
import BookDetailsContent from "@/components/book/BookDetailsContent.vue";
import { useAsync } from "@/composables/useAsync.js";
import { getBook } from "@/services/api.js";
import { useBookshelfStore } from "@/stores/bookshelf";

const route = useRoute();
const router = useRouter();
const bookshelf = useBookshelfStore();
const { data, error, loading, run } = useAsync(() => getBook(route.params.id));

// the full details over the shelf's copy; a detail the server does not have keeps the shelf's
const book = computed(() => {
  const shelved = bookshelf.findBook(route.params.id);
  const full = data.value?.book;
  if (!full) return shelved;
  const known = Object.fromEntries(Object.entries(full).filter(([, value]) => value != null && value !== ""));
  return { ...shelved, ...known };
});

function load() {
  return run().catch(() => {});
}

function goBack() {
  // straight here from a link: there is nowhere to go back to, so home to the room
  if (window.history.state?.back) router.back();
  else router.push("/");
}

onMounted(() => {
  load();
  // which shelf the book is on comes from the reader's shelf
  if (!bookshelf.books.length && !bookshelf.loading) bookshelf.load();
});
</script>

<style scoped>
.book-page {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: #3a2a1e;
}

/* the room, out of focus and dimmed, as it is behind the card when a book is opened there */
.book-page__room {
  position: absolute;
  inset: -16px;
  width: calc(100% + 32px);
  height: calc(100% + 32px);
  object-fit: cover;
  filter: blur(6px) brightness(0.72);
  pointer-events: none;
  user-select: none;
}

.book-page__card {
  position: absolute;
  inset: 10%;
}

.book-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 60vh;
  padding: 0 8px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 15px;
  text-align: center;
  color: #414833;
}

.book-page__state .spinner-border {
  color: #7f5539;
}

.book-page__retry {
  --bs-btn-font-family: Georgia, "Times New Roman", serif;
  --bs-btn-font-size: 14px;
  --bs-btn-color: #fffdf9;
  --bs-btn-bg: #7f5539;
  --bs-btn-border-color: #7f5539;
  --bs-btn-hover-color: #fffdf9;
  --bs-btn-hover-bg: #414833;
  --bs-btn-hover-border-color: #414833;
  --bs-btn-border-radius: 12px;
  margin-top: 4px;
}
</style>
