<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A framed wrapper that stacks several <Shelf>es into one piece of furniture, giving the
// screen a single "bookcase" with a paper back. Shelves go in the default slot.
defineProps({
  title: { type: String, default: '' },
})
</script>

<template>
  <section class="bookcase">
    <h2 v-if="title" class="bookcase__title">{{ title }}</h2>
    <div class="bookcase__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.bookcase {
  margin-bottom: 24px;
}

.bookcase__title {
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: 1.35rem;
  letter-spacing: 0.01em;
  color: var(--ink);
  margin-bottom: 10px;
}

.bookcase__body {
  padding: 16px 10px 8px;
  background: var(--paper);
  border: 1px solid rgba(28, 27, 25, 0.22);
  border-radius: 2px;
}

/* Last shelf shouldn't add trailing gap inside the frame. */
.bookcase__body :deep(.shelf:last-child) {
  margin-bottom: 0;
}
</style>
