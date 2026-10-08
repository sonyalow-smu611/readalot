<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// What an empty shelf shows: a dashed drop zone so it's obvious books can be added or
// dragged here, rather than a blank gap.
defineProps({
  message: { type: String, default: 'Nothing here yet — drag a book onto this shelf' },
})
</script>

<template>
  <div class="empty-shelf">
    <span class="empty-shelf__icon" aria-hidden="true">📖</span>
    <span class="empty-shelf__msg">{{ message }}</span>
  </div>
</template>

<style scoped>
.empty-shelf {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 172px;
  margin: 0 6px;
  padding: 16px;
  text-align: center;
  color: var(--ink-muted);
  background: transparent;
  border: 1px dashed rgba(28, 27, 25, 0.28);
  border-radius: 2px;
  font-family: var(--font-serif);
}

.empty-shelf__icon {
  font-size: 1.1rem;
  line-height: 1;
  opacity: 0.7;
}

.empty-shelf__msg {
  max-width: 220px;
  font-size: 0.8rem;
}
</style>
