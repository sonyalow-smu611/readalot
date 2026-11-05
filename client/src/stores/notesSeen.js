// Scaffolded with AI assistance — see AI_USAGE.md
// Which notes on the reader's own notice board are new: those left after they last opened it. The
// time is saved on their profile (database/notes_seen.sql), so every device agrees. Until it has
// loaded nothing counts as new; if it can't be read or saved, opening the board still clears the
// new ones until the page is closed. Used by the room (the corkboard and the board) and the
// town's bell.
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loadNotesReadAt, saveNotesReadAt } from '@/services/auth.js'

// times from the database and from the browser are written differently, so compare them as numbers
const time = (at) => Date.parse(at) || 0

export const useNotesSeenStore = defineStore('notesSeen', () => {
  const readerId = ref('')
  const readAt = ref('')
  // true once the saved time has been read (or couldn't be)
  const known = ref(false)
  let loaded = Promise.resolve()

  // Loads this reader's time; resolves once it has (or couldn't be).
  function start(id) {
    if (!id || id === readerId.value) return loaded
    readerId.value = id
    readAt.value = ''
    known.value = false
    loaded = loadNotesReadAt(id)
      .then(({ data, error }) => {
        if (readerId.value !== id) return
        if (!error && time(data) > time(readAt.value)) readAt.value = data
      })
      .catch(() => {})
      .finally(() => {
        if (readerId.value === id) known.value = true
      })
    return loaded
  }

  // note: { createdAt }
  function isNew(note) {
    return known.value && time(note.createdAt) > time(readAt.value)
  }

  // The board has been opened: everything on it now is read.
  function markRead() {
    readAt.value = new Date().toISOString()
    if (readerId.value) saveNotesReadAt(readerId.value, readAt.value).catch(() => {})
  }

  return { readAt, known, start, isNew, markRead }
})
