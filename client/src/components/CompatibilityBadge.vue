<template>
  <span class="badge text-bg-success">{{ compatibility }}% Reading Match</span>
</template>

<script setup>
defineProps({
  compatibility: {
    type: Number,
    default: 0
  }
});
</script>
