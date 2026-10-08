<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A small hand-placed sticker: emoji, optional caption, chunky outline and a slight tilt.
defineProps({
  emoji: { type: String, required: true },
  label: { type: String, default: '' },
  color: {
    type: String,
    default: 'butter',
    validator: (value) => ['paper', 'cream', 'lilac', 'tangerine', 'mint', 'butter', 'hot-pink'].includes(value),
  },
  tilt: { type: Number, default: -8 },
})
</script>

<template>
  <span
    class="sticker"
    :style="{ '--sticker-bg': `var(--${color})`, '--sticker-tilt': `${tilt}deg` }"
  >
    <span class="sticker__emoji" aria-hidden="true">{{ emoji }}</span>
    <span v-if="label" class="sticker__label">{{ label }}</span>
  </span>
</template>

<style scoped>
.sticker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--sticker-bg);
  border: var(--outline);
  border-radius: 999px;
  box-shadow: var(--shadow-sticker-sm);
  transform: rotate(var(--sticker-tilt));
}

.sticker__emoji {
  font-size: 1.15rem;
  line-height: 1;
}

.sticker__label {
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 0.85rem;
}
</style>
