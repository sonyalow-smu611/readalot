<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The five ready-made characters as a radio group. Used by Welcome and by the salon's
// "Start from preset" row. It only reports the choice; the page that uses it saves it.
import { useId } from 'vue'
import CharacterFigure from '@/components/shared/CharacterFigure.vue'
import { PRESETS, presetCharacter } from '@/lib/avatar/catalogue.js'

defineProps({
  // the chosen preset's id, e.g. 'rosie'
  modelValue: { type: String, required: true },
  legend: { type: String, default: 'Pick your character' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const name = useId()
const presets = PRESETS.map((preset) => ({ ...preset, character: presetCharacter(preset.id) }))
</script>

<template>
  <fieldset class="preset-picker" :disabled="disabled">
    <legend class="preset-picker__legend">{{ legend }}</legend>
    <div class="preset-picker__options">
      <label v-for="preset in presets" :key="preset.id" class="preset-picker__option">
        <input
          class="preset-picker__input"
          type="radio"
          :name="name"
          :value="preset.id"
          :checked="modelValue === preset.id"
          @change="emit('update:modelValue', preset.id)"
        />
        <span class="preset-picker__card">
          <span class="preset-picker__figure">
            <CharacterFigure :character="preset.character" decorative />
          </span>
          <span class="preset-picker__name">{{ preset.label }}</span>
        </span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.preset-picker {
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}

.preset-picker__legend {
  margin-bottom: 10px;
  font-family: var(--rl-font-title);
  font-size: 18px;
  font-weight: 700;
  color: var(--rl-text);
}

.preset-picker__options {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.preset-picker__option {
  position: relative;
  min-width: 0;
}

/* the real radio, invisible, covering its card so taps land on it */
.preset-picker__input {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.preset-picker__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 4px 8px;
  border: 2px solid var(--rl-line);
  border-radius: var(--rl-radius-card);
  background: var(--rl-surface);
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.preset-picker__figure {
  display: block;
  width: 100%;
  height: 92px;
}

.preset-picker__name {
  font-size: 13px;
  font-weight: 700;
  color: var(--rl-text);
}

.preset-picker__option:hover .preset-picker__card {
  border-color: var(--rl-accent);
}

input:checked + .preset-picker__card {
  border-color: var(--rl-primary);
  background: var(--rl-secondary);
  transform: translateY(-2px);
}

input:focus-visible + .preset-picker__card {
  outline: 3px solid var(--rl-accent);
  outline-offset: 2px;
}

fieldset:disabled .preset-picker__option {
  opacity: 0.6;
}

fieldset:disabled .preset-picker__input {
  cursor: default;
}

@media (prefers-reduced-motion: reduce) {
  .preset-picker__card {
    transition: none;
  }

  input:checked + .preset-picker__card {
    transform: none;
  }
}
</style>
