<script setup>
// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
defineProps({
  width: { type: String, default: '100%' },
  height: { type: String, default: '14px' },
  radius: { type: String, default: '10px' },
})
</script>

<template>
  <span
    class="skeleton-block"
    :style="{ width, height, borderRadius: radius }"
    aria-hidden="true"
  />
</template>

<style scoped>
.skeleton-block {
  display: block;
  flex-shrink: 0;
  background: linear-gradient(
    90deg,
    rgba(27, 27, 47, 0.08) 25%,
    rgba(255, 255, 255, 0.75) 50%,
    rgba(27, 27, 47, 0.08) 75%
  );
  background-size: 200% 100%;
  border: 2px dashed rgba(27, 27, 47, 0.2);
  animation: shimmer 1.4s linear infinite;
}

@keyframes shimmer {
  from { background-position: 100% 0; }
  to { background-position: -100% 0; }
}
</style>
