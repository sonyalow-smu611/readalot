<!--
  Scaffolded with AI assistance — see AI_USAGE.md
  A short note to pin on someone's notice board: a text box with a live count, Post note and
  Cancel. Emits `post` with the text (Post note stays off while it's empty or only spaces) and
  `cancel`; Esc and a tap outside cancel too. `error` is shown when a note couldn't be saved.
-->
<template>
  <div
    ref="dialog"
    class="modal d-block rl-modal"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    :aria-label="`Leave a note for ${owner}`"
    @click.self="$emit('cancel')"
    @keydown.esc="$emit('cancel')"
  >
    <div class="modal-dialog modal-dialog-centered">
      <form class="modal-content p-4" @submit.prevent="post">
        <p class="note-card__eyebrow">Leave a note for {{ owner }}</p>
        <label class="visually-hidden" for="note-text">Your note</label>
        <textarea
          id="note-text"
          ref="field"
          v-model="text"
          class="note-card__text"
          rows="4"
          :maxlength="NOTE_MAX"
          placeholder="Say hello, recommend a book…"
        />
        <p class="note-card__count" aria-live="polite">{{ text.length }}/{{ NOTE_MAX }}</p>
        <p v-if="error" class="note-card__error" role="alert">{{ error }}</p>
        <div class="note-card__actions">
          <button class="btn btn-primary" type="submit" :disabled="busy || !text.trim()">{{ busy ? 'Posting…' : 'Post note' }}</button>
          <button class="btn btn-outline-secondary" type="button" @click="$emit('cancel')">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { NOTE_MAX } from '@/buildings/house/notes.js'

const props = defineProps({
  // the first name of the reader the note is for
  owner: { type: String, required: true },
  error: { type: String, default: '' },
  // the note is on its way to the board
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['post', 'cancel'])

const field = ref(null)
const text = ref('')

function post() {
  if (props.busy || !text.value.trim()) return
  emit('post', text.value)
}

onMounted(() => field.value?.focus())
</script>

<style scoped>
.note-card__eyebrow {
  margin-bottom: 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--house-accent, var(--rl-accent));
}

.note-card__text {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--rl-line);
  border-radius: 12px;
  background: #fffaf0;
  font-size: 15px;
  color: var(--rl-text);
  resize: none;
}

.note-card__count {
  margin: 4px 0 0;
  font-size: 12px;
  text-align: right;
  color: var(--rl-muted);
}

.note-card__error {
  margin: 8px 0 0;
  font-size: 13px;
  color: #b42318;
}

.note-card__actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}
</style>
