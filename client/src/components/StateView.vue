<template>
  <div v-if="loading" class="text-center text-muted py-4">Loading...</div>
  <div v-else-if="error" class="text-center py-4">
    <p class="text-danger">{{ error }}</p>
    <button class="btn btn-sm btn-outline-secondary" type="button" @click="$emit('retry')">Retry</button>
  </div>
  <div v-else-if="empty" class="text-center text-muted py-4">
    <slot name="empty">Nothing here yet.</slot>
  </div>
  <slot v-else />
</template>

<script setup>
defineProps({
  loading: Boolean,
  error: { type: String, default: "" },
  empty: Boolean
});
defineEmits(["retry"]);
</script>
