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
        <RouterLink v-if="quote.bookId" :to="`/books/${quote.bookId}`"><cite>{{ quote.work }}</cite></RouterLink>
        <cite v-else>{{ quote.work }}</cite>
      </template>
      <template v-if="quote.sourceUrl">
        · <a :href="quote.sourceUrl" target="_blank" rel="noopener">via Wikiquote</a>
      </template>
    </p>
    <button
      type="button"
      class="btn btn-secondary btn-sm"
      :disabled="busy"
      :aria-label="`Remove quote from ${quote.work || 'this book'}`"
      @click="$emit('remove', quote.id)"
    >
      Remove
    </button>
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

.saved__by a {
  color: #a84874;
}
</style>
