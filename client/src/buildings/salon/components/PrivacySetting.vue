<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The switch that shows or hides the reader on the People map.
import ProfileBlock from '@/buildings/salon/components/ProfileBlock.vue'

defineProps({
  discoverable: { type: Boolean, required: true },
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
  // read out after the switch flips
  status: { type: String, default: '' },
})

const emit = defineEmits(['toggle'])
</script>

<template>
  <ProfileBlock title="Privacy">
    <div class="setting">
      <div>
        <p id="discoverable-label" class="setting__label">Show me on the People map</p>
        <p id="discoverable-note" class="setting__note">Nearby readers can find your room and see your reading match.</p>
      </div>
      <button
        type="button"
        role="switch"
        class="switch"
        data-tour="profile-map"
        :aria-checked="discoverable"
        aria-labelledby="discoverable-label"
        aria-describedby="discoverable-note"
        :disabled="busy"
        @click="emit('toggle')"
      >
        <span class="switch__thumb" />
      </button>
    </div>
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
    <p class="visually-hidden" role="status">{{ status }}</p>
  </ProfileBlock>
</template>

<style scoped>
.setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.setting__label {
  margin: 0;
}

.setting__note {
  margin: 2px 0 0;
  color: var(--rl-muted);
  font-size: 0.875rem;
}

.switch {
  position: relative;
  flex: none;
  width: 54px;
  height: 32px;
  padding: 0;
  border: 2px solid #1e1a24;
  border-radius: 999px;
  background: #ead2de;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  border: 2px solid #1e1a24;
  border-radius: 999px;
  background: #fffdf9;
  transition: transform 0.2s ease;
}

.switch[aria-checked='true'] {
  background: #a84874;
}

.switch[aria-checked='true'] .switch__thumb {
  transform: translateX(20px);
}

.switch:disabled {
  opacity: 0.6;
}

.field-error {
  margin: 6px 0 0;
  color: #8d2218;
  font-size: 0.875rem;
}

@media (prefers-reduced-motion: reduce) {
  .switch,
  .switch__thumb {
    transition: none;
  }
}
</style>
