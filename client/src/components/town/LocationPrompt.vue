<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Asked once, after the first tour: go public, or stay private. Public means both being listed in
// the Cafe and showing your last rough area, so the question spells out both.
import { onMounted, ref } from 'vue'

defineProps({
  busy: { type: Boolean, default: false },
  // why going public didn't work, e.g. the browser blocked location
  error: { type: String, default: '' },
})
const emit = defineEmits(['choose'])

const card = ref(null)

// keyboard and screen reader users land on the question
onMounted(() => card.value?.focus())
</script>

<template>
  <div class="location-prompt">
    <div
      ref="card"
      class="location-prompt__card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-prompt-title"
      aria-describedby="location-prompt-copy"
      tabindex="-1"
      @keydown.esc="emit('choose', false)"
    >
      <h2 id="location-prompt-title" class="location-prompt__title">Find readers near you?</h2>
      <p id="location-prompt-copy" class="location-prompt__copy">
        If you go public, readers can find you in the Cafe, and readers nearby can see you in their town from your last
        rough area, about 1 km, even when the app is closed. We never store your exact location or show where you are.
      </p>
      <p v-if="error" class="location-prompt__error" role="alert">{{ error }}</p>
      <div class="location-prompt__actions">
        <button type="button" class="btn btn-primary" :disabled="busy" @click="emit('choose', true)">Go public</button>
        <button type="button" class="btn btn-secondary" :disabled="busy" @click="emit('choose', false)">Stay private</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.location-prompt {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(63, 46, 36, 0.45);
}

.location-prompt__card {
  width: min(420px, 100%);
  padding: 18px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-modal, 22px);
  background: var(--rl-surface);
  box-shadow: 0 14px 36px rgba(63, 46, 36, 0.25);
  outline: none;
}

.location-prompt__title {
  margin: 0 0 8px;
  font-family: var(--rl-font-title);
  font-size: 22px;
  font-weight: 700;
  color: var(--rl-text);
}

.location-prompt__copy {
  margin: 0 0 14px;
  font-size: 15px;
  line-height: 1.45;
  color: var(--rl-muted);
}

.location-prompt__error {
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 700;
  color: var(--bs-danger, #b3261e);
}

.location-prompt__actions {
  display: flex;
  gap: 8px;
}

.location-prompt__actions .btn {
  flex: 1;
}
</style>
