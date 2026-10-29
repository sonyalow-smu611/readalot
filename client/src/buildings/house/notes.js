// Scaffolded with AI assistance — see AI_USAGE.md
// Notes left on readers' notice boards (the corkboard in their room), kept per reader in this
// browser, as the Cafe keeps its follows and demo chat: the sample readers aren't real accounts,
// so nothing goes to the server. Each note: { id, readerId, authorId, author, text, createdAt }, newest
// first. Only the reader who left a note can take it down.
const KEY = 'readalot.roomNotes'
export const NOTE_MAX = 140

function readAll() {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}')
    return all && typeof all === 'object' && !Array.isArray(all) ? all : {}
  } catch {
    return {}
  }
}

function writeAll(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    throw new Error("Your note couldn't be saved: this browser isn't letting Readalot store anything.")
  }
}

export function notesFor(readerId) {
  const list = readAll()[readerId]
  return Array.isArray(list) ? list : []
}

// Pins a note on a reader's board, signed by its author ({ id, name }), and returns it. Throws
// when the text is empty or too long, or when it can't be saved.
export function addNote(readerId, author, text) {
  const clean = String(text ?? '').trim()
  if (!clean || clean.length > NOTE_MAX) throw new Error(`A note needs 1 to ${NOTE_MAX} characters.`)
  const note = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    readerId,
    authorId: author?.id ?? '',
    author: author?.name || 'A reader',
    text: clean,
    createdAt: new Date().toISOString(),
  }
  const all = readAll()
  all[readerId] = [note, ...notesFor(readerId)]
  writeAll(all)
  return note
}

// Takes down a note, as long as `authorId` left it.
export function removeNote(readerId, id, authorId) {
  const all = readAll()
  all[readerId] = notesFor(readerId).filter((note) => note.id !== id || !authorId || note.authorId !== authorId)
  writeAll(all)
}
