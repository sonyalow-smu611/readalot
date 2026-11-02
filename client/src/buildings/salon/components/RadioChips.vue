<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// A single-choice group drawn as chips: one tab stop, arrow keys move and select.
import { nextTick, ref } from 'vue'

const props = defineProps({
  // [{ value, text, label? }]; label is what screen readers hear when text is an emoji
  options: { type: Array, required: true },
  modelValue: { type: String, default: '' },
  // id of the element that names the group
  labelledby: { type: String, required: true },
  invalid: { type: Boolean, default: false },
  describedby: { type: String, default: undefined },
  // 'chip' for words, 'avatar' for round emoji buttons
  variant: { type: String, default: 'chip' },
})

const emit = defineEmits(['update:modelValue'])
const group = ref(null)

function tabStop(value) {
  if (props.modelValue) return value === props.modelValue ? 0 : -1
  return value === props.options[0].value ? 0 : -1
}

function move(event) {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
  if (!step) return
  event.preventDefault()
  const values = props.options.map((option) => option.value)
  const index = values.indexOf(props.modelValue)
  const start = index < 0 ? (step > 0 ? -1 : 0) : index
  emit('update:modelValue', values[(start + step + values.length) % values.length])
  nextTick(() => group.value?.querySelector('[aria-checked="true"]')?.focus())
}
</script>

<template>
  <div
    ref="group"
    class="chips"
    role="radiogroup"
    :aria-labelledby="labelledby"
    :aria-invalid="invalid"
    :aria-describedby="describedby"
    @keydown="move"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :class="['btn', 'btn-chip', variant, { 'is-on': modelValue === option.value }]"
      :aria-checked="modelValue === option.value"
      :aria-label="option.label"
      :tabindex="tabStop(option.value)"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.text }}
    </button>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Chips (pixel-buttons.css): the chosen one fills in */
.chip {
  font-size: 0.875rem;
}

/* an avatar choice: a square Chip holding its emoji */
.avatar {
  --bs-btn-padding-x: 0;
  width: 48px;
  height: 48px;
  font-size: 1.5rem;
  line-height: 1;
}
</style>
