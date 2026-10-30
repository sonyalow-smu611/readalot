<!--
  A book's own page. It is the room's Book details card, at the same size and in the same
  place, over a soft picture of the room; ✕ goes back to wherever the reader came from.
  A book on the reader's shelf shows at once from the shelf's copy while the full details load.
  Written with AI assistance: see AI_USAGE.md.
-->
<template>
  <section class="book-page">
    <BookCard class="book-page__card" close-label="Back" @close="goBack">
      <BookDetailsContent v-if="book" :book="book" title-tag="h1" :links-to-page="false" />
      <div v-else-if="loading || (!data && !error)" class="book-page__state" role="status">
        <span class="spinner-border" aria-hidden="true"></span>
        Opening the book…
      </div>
      <div v-else class="book-page__state" role="alert">
        <strong>Couldn't open this book.</strong>
        {{ error || "It may have been taken off the shelves." }}
        <button type="button" class="btn btn-primary book-page__retry" @click="load">Retry</button>
      </div>
    </BookCard>
  </section>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
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
  else router.push({ name: "room" });
}

onMounted(() => {
  load();
  // which shelf the book is on comes from the reader's shelf
  if (!bookshelf.books.length && !bookshelf.loading) bookshelf.load();
});
</script>

<style scoped>
/* the town's page: the parchment canvas, the card on it (see BookCard) */
.book-page {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: var(--rl-canvas);
}

.book-page__card {
  position: absolute;
  inset: 10%;
  /* on a laptop it fills the window, up to a width that still reads well */
  max-width: 1100px;
  margin-inline: auto;
}

.book-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 60vh;
  padding: 0 8px;
  font-family: var(--rl-font-body);
  font-size: 14px;
  text-align: center;
  color: var(--rl-text);
}

.book-page__state strong {
  font-family: var(--rl-font-title);
}

.book-page__state .spinner-border {
  color: var(--rl-accent);
}

.book-page__retry {
  margin-top: 4px;
}
</style>
