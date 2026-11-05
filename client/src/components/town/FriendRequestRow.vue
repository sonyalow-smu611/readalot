<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// One friend request in the friends list: who asked, and Accept or Decline, each with a spinner
// while it's saved and a tick once it is.
import LoadButton from '@/components/shared/LoadButton.vue'


defineProps({
  // { requestId, reader: { displayName } }
  request: { type: Object, required: true },
  // each button's { busy, failed } (see LoadButton)
  accepting: { type: Object, default: () => ({ busy: false, failed: false }) },
  declining: { type: Object, default: () => ({ busy: false, failed: false }) },
})
const emit = defineEmits(['answer'])
</script>

<template>
  <div class="friend-request">
    <p class="friend-request__name">{{ request.reader.displayName }} wants to be friends</p>
    <div class="friend-request__actions">
      <LoadButton
        class="btn btn-primary btn-sm"
        :aria-label="`Accept ${request.reader.displayName}`"
        :busy="accepting.busy"
        :failed="accepting.failed"
        :disabled="declining.busy"
        busy-text="Accepting…"
        done-text="Friends"
        @click="emit('answer', request.requestId, true)"
      >
        Accept
      </LoadButton>
      <LoadButton
        class="btn btn-secondary btn-sm"
        :aria-label="`Decline ${request.reader.displayName}`"
        :busy="declining.busy"
        :failed="declining.failed"
        :disabled="accepting.busy"
        busy-text="Declining…"
        done-text="Declined"
        @click="emit('answer', request.requestId, false)"
      >
        Decline
      </LoadButton>
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
  gap: var(--rl-btn-gap);
}

.friend-request__actions .btn {
  flex: 1;
}
</style>
