<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A small "are you sure?" card over the page: log out, or leave with unsaved changes.
// The safe choice comes first and takes focus; Escape picks it too. With saveLabel there is a
// third choice that keeps the changes before going (save).
import { onMounted, ref, useId } from 'vue'

defineProps({
  title: { type: String, required: true },
  text: { type: String, required: true },
  stayLabel: { type: String, required: true },
  goLabel: { type: String, required: true },
  saveLabel: { type: String, default: '' },
  // a little book shutting above the title (logging out)
  book: { type: Boolean, default: false },
})

const emit = defineEmits(['stay', 'go', 'save'])
const titleId = useId()
const stayButton = ref(null)

onMounted(() => stayButton.value?.focus())
</script>

<template>
  <Teleport to=".phone-frame">
    <div class="leave" role="dialog" aria-modal="true" :aria-labelledby="titleId" @keydown.esc="emit('stay')">
      <div class="leave__card">
        <div v-if="book" class="leave__book" aria-hidden="true">
          <span class="leave__cover" />
          <span class="leave__page" />
        </div>
        <h2 :id="titleId" class="h4 mb-1">{{ title }}</h2>
        <p class="text-muted mb-3">{{ text }}</p>
        <button v-if="saveLabel" type="button" class="btn btn-primary w-100 mb-2" @click="emit('save')">
          {{ saveLabel }}
        </button>
        <div class="d-flex gap-2">
          <button ref="stayButton" type="button" class="btn btn-outline-primary flex-grow-1" @click="emit('stay')">
            {{ stayLabel }}
          </button>
          <button type="button" class="btn btn-danger flex-grow-1" @click="emit('go')">{{ goLabel }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.leave {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(44, 36, 30, 0.46);
}

.leave__card {
  width: min(100%, 300px);
  padding: 22px 18px 18px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-modal);
  background: var(--rl-surface);
  box-shadow: 0 14px 36px rgba(63, 46, 36, 0.25);
  text-align: center;
  animation: leave-in 0.35s ease;
}

.leave__book {
  position: relative;
  width: 74px;
  height: 52px;
  margin: 0 auto 14px;
}

.leave__cover,
.leave__page {
  position: absolute;
  top: 0;
  height: 52px;
  border-radius: 3px 8px 8px 3px;
}

.leave__cover {
  left: 8px;
  width: 34px;
  background: #6b4a34;
  transform-origin: right center;
  animation: cover-shut 0.7s ease;
}

.leave__page {
  left: 34px;
  width: 30px;
  border: 1px solid var(--rl-line);
  background: #fffdf9;
}

@keyframes leave-in {
  from { transform: translateY(16px) scale(0.96); opacity: 0; }
}

@keyframes cover-shut {
  from { transform: scaleX(0.2); }
}

@media (prefers-reduced-motion: reduce) {
  .leave__card,
  .leave__cover {
    animation: none;
  }
}
</style>
