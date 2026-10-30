// Scaffolded with AI assistance — see AI_USAGE.md
// Other readers' rooms, for visiting: who lives there, the books on their bookshelf and the
// furniture in the room. The readers come from the people store (stores/people.js); the house
// only reads them, and turns their books into the shape the room's bookshelf uses.
import { usePeopleStore } from '@/stores/people.js'

// What each reader has put in their room, from the furniture library: the same { id, zone, x }
// as a piece placed in My Room (x along its zone, as the spots in strip/layout.js have it). A
// reader missing here has the plain room.
const FURNISHINGS = {
  'emma.reads': [
    { id: 'chair-wingback', zone: 'chair', x: 0.28 },
    { id: 'poster-moon', zone: 'wall', x: 0.36 },
    { id: 'frame-botanical', zone: 'wall', x: 0.91 },
    { id: 'plant-monstera', zone: 'room', x: 0.15 },
    { id: 'cat-ginger', zone: 'room', x: 0.5 },
  ],
  'ayaan.pages': [
    { id: 'chair-papasan', zone: 'chair', x: 0.28 },
    { id: 'poster-mountain', zone: 'wall', x: 0.22 },
    { id: 'frame-gold', zone: 'wall', x: 0.69 },
    { id: 'plant-fig', zone: 'room', x: 0.69 },
    { id: 'cat-black', zone: 'room', x: 0.5 },
  ],
  'sofia.shelves': [
    { id: 'chair-rocking', zone: 'chair', x: 0.28 },
    { id: 'frame-botanical', zone: 'wall', x: 0.36 },
    { id: 'frame-gold', zone: 'wall', x: 0.91 },
    { id: 'plant-succulents', zone: 'seat', x: 0.5 },
    { id: 'cat-calico', zone: 'room', x: 0.5 },
  ],
  'noah.bookmarks': [
    { id: 'chair-wingback', zone: 'chair', x: 0.28 },
    { id: 'poster-book-club', zone: 'wall', x: 0.36 },
    { id: 'poster-mountain', zone: 'wall', x: 0.69 },
    { id: 'plant-monstera', zone: 'room', x: 0.51 },
    { id: 'cat-black', zone: 'room', x: 0.5 },
  ],
}

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
    furniture: (FURNISHINGS[reader.id] ?? []).map((item, k) => ({ ...item, uid: `${reader.id}-${k}` })),
    theme: THEME_OF[reader.id] ?? null,
  }
}
