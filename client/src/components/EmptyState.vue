<script setup>
// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import StickerCard from './StickerCard.vue'

defineProps({
  emoji: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  color: { type: String, default: 'cream' },
})
</script>

<template>
  <StickerCard :color="color" class="empty-state text-center">
    <span v-pop="0.25" v-wiggle class="empty-state__emoji" aria-hidden="true">{{ emoji }}</span>
    <h2 class="h5 mt-2 mb-1">{{ title }}</h2>
    <p class="text-ink-muted small mb-0">{{ message }}</p>
    <div v-if="$slots.default" class="mt-3">
      <slot />
    </div>
  </StickerCard>
</template>

<style scoped>
.empty-state {
  padding: 24px 20px;
  border-style: dashed;
}

.empty-state__emoji {
  display: inline-block;
  font-size: 3rem;
  line-height: 1;
}
</style>
