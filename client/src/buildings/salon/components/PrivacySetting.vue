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
        class="btn btn-chip btn-sm switch"
        data-tour="profile-map"
        :aria-checked="discoverable"
        aria-labelledby="discoverable-label"
        aria-describedby="discoverable-note"
        :disabled="busy"
        @click="emit('toggle')"
      >
        {{ discoverable ? 'On' : 'Off' }}
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
  flex: none;
  min-width: 64px;
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
