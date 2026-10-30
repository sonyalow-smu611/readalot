<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// One friend request in the friends list: who asked, and Accept or Decline.
defineProps({
  // { requestId, reader: { displayName } }
  request: { type: Object, required: true },
})
const emit = defineEmits(['answer'])
</script>

<template>
  <div class="friend-request">
    <p class="friend-request__name">{{ request.reader.displayName }} wants to be friends</p>
    <div class="friend-request__actions">
      <button
        type="button"
        class="btn btn-primary btn-sm"
        :aria-label="`Accept ${request.reader.displayName}`"
        @click="emit('answer', request.requestId, true)"
      >
        Accept
      </button>
      <button
        type="button"
        class="btn btn-secondary btn-sm"
        :aria-label="`Decline ${request.reader.displayName}`"
        @click="emit('answer', request.requestId, false)"
      >
        Decline
      </button>
    </div>
  </div>
</template>

<style scoped>
.friend-request {
  padding: 8px 12px;
}

.friend-request__name {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--rl-text);
}

.friend-request__actions {
  display: flex;
  gap: 8px;
}

.friend-request__actions .btn {
  flex: 1;
}
</style>
