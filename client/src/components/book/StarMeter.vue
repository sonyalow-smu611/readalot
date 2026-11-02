<!-- Five stars filled to a fraction (3.6 fills three and most of the fourth). Only a picture:
     whatever shows it says the rating in words. Written with AI assistance: see AI_USAGE.md. -->
<template>
  <span class="stars" :class="{ 'stars--big': big }" aria-hidden="true">
    <span class="stars__back">★★★★★</span>
    <span class="stars__fill" :style="{ width: `${(Math.min(5, value) / 5) * 100}%` }">★★★★★</span>
  </span>
</template>

<script setup>
defineProps({
  value: { type: Number, default: 0 },
  big: { type: Boolean, default: false },
})
</script>

<style scoped>
.stars {
  position: relative;
  display: inline-block;
  font-size: 16px;
  line-height: 1;
  letter-spacing: 2px;
  white-space: nowrap;
}

.stars--big {
  font-size: 36px;
  letter-spacing: 6px;
}

.stars__back {
  color: var(--rl-placeholder);
}

.stars__fill {
  position: absolute;
  inset: 0 auto 0 0;
  overflow: hidden;
  color: #e0b65e;
}
</style>
