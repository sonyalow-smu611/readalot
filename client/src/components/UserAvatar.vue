<template>
  <img
    v-if="avatarUrl"
    class="rounded-circle"
    :src="avatarUrl"
    :alt="displayName"
    width="40"
    height="40"
  >
  <div v-else class="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center" style="width: 40px; height: 40px">
    {{ initial }}
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  avatarUrl: String,
  displayName: {
    type: String,
    default: "Reader"
  }
});

const initial = computed(() => props.displayName.slice(0, 1).toUpperCase());
</script>
