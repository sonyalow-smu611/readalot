<!-- Asks before a book comes off the shelf. Emits `remove` with { remember } when confirmed. -->
<template>
  <div
    ref="dialog"
    class="modal d-block rl-modal"
    tabindex="-1"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="remove-book-title"
    @click.self="$emit('close')"
    @keydown.esc="$emit('close')"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content p-4 text-center">
        <h2 id="remove-book-title" class="remove__title">Remove “{{ book.title }}” from your shelf?</h2>
        <p class="remove__note">You can add it again any time.</p>
        <div class="d-grid gap-2">
          <button class="btn btn-primary" type="button" @click="$emit('remove', { remember: false })">
            Yes, remove
          </button>
          <button class="btn btn-outline-primary" type="button" @click="$emit('remove', { remember: true })">
            Yes, and don't ask again
          </button>
          <button class="btn btn-link remove__keep" type="button" @click="$emit('close')">No, keep it</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";

defineProps({
  book: { type: Object, required: true }
});
defineEmits(["close", "remove"]);

const dialog = ref(null);

onMounted(() => dialog.value.focus());
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

.remove__keep {
  font-weight: 700;
  color: var(--rl-muted);
  text-decoration: none;
}
</style>
