<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The salon's style studio: start from a ready-made look or roll a surprise one, then change any
// part. A save bar slides up once the look differs from the saved one. The page saves.
import CharacterPresetPicker from '@/components/shared/CharacterPresetPicker.vue'
import CharacterCustomiser from '@/buildings/salon/components/CharacterCustomiser.vue'
import { presetCharacter, randomCharacter } from '@/lib/avatar/catalogue.js'

const props = defineProps({
  // the look being tried on
  modelValue: { type: Object, required: true },
  // true when it differs from the saved look
  changed: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  // a save that failed
  error: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'save', 'reset'])

function surprise() {
  emit('update:modelValue', randomCharacter(props.modelValue.base))
}
</script>

<template>
  <div class="studio" data-tour="salon-studio">
    <section class="widget" aria-labelledby="looks-title">
      <div class="widget__head">
        <div>
          <h2 id="looks-title" class="widget__title">Looks</h2>
          <p class="widget__note">Start from one of the five, or let the stylist surprise you.</p>
        </div>
        <button type="button" class="btn btn-accent surprise" @click="surprise">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
            <circle cx="8" cy="8" r="1.4" /><circle cx="16" cy="8" r="1.4" /><circle cx="12" cy="12" r="1.4" />
            <circle cx="8" cy="16" r="1.4" /><circle cx="16" cy="16" r="1.4" />
          </svg>
          Surprise me
        </button>
      </div>
      <CharacterPresetPicker
        :model-value="modelValue.base"
        legend="Start from preset"
        class="studio__presets"
        @update:model-value="emit('update:modelValue', presetCharacter($event))"
      />
    </section>

    <section class="widget" aria-labelledby="style-title">
      <h2 id="style-title" class="widget__title">Style</h2>
      <p class="widget__note">Every part is free to try on. Locked ones open up with coins soon.</p>
      <CharacterCustomiser :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" />
    </section>

    <Transition name="bar">
      <div v-if="changed || error" class="savebar">
        <p v-if="error" class="savebar__error" role="alert">{{ error }}</p>
        <p v-else class="savebar__text">New look ready</p>
        <div class="savebar__actions">
          <button type="button" class="btn btn-outline-primary" @click="emit('reset')">Reset</button>
          <button type="button" class="btn btn-primary savebar__save" :disabled="busy" @click="emit('save')">
            {{ busy ? 'Saving…' : 'Save look' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.surprise {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
}

.studio {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.widget {
  padding: 16px;
  border: 3px solid var(--px-ink, #2b1d24);
  border-radius: 4px;
  background: var(--px-paper, #fff8ef);
  box-shadow: inset 0 -4px 0 rgba(43, 29, 36, 0.08), var(--px-shadow, 5px 5px 0 #2b1d24);
}

.widget__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.widget__title {
  margin: 0;
  font-size: 1.25rem;
}

.widget__note {
  margin: 2px 0 0;
  color: var(--rl-muted);
  font-size: 0.8125rem;
}

.studio__presets {
  margin-top: 12px;
}

/* the presets' own heading would repeat this card's */
.studio__presets :deep(.preset-picker__legend) {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.surprise svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
}

.surprise svg circle {
  fill: currentColor;
  stroke: none;
}

.savebar {
  position: sticky;
  bottom: 0;
  z-index: 3;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border: 2px solid #1e1a24;
  border-radius: 18px;
  background: #2c241e;
  color: #fffdf9;
  box-shadow: 5px 5px 0 rgba(30, 26, 36, 0.3);
}

.savebar__text {
  margin: 0;
  font-weight: 700;
}

.savebar__text::before {
  content: '✦ ';
  color: #f6e27a;
}

.savebar__error {
  margin: 0;
  color: #ffb4a8;
  font-size: 0.875rem;
}

.savebar__actions {
  display: flex;
  gap: 8px;
}

.savebar .btn {
  min-height: 44px;
  border-radius: 999px;
}

.savebar .btn-outline-primary {
  border-color: #fffdf9;
  color: #fffdf9;
}

.savebar .btn-outline-primary:hover {
  background: rgba(255, 253, 249, 0.12);
}

/* saving is the go-ahead: green */
.savebar__save {
  border-color: #2b7a43;
  background: #3fae5a;
  color: #fff;
  font-weight: 700;
}

.savebar__save:hover:not(:disabled) {
  border-color: #2b7a43;
  background: #4cc06a;
  color: #fff;
}

.bar-enter-active,
.bar-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.bar-enter-from,
.bar-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .surprise,
  .bar-enter-active,
  .bar-leave-active {
    transition: none;
  }
}
</style>
