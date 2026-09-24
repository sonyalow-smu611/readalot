<template>
  <div v-if="book" class="modal fade show d-block" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title h5">{{ book.title }}</h2>
          <button class="btn-close" type="button" aria-label="Close" @click="$emit('close')" />
        </div>
        <div class="modal-body d-flex gap-3">
          <BookCover :cover-url="book.coverUrl" :title="book.title" />
          <p class="small mb-0">{{ book.description }}</p>
        </div>
        <div class="modal-footer">
          <RouterLink class="btn btn-success" :to="`/books/${book.id}`">Details</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import BookCover from "./BookCover.vue";

defineEmits(["close"]);
defineProps({
  book: Object
});
</script>
