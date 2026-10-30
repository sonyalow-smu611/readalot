<!-- Quick Book Preview (reference screen 07). Opens whenever `book` is set. The genre page, Discover
     and search open it; My Shelf and a friend's shelf open it too, naming it "Book details",
     with the shelf it's on, and their own extras (progress, Remove) in the slot. -->
<template>
  <div
    v-if="book"
    ref="dialog"
    class="modal d-block rl-modal"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    :aria-label="label || `Quick preview: ${book.title}`"
    @click.self="$emit('close')"
    @keydown.esc="$emit('close')"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content preview">
        <div class="preview__top">
          <BookCover class="preview__cover" :cover-url="book.coverUrl" :title="book.title" :seed="book.id" />
          <div class="preview__meta">
            <p v-if="tab" class="preview__tab">{{ tab }}</p>
            <h2 class="preview__title">{{ book.title }}</h2>
            <p class="preview__author">{{ book.authors?.join(", ") || "Unknown author" }}</p>
            <span v-if="book.averageRating" class="preview__rating">
              {{ Number(book.averageRating).toFixed(1) }} <span aria-hidden="true">★</span>
              <span class="visually-hidden">out of 5</span>
            </span>
          </div>
        </div>
        <BookSynopsis class="preview__synopsis" :text="book.description" />

        <p v-if="statuses" class="preview__eyebrow">Reading status</p>
        <div v-if="statuses" class="preview__statuses">
          <button
            v-for="option in STATUSES"
            :key="option.value"
            class="btn btn-outline-primary"
            :class="{ active: book.status === option.value }"
            type="button"
            :aria-pressed="book.status === option.value"
            @click="$emit('status', option.value)"
          >
            {{ option.short }}
          </button>
        </div>

        <!-- what the page opening it adds, e.g. My Shelf's progress and Remove from shelf -->
        <slot />

        <RouterLink v-if="linksToPage" class="btn btn-primary preview__open" :to="`/books/${book.id}`">
          Open full book page
        </RouterLink>
        <button class="btn btn-secondary preview__close" type="button" @click="$emit('close')">
          {{ closeLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from "vue";
import { STATUSES } from "../services/shelves.js";
import BookCover from "./BookCover.vue";
import BookSynopsis from "./book/BookSynopsis.vue";

const props = defineProps({
  // Book shape; `status` (want_to_read | reading | read) highlights the current shelf
  book: { type: Object, default: null },
  // the dialog's name; "Quick preview: <title>" when not given
  label: { type: String, default: "" },
  closeLabel: { type: String, default: "Close" },
  // a line above the title, e.g. which shelf the book is on
  tab: { type: String, default: "" },
  // the Reading status buttons; off for someone else's book
  statuses: { type: Boolean, default: true },
  // Open full book page; off for books that have no page (the demo readers')
  linksToPage: { type: Boolean, default: true }
});
defineEmits(["close", "status"]);

const dialog = ref(null);

watch(
  () => props.book?.id,
  async (id) => {
    if (!id) return;
    await nextTick();
    dialog.value?.focus();
  },
  { immediate: true }
);
</script>

<style scoped>
.rl-modal:focus {
  outline: none;
}

.preview {
  padding: 22px 16px 14px;
}

.preview__top {
  display: flex;
  gap: 14px;
}

.preview__cover {
  width: 110px;
  flex: none;
  border-radius: 10px;
}

.preview__meta {
  min-width: 0;
}

.preview__tab {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rl-accent);
}

.preview__title {
  margin: 2px 0 4px;
  font-size: 18px;
  line-height: 1.25;
}

.preview__author {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--rl-muted);
}

.preview__rating {
  display: inline-block;
  margin-bottom: 10px;
  padding: 4px 14px;
  border: 1px solid var(--rl-line);
  border-radius: 999px;
  background: var(--rl-secondary);
  font-size: 13px;
  font-weight: 700;
}

.preview__synopsis {
  margin-top: 14px;
  font-size: 13px;
  line-height: 1.45;
  color: var(--rl-muted);
}

.preview__eyebrow {
  margin: 20px 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--rl-accent);
}

.preview__statuses {
  display: flex;
  gap: 8px;
}

.preview__statuses .btn {
  flex: 1;
  padding-inline: 4px;
}

.preview__open {
  margin-top: 12px;
}

.preview__close {
  margin-top: 8px;
}
</style>
