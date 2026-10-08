<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A sheet that slides up from the bottom of the phone frame. The parent owns `open`.
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
})

const emit = defineEmits(['update:open'])

function close() {
  emit('update:open', false)
}
</script>

<template>
  <div v-if="open" class="sheet-root">
    <button type="button" class="sheet-backdrop" aria-label="Close sheet" @click="close" />
    <div class="sheet" role="dialog" :aria-label="title || 'Sheet'">
      <div class="sheet__handle" aria-hidden="true" />
      <div class="sheet__head">
        <h2 v-if="title" class="sheet__title">{{ title }}</h2>
        <button type="button" class="sheet__close" aria-label="Close" @click="close">✕</button>
      </div>
      <div class="sheet__body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sheet-root {
  position: absolute;
  inset: 0;
  z-index: 40;
}

.sheet-backdrop {
  position: absolute;
  inset: 0;
  padding: 0;
  background: rgba(27, 27, 47, 0.4);
  border: none;
  cursor: pointer;
}

.sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 70%;
  display: flex;
  flex-direction: column;
  padding: 10px 16px 24px;
  background: var(--paper);
  border: var(--outline);
  border-bottom: none;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: var(--shadow-sticker);
  animation: sheet-up 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}

.sheet__handle {
  width: 48px;
  height: 6px;
  margin: 4px auto 10px;
  background: var(--ink);
  border-radius: 999px;
  opacity: 0.25;
}

.sheet__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.sheet__title {
  flex: 1;
  margin: 0;
  font-size: 1.15rem;
}

.sheet__close {
  width: 36px;
  height: 36px;
  background: var(--butter);
  border: var(--outline);
  border-radius: 999px;
  cursor: pointer;
}

.sheet__body {
  overflow-y: auto;
}

@keyframes sheet-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
