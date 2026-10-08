<template>
  <div class="btn-group" role="group" aria-label="Reading status">
    <button
      v-for="option in options"
      :key="option.value"
      class="btn btn-sm"
      :class="modelValue === option.value ? 'btn-success' : 'btn-outline-success'"
      type="button"
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
defineEmits(["update:modelValue"]);
defineProps({
  modelValue: String
});

const options = [
  { value: "want_to_read", label: "Want" },
  { value: "reading", label: "Reading" },
  { value: "read", label: "Read" }
];
</script>
