// Scaffolded with AI assistance — see AI_USAGE.md
// Other readers' rooms, for visiting: who lives there, the books on their bookshelf and the
// furniture in the room (from the server, like everyone's). The readers come from the people store
// (stores/people.js); the house only reads them, and turns their books into the shape the room's
// bookshelf uses.
import { getRoomFurniture } from '@/services/api.js'
import { usePeopleStore } from '@/stores/people.js'

// each reader's house's look, from themes.js
const THEME_OF = {
  'emma.reads': 'rose-garden',
  'ayaan.pages': 'night-sky',
  'sofia.shelves': 'tea-room',
  'noah.bookmarks': 'reading-den',
}

function shelfBook(book) {
  return {
    id: book.id,
    title: book.title,
    authors: [book.author],
    genres: book.genre ? [book.genre] : [],
    status: book.status,
    coverUrl: '',
  }
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

// A reader's room: { id, name, firstName, books, currentBook, furniture, theme }, or null when there's
// no such reader. Throws when the reader can't be fetched.
export async function readerRoom(id) {
  const reader = await usePeopleStore().fetchReader(id)
  if (!reader) return null
  const books = reader.books.map(shelfBook)
  return {
    id: reader.id,
    name: reader.displayName,
    firstName: reader.displayName.split(' ')[0],
    books,
    currentBook: books.find((book) => book.status === 'reading') ?? null,
    furniture: await furnitureOf(reader.id),
    theme: THEME_OF[reader.id] ?? null,
  }
}
