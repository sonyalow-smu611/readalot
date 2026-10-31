<!--
  Scaffolded with AI assistance — see AI_USAGE.md
  Someone's notice board, opened from the corkboard in their room: the Quote of the Day at the
  top, then the notes left there, newest first, each signed and dated. A visitor's own notes have
  a Take down button; on the reader's own board (`mine`) every note has one, and there's no Leave a
  note. Leave a note emits `write`; the page opens the Leave a note card over the
  board. Emits `remove` with a note's id, `retry` when the notes couldn't load, and `close` (also
  on Esc or a tap outside).
-->
<template>
  <div
    ref="dialog"
    class="modal d-block rl-modal"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-label="Notice board"
    @click.self="$emit('close')"
    @keydown.esc="$emit('close')"
  >
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content p-4">
        <p class="board__eyebrow">{{ mine ? 'Your notice board' : `${owner}'s notice board` }}</p>

        <section class="board__quote" aria-label="Quote of the Day">
          <StateView :loading="loading" :error="error" @retry="load">
            <blockquote class="board__quote-text">“{{ data?.quoteText }}”</blockquote>
            <p v-if="data?.author" class="board__quote-by">
              {{ data.author }}<template v-if="data.work">, <cite>{{ data.work }}</cite></template>
            </p>
            <p v-else-if="data?.topic" class="board__quote-by">On {{ data.topic }}</p>
          </StateView>
        </section>

        <h2 class="board__heading">Notes</h2>
        <StateView :loading="notesLoading" :error="notesError" @retry="$emit('retry')">
        <p v-if="!notes.length" class="board__empty">
          {{ mine ? 'No notes yet. When readers visit, their notes show up here.' : 'No notes yet. Be the first to leave one.' }}
        </p>
        <ul v-else class="board__notes">
          <li v-for="note in notes" :key="note.id" class="board__note">
            <p class="board__note-text">{{ note.text }}</p>
            <p class="board__note-by">From {{ note.author }} · {{ dateOf(note.createdAt) }}</p>
            <button v-if="mine || note.authorId === me" type="button" class="btn btn-danger btn-sm board__take-down" @click="$emit('remove', note.id)">Take down</button>
          </li>
        </ul>
        </StateView>

        <div class="board__actions">
          <button v-if="!mine" class="btn btn-primary" type="button" @click="$emit('write')">Leave a note</button>
          <button class="btn btn-outline-secondary" type="button" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import StateView from '@/components/StateView.vue'
import { useAsync } from '@/composables/useAsync.js'
import { getTodayQuote } from '@/services/api.js'

defineProps({
  // the first name of the reader whose board it is, when it isn't the reader's own
  owner: { type: String, default: '' },
  // the reader's own board, in their own room
  mine: { type: Boolean, default: false },
  // [{ id, authorId, author, text, createdAt }], newest first
  notes: { type: Array, default: () => [] },
  // the notes are on their way, or couldn't be fetched (the message to show)
  notesLoading: { type: Boolean, default: false },
  notesError: { type: String, default: '' },
  // the visitor's reader id: their own notes can be taken down
  me: { type: String, default: '' },
})
defineEmits(['close', 'remove', 'retry', 'write'])

const dialog = ref(null)
const { data, error, loading, run } = useAsync(getTodayQuote)

function load() {
  return run().catch(() => {})
}

const formatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
function dateOf(iso) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : formatter.format(date)
}

onMounted(() => {
  dialog.value.focus()
  load()
})
</script>

<style scoped>
.board__eyebrow {
  margin-bottom: 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-align: center;
  color: var(--house-accent, var(--rl-accent));
}

.board__quote {
  padding: 14px;
  border-radius: 14px;
  background: #fff6e4;
  text-align: center;
}

.board__quote-text {
  margin: 0 0 6px;
  font-family: var(--rl-font-title);
  font-size: 1.05rem;
  color: var(--rl-text);
}

.board__quote-by {
  margin: 0;
  font-size: 12px;
  color: var(--rl-muted);
}

.board__heading {
  margin: 18px 0 10px;
  font-family: var(--rl-font-title);
  font-size: 1rem;
  color: var(--rl-text);
}

.board__empty {
  margin: 0;
  font-size: 13px;
  color: var(--rl-muted);
}

.board__notes {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* a paper note pinned on the board */
.board__note {
  position: relative;
  padding: 12px 14px 10px;
  border: 1px solid #e9d9b4;
  border-radius: 4px;
  background: #fffbe9;
  box-shadow: 0 2px 6px rgba(63, 46, 36, 0.12);
}

.board__note-text {
  margin: 0 0 6px;
  font-size: 14px;
  color: var(--rl-text);
  overflow-wrap: anywhere;
}

.board__note-by {
  margin: 0;
  font-size: 11px;
  color: var(--rl-muted);
}

.board__take-down {
  margin-top: 6px;
}

.board__actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
</style>
