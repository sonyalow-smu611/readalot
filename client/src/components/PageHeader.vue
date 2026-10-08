<script setup>
// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  emoji: { type: String, required: true },
  color: { type: String, default: 'butter' },
})
</script>

<template>
  <header class="page-header d-flex align-items-center gap-3 mb-4">
    <span
      v-wiggle
      class="page-header__sticker"
      :style="{ background: `var(--${color})` }"
      aria-hidden="true"
    >{{ emoji }}</span>
    <div>
      <p v-if="eyebrow" class="page-header__eyebrow mb-1">{{ eyebrow }}</p>
      <h1 class="page-header__title mb-1">{{ title }}</h1>
      <p v-if="subtitle" class="text-ink-muted small mb-0">{{ subtitle }}</p>
    </div>
  </header>
</template>

<style scoped>
.page-header__sticker {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  font-size: 1.9rem;
  border: var(--outline);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sticker);
  transform: rotate(-6deg);
}

.page-header__eyebrow {
  font-family: var(--font-heading);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
}

.page-header__title {
  font-size: 1.85rem;
  line-height: 1.1;
}
</style>
