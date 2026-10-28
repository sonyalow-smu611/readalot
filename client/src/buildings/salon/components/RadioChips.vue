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
      :class="[variant, { 'is-on': modelValue === option.value }]"
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

.chip {
  min-height: 44px;
  padding: 6px 14px;
  border: 2px solid #ead2de;
  border-radius: 999px;
  background: var(--rl-canvas);
  color: var(--rl-text);
  font-size: 0.875rem;
}

.avatar {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 2px solid #ead2de;
  border-radius: 999px;
  background: #fff7fb;
  font-size: 1.5rem;
  line-height: 1;
}

.chip.is-on {
  background: #a84874;
  border-color: #1e1a24;
  color: #fffdf9;
}

.avatar.is-on {
  border: 2px solid #1e1a24;
  background: #fbe7f0;
}
</style>
