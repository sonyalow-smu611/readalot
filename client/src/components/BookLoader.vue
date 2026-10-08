<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// On-brand loading state: a row of shimmering spine placeholders instead of a spinner, so a
// loading shelf still reads as a shelf. Heights are varied for a natural look.
defineProps({
  count: { type: Number, default: 6 },
})

// A fixed set of heights (px) cycled through so placeholders look like real, uneven spines.
const HEIGHTS = [168, 150, 196, 160, 182, 154, 204, 172]
</script>

<template>
  <div class="book-loader" role="status" aria-label="Loading books">
    <span
      v-for="n in count"
      :key="n"
      class="book-loader__spine"
      :style="{ height: `${HEIGHTS[n % HEIGHTS.length]}px` }"
    />
  </div>
</template>

<style scoped>
.book-loader {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 0 6px;
  min-height: 150px;
}

.book-loader__spine {
  width: 34px;
  background: var(--paper);
  border: var(--outline);
  border-radius: 4px 6px 6px 4px;
  box-shadow: var(--shadow-sticker-sm);
  background-image: linear-gradient(
    110deg,
    transparent 30%,
    rgba(27, 27, 47, 0.08) 50%,
    transparent 70%
  );
  background-size: 220% 100%;
  animation: book-loader-shimmer 1.3s ease-in-out infinite;
}

@keyframes book-loader-shimmer {
  from {
    background-position: 180% 0;
  }
  to {
    background-position: -40% 0;
  }
}
</style>
