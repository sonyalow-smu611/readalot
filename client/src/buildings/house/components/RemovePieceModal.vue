<!--
  Scaffolded with AI assistance — see AI_USAGE.md
  Asks before a placed piece comes out of the room (after its × is tapped). Emits `remove` when
  confirmed and `close` when the reader keeps it (No, Escape or a tap on the dimmed backdrop).
-->
<template>
  <div
    ref="dialog"
    class="modal d-block rl-modal"
    tabindex="-1"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="remove-piece-title"
    @click.self="$emit('close')"
    @keydown.esc.stop="$emit('close')"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content p-4 text-center">
        <h2 id="remove-piece-title" class="remove__title">Remove “{{ name }}” from your room?</h2>
        <p class="remove__note">It goes back to your inventory.</p>
        <div class="d-grid gap-2">
          <button class="btn btn-danger" type="button" @click="$emit('remove')">Yes, remove</button>
          <button class="btn btn-secondary" type="button" @click="$emit('close')">No, keep it</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

defineProps({
  // the piece's name, as the furniture library gives it ("Reading chair")
  name: { type: String, required: true },
})
defineEmits(['close', 'remove'])

const dialog = ref(null)

onMounted(() => dialog.value?.focus())
</script>

<style scoped>
.rl-modal:focus {
  outline: none;
}

.remove__title {
  margin: 0 0 6px;
  font-family: var(--rl-font-title);
  font-size: 19px;
  line-height: 1.35;
}

.remove__note {
  margin: 0 0 18px;
  font-size: 13px;
  color: var(--rl-muted);
}
</style>
