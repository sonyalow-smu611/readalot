<!-- Quick Book Preview (reference screen 07). Opens whenever `book` is set. -->
<template>
  <div
    v-if="book"
    ref="dialog"
    class="modal d-block rl-modal"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    :aria-label="`Quick preview: ${book.title}`"
    @click.self="$emit('close')"
    @keydown.esc="$emit('close')"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content preview">
        <div class="preview__top">
          <BookCover class="preview__cover" :cover-url="book.coverUrl" :title="book.title" :seed="book.id" />
          <div class="preview__meta">
            <h2 class="preview__title">{{ book.title }}</h2>
            <p class="preview__author">{{ book.authors?.join(", ") || "Unknown author" }}</p>
            <span v-if="book.averageRating" class="preview__rating">
              {{ Number(book.averageRating).toFixed(1) }} <span aria-hidden="true">★</span>
              <span class="visually-hidden">out of 5</span>
            </span>
            <p class="preview__synopsis">{{ book.description || "No synopsis available yet." }}</p>
          </div>
        </div>

        <p class="preview__eyebrow">Reading status</p>
        <div class="preview__statuses">
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

        <RouterLink class="btn btn-primary preview__open" :to="`/books/${book.id}`">
          Open full book page
        </RouterLink>
        <button class="preview__close" type="button" @click="$emit('close')">
          Close <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from "vue";
import { STATUSES } from "../services/shelves.js";
import BookCover from "./BookCover.vue";

const props = defineProps({
  // Book shape; `status` (want_to_read | reading | read) highlights the current shelf
  book: { type: Object, default: null }
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
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.45;
  color: var(--rl-muted);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  line-clamp: 4;
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
  min-height: 42px;
  padding-inline: 4px;
  font-size: 13px;
  font-weight: 700;
}

.preview__open {
  min-height: 42px;
  margin-top: 12px;
  padding-block: 9px;
  font-size: 14px;
  font-weight: 700;
}

.preview__close {
  align-self: center;
  margin-top: 8px;
  padding: 8px 16px;
  border: 0;
  background: none;
  font-size: 13px;
  font-weight: 700;
  color: var(--rl-muted);
}
</style>
