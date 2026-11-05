// Scaffolded with AI assistance — see AI_USAGE.md
// Other readers' rooms, for visiting: who lives there, the books on their bookshelf and the
// furniture in the room (from the server, like everyone's). The readers come from the people store
// (stores/people.js); the house only reads them, and turns their books into the shape the room's
// bookshelf uses.
import { normalizeBook } from '@/lib/book.js'
import { getRoomFurniture } from '@/services/api.js'
import { usePeopleStore } from '@/stores/people.js'

// each reader's house's look, from themes.js
const THEME_OF = {
  'emma.reads': 'rose-garden',
  'ayaan.pages': 'night-sky',
  'sofia.shelves': 'tea-room',
  'noah.bookmarks': 'reading-den',
  'pip.ikda': 'tea-room',
}

// A book off their shelf, as the reader's own shelf has it: the server sends the full book (cover,
// synopsis and the rest), and a list's lighter book (title, author, genre) still reads right.
function shelfBook(book) {
  return normalizeBook({ ...book, authors: book.authors ?? [book.author] })
}

// The furniture standing in a reader's room: what they've placed, the sample readers included
// (the seed saves theirs). Furniture that can't be fetched leaves the room plain, so the visit still works.
async function furnitureOf(readerId) {
  try {
    return (await getRoomFurniture(readerId)).pieces.filter((piece) => piece.zone)
  } catch {
    return []
  }
}

const firstNameOf = (reader) => reader.displayName.split(' ')[0]

// A reader's first name, if the people store already has them: '' when it doesn't yet.
export function knownFirstName(id) {
  const reader = usePeopleStore().find(id)
  return reader ? firstNameOf(reader) : ''
}

// A reader's room: { id, name, firstName, books, currentBook, furniture, theme }, or null when there's
// no such reader. Throws when the reader can't be fetched.
export async function readerRoom(id) {
  const reader = await usePeopleStore().fetchReader(id, { full: true })
  if (!reader) return null
  const books = reader.books.map(shelfBook)
  return {
    id: reader.id,
    name: reader.displayName,
    firstName: firstNameOf(reader),
    books,
    currentBook: books.find((book) => book.status === 'reading') ?? null,
    furniture: await furnitureOf(reader.id),
    theme: THEME_OF[reader.id] ?? null,
  }
}
