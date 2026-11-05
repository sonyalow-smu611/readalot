<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// One saved quote in the salon: its text, author and book (linked to the book's page), and Remove.
defineProps({
  quote: { type: Object, required: true },
  busy: { type: Boolean, default: false },
})
defineEmits(['remove'])
</script>

<template>
  <li class="saved">
    <blockquote class="saved__text">“{{ quote.quoteText }}”</blockquote>
    <p class="saved__by">
      {{ quote.author || 'Unknown author' }}<template v-if="quote.work">,
        <cite>{{ quote.work }}</cite>
      </template>
      <template v-if="quote.sourceUrl"> · via Wikiquote</template>
    </p>
    <div class="saved__actions">
      <RouterLink v-if="quote.bookId" class="btn btn-secondary btn-sm" :to="`/books/${quote.bookId}`">Open book page</RouterLink>
      <a v-if="quote.sourceUrl" class="btn btn-secondary btn-sm" :href="quote.sourceUrl" target="_blank" rel="noopener">Read on Wikiquote</a>
      <button
        type="button"
        class="btn btn-danger btn-sm"
        :disabled="busy"
        :aria-label="`Remove quote from ${quote.work || 'this book'}`"
        @click="$emit('remove', quote.id)"
      >
        Remove Quote
      </button>
    </div>
  </li>
</template>

<style scoped>
.saved {
  padding: 12px 0;
  border-top: 2px dashed #ead2de;
}

.saved:first-child {
  border-top: 0;
  padding-top: 0;
}

.saved__text {
  margin: 0 0 6px;
  font-family: var(--rl-font-title);
  font-size: 0.95rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.saved__by {
  margin: 0 0 8px;
  color: var(--rl-muted, #7a6470);
  font-size: 0.8rem;
}

.saved__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
