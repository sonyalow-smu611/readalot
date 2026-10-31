// Scaffolded with AI assistance — see AI_USAGE.md
// Notes left on readers' notice boards (the corkboard in their room), kept on the server so the
// board's owner and every visitor see them on any device. Each note:
// { id, ownerId, authorId, author, text, createdAt }, newest first. A note comes down when its
// author or the board's owner takes it down.
import { deleteRoomNote, getRoomNotes, postRoomNote } from '@/services/api.js'

export const NOTE_MAX = 140

// A reader's board (readerId: their username, or account id). Throws when it can't be fetched.
export async function notesFor(readerId) {
  const { notes } = await getRoomNotes(readerId)
  return notes
}

// Pins a note on a reader's board, signed by its author ({ id, name }), and returns it. Throws
// when the text is empty or too long, or when it can't be saved.
export async function addNote(readerId, author, text) {
  const clean = String(text ?? '').trim()
  if (!clean || clean.length > NOTE_MAX) throw new Error(`A note needs 1 to ${NOTE_MAX} characters.`)
  try {
    return await postRoomNote(readerId, { text: clean, author: author?.name || '' })
  } catch {
    throw new Error("Your note couldn't be pinned. Try again.")
  }
}

// Takes down a note. Throws when it can't.
export async function removeNote(readerId, id) {
  try {
    await deleteRoomNote(readerId, id)
  } catch {
    throw new Error("That note couldn't be taken down. Try again.")
  }
}
