<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The reader chat over their profile, in a pixel frame. The parent owns `open` and gets `close`
// from Escape, the Close button or a tap outside; it gives focus back to whatever opened it.
import { nextTick, onMounted, ref, watch } from 'vue'
import ReaderChat from './ReaderChat.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  readerId: { type: String, required: true },
  readerName: { type: String, required: true },
})

const emit = defineEmits(['close'])

const dialog = ref(null)

async function sync(open) {
  const el = dialog.value
  if (!el) return
  if (open && !el.open) {
    el.showModal()
    await nextTick()
    el.focus()
  } else if (!open && el.open) {
    el.close()
  }
}

watch(() => props.open, sync)
onMounted(() => sync(props.open))

// Escape: the parent closes it
function cancel(event) {
  event.preventDefault()
  emit('close')
}

// a tap on the dim backdrop lands on the dialog itself, outside its frame
function tapOutside(event) {
  if (event.target === dialog.value) emit('close')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="chat-dialog"
    tabindex="-1"
    aria-labelledby="chat-dialog-title"
    @cancel="cancel"
    @click="tapOutside"
  >
    <div class="chat-dialog__frame">
      <div class="chat-dialog__head">
        <h2 id="chat-dialog-title" class="chat-dialog__title">Message {{ readerName.split(' ')[0] }}</h2>
        <button type="button" class="btn btn-secondary btn-icon" aria-label="Close" @click="emit('close')">✕</button>
      </div>
      <ReaderChat v-if="open" :reader-id="readerId" :reader-name="readerName" />
    </div>
  </dialog>
</template>

<style scoped>
.chat-dialog {
  width: min(420px, calc(100vw - 32px));
  max-height: calc(100dvh - 48px);
  padding: 0;
  border: var(--px-border);
  background: var(--profile-paper, var(--px-paper));
  box-shadow: var(--px-shadow);
  color: var(--px-outline);
}

.chat-dialog:focus {
  outline: none;
}

.chat-dialog::backdrop {
  background: rgba(30, 26, 36, 0.5);
}

/* the teal inner line, as on the profile's cards */
.chat-dialog__frame {
  margin: 4px;
  padding: 12px;
  border: 2px solid var(--profile-teal, var(--px-outline));
}

.chat-dialog__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.chat-dialog__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 18px;
}
</style>
