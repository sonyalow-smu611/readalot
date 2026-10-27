<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Saved quotes. None can be saved yet, so this says how it will work.
import ProfileBlock from '@/buildings/salon/components/ProfileBlock.vue'
</script>

<template>
  <ProfileBlock title="Saved quotes">
    <div class="empty">
      <span class="empty__mark" aria-hidden="true">“</span>
      <p class="mb-1">No saved quotes yet</p>
      <p class="block__empty mb-2">Tap the heart on a quote in a book's Quotes tab to keep it here.</p>
      <RouterLink class="empty__link" to="/discover">Find a book</RouterLink>
    </div>
  </ProfileBlock>
</template>

<style scoped>
.empty {
  padding: 18px 16px;
  border: 2px dashed #ead2de;
  border-radius: 14px;
  background: #fff7fb;
  text-align: center;
}

.empty__mark {
  display: block;
  height: 28px;
  color: #e98aa8;
  font-family: var(--rl-font-title);
  font-size: 3rem;
  line-height: 1;
}

.empty__link {
  color: #a84874;
  font-size: 0.875rem;
  font-weight: 700;
}
</style>
