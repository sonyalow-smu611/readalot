// Scaffolded with AI assistance — see AI_USAGE.md
// Pip the Librarian, the neighbour the walkthrough's Cafe part introduces (lib/walkthrough.js).
// Pip has no account and no row in the database: while the walkthrough plays, api.js and
// chatApi.js answer for Pip from here instead of asking the server. So every reader meets the
// same Pip, and nothing about Pip is saved. Pip:
//   - sits in the Cafe (GET /people) and has a profile (GET /people/pip.ikda)
//   - says yes to a friend request at once, and moves into a free friend's house in town
//   - pins a welcome note on your board when you become friends
//   - writes back to every message
//   - has a room you can visit, with furniture, books and a board you can leave a note on
// When the walkthrough ends Pip leaves town (stores/user.js), and the friendship, the chat and the
// notes go too. A replay starts again from the beginning.
import { ref } from 'vue'
import { NEIGHBOUR } from '@/lib/neighbour.js'
import { FRIEND_HOUSES } from '@/town/places.js'

// Pip's account id, as messages and notes name the other reader (never a real account's)
export const PIP_ACCOUNT = '00000000-0000-4000-8000-000000000208'
const NAME = 'Pip the Librarian'
const NOT_FOUND = 'Reader not found'

// true while the walkthrough plays: Pip is only in town then
export const pipInTown = ref(false)

// One walkthrough's worth of Pip: the reader's own account id (whose board the welcome note goes
// on), when Pip said yes ('' until then), whether the welcome note was taken down, the notes left
// on Pip's board and the chat.
let state = fresh('')

function fresh(me) {
  return { me, friendsSince: '', welcomeDown: false, notes: [], messages: [], count: 0 }
}

const nextId = (kind) => `pip-${kind}-${++state.count}`

// The walkthrough has started: Pip arrives, a stranger again. `me` is the reader's account id.
export function pipArrives(me) {
  state = fresh(String(me ?? ''))
  pipInTown.value = true
}

// The walkthrough has ended: Pip leaves, and takes everything that happened with them.
export function pipLeaves() {
  state = fresh('')
  pipInTown.value = false
}

// Pip, by username or account id
export const isPip = (id) => id === NEIGHBOUR || id === PIP_ACCOUNT

function mustBeInTown() {
  if (!pipInTown.value) throw new Error(NOT_FOUND)
}

// --- Who Pip is ----------------------------------------------------------------------------------

// Pip's shelf: real Open Library books (the server looks up "ol-" ids), so a tapped book opens,
// shows its cover and can be added to your own shelf. The Hobbit is the book the walkthrough
// suggests you look up, so it's a book you share.
const coverOf = (coverId) => `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
const SHELF = [
  {
    id: 'ol-OL27482W',
    title: 'The Hobbit',
    authors: ['J. R. R. Tolkien'],
    coverUrl: coverOf(14627509),
    description: 'Bilbo Baggins is happy at home until a wizard and thirteen dwarves sweep him off on a quest to win back a dragon\'s gold.',
    genres: ['Fantasy'],
    publishedDate: '1937',
    pageCount: 310,
    status: 'read',
    progress: 100,
  },
  {
    id: 'ol-OL21745884W',
    title: 'Project Hail Mary',
    authors: ['Andy Weir'],
    coverUrl: coverOf(11200092),
    description: 'A science teacher wakes up alone on a spaceship with no memory, and slowly works out that he is humanity\'s last hope.',
    genres: ['Science Fiction'],
    publishedDate: '2021',
    pageCount: 496,
    status: 'reading',
    progress: 42,
  },
  {
    id: 'ol-OL66554W',
    title: 'Pride and Prejudice',
    authors: ['Jane Austen'],
    coverUrl: coverOf(14348537),
    description: 'Elizabeth Bennet and the proud Mr Darcy get each other badly wrong, in the most famous courtship in English fiction.',
    genres: ['Literary Fiction'],
    publishedDate: '1813',
    pageCount: 351,
    status: 'read',
    progress: 100,
  },
  {
    id: 'ol-OL4321141W',
    title: 'The Secret History',
    authors: ['Donna Tartt'],
    coverUrl: coverOf(744854),
    description: 'A close circle of classics students at a Vermont college, and the murder that one of them did not see coming.',
    genres: ['Mystery'],
    publishedDate: '1992',
    pageCount: 608,
    status: 'want_to_read',
    progress: 0,
  },
]

// Pip as the server sends a reader (server/src/services/readers.js): a list has each book's title,
// author, genre and shelf; `full` (a profile, a visit to the room) has every book in full. Pip is
// always online.
function pipReader({ full = false } = {}) {
  return {
    id: NEIGHBOUR,
    userId: PIP_ACCOUNT,
    username: NEIGHBOUR,
    displayName: NAME,
    initials: 'PT',
    tagline: 'Town librarian. Ask me for a book!',
    neighborhood: 'IKDA Town',
    lat: 1.3,
    lng: 103.85,
    favoriteGenres: ['Fantasy', 'Mystery & Thriller', 'Sci-Fi', 'Romance'],
    character: { base: 'rex', hair: 'bun', hairColour: 'auburn', skin: 'tone-3', top: 'fuzzy', topColour: 'sage', bottom: 'baggy', bottomColour: 'slate', shoes: 'trainers', shoeColour: 'ink', neck: 'scarf-grey' },
    lastSeenAt: new Date().toISOString(),
    books: SHELF.map((book) => ({
      ...(full ? { ...book, googleBooksId: book.id } : {}),
      id: book.id,
      title: book.title,
      author: book.authors[0],
      genre: book.genres[0],
      status: book.status,
    })),
  }
}

// The furniture in Pip's room, as a reader's placed pieces ({ uid, id, zone, x }: see
// buildings/house/strip/layout.js)
const FURNITURE = [
  { uid: 'pip-chair', id: 'chair-wingback', zone: 'chair', x: 0.28 },
  { uid: 'pip-frame', id: 'frame-botanical', zone: 'wall', x: 0.36 },
  { uid: 'pip-plant', id: 'plant-monstera', zone: 'room', x: 0.15 },
  { uid: 'pip-cat', id: 'cat-ginger', zone: 'room', x: 0.5 },
]

// --- What api.js asks -----------------------------------------------------------------------------

// GET /people: the readers, with Pip among them while the walkthrough plays (and never otherwise)
export function withPip(list) {
  const readers = (list?.readers ?? []).filter((reader) => !isPip(reader.id) && !isPip(reader.userId))
  return { ...list, readers: pipInTown.value ? [...readers, pipReader()] : readers }
}

// GET /people/pip.ikda
export function pipProfile() {
  mustBeInTown()
  return { reader: pipReader({ full: true }) }
}

// POST /friends/requests for Pip: Pip says yes straight away
export function befriendPip() {
  mustBeInTown()
  if (!state.friendsSince) state.friendsSince = new Date().toISOString()
  return { requested: true }
}

// DELETE /friends/pip.ikda
export function unfriendPip() {
  state.friendsSince = ''
  return { removed: true }
}

// GET /friends: your friends, with Pip among them once Pip has said yes. Pip takes the first free
// friend's house, as a new friend does (server/src/services/friends.js); none when the town is full.
export function withPipFriend(data) {
  const others = (reader) => !isPip(reader?.id) && !isPip(reader?.userId)
  const friends = (data?.friends ?? []).filter(others)
  const result = {
    ...data,
    friends,
    incoming: (data?.incoming ?? []).filter((request) => others(request.reader)),
    outgoing: (data?.outgoing ?? []).filter((id) => !isPip(id)),
    sent: (data?.sent ?? []).filter((request) => others(request.reader)),
  }
  if (!pipInTown.value || !state.friendsSince) return result
  const taken = new Set(friends.map((friend) => friend.spot))
  const spot = FRIEND_HOUSES.findIndex((house, index) => !taken.has(index))
  return { ...result, friends: [...friends, { ...pipReader(), spot: spot < 0 ? null : spot }] }
}

// GET /rooms/pip.ikda/furniture
export function pipFurniture() {
  mustBeInTown()
  return { pieces: FURNITURE.map((piece) => ({ ...piece })) }
}

// GET /rooms/pip.ikda/notes: the notes you've left on Pip's board, newest first
export function pipBoard() {
  mustBeInTown()
  return { notes: [...state.notes] }
}

// POST /rooms/pip.ikda/notes: { text, author }. notes.js has already checked the text.
export function pinOnPip({ text, author } = {}) {
  mustBeInTown()
  const note = {
    id: nextId('note'),
    ownerId: PIP_ACCOUNT,
    authorId: state.me,
    author: author || 'A reader',
    text: String(text ?? ''),
    createdAt: new Date().toISOString(),
  }
  state.notes = [note, ...state.notes]
  return note
}

// DELETE /rooms/pip.ikda/notes/:id
export function takeDownPipNote(noteId) {
  state.notes = state.notes.filter((note) => note.id !== noteId)
  return null
}

// Pip's welcome note, on your own board from the moment you become friends
const WELCOME_ID = 'pip-welcome'

function welcomeNote() {
  return {
    id: WELCOME_ID,
    ownerId: state.me,
    authorId: PIP_ACCOUNT,
    author: NAME,
    text: 'Welcome to town, neighbour! Pop by the library any time. — Pip',
    createdAt: state.friendsSince,
  }
}

// GET /rooms/<you>/notes: your board, with Pip's welcome note on it once you're friends
export function withWelcome(readerId, data) {
  const notes = data?.notes ?? []
  const showing = pipInTown.value && state.friendsSince && !state.welcomeDown && state.me && readerId === state.me
  if (!showing) return data
  const time = (note) => Date.parse(note.createdAt) || 0
  return { ...data, notes: [...notes, welcomeNote()].sort((a, b) => time(b) - time(a)) }
}

// DELETE /rooms/<you>/notes/pip-welcome: true when it was Pip's welcome note, now taken down
export function takeDownWelcome(readerId, noteId) {
  if (noteId !== WELCOME_ID || !state.me || readerId !== state.me) return false
  state.welcomeDown = true
  return true
}

// --- What chatApi.js asks -------------------------------------------------------------------------

// What Pip writes back (the same lines Pip had in database/neighbour.sql)
const REPLIES = [
  'Hi! Have you found a good book yet?',
  "Lovely to hear from you! The library's help desk can find any book.",
  "Ooh, tell me what you're reading now!",
  'Have you visited the cafe? There are readers like you there.',
  "Don't forget your daily tasks: they keep your streak going!",
  'A good book and a cup of tea: perfect day.',
]

// your conversation with Pip, oldest first, as reader_messages rows
export function pipChat() {
  mustBeInTown()
  return { messages: [...state.messages] }
}

// Your message to Pip, and Pip's reply a second after it. Returns your message.
export function messagePip(senderId, content) {
  mustBeInTown()
  const sent = new Date()
  const mine = {
    id: nextId('message'),
    sender_id: senderId,
    receiver_id: PIP_ACCOUNT,
    content,
    created_at: sent.toISOString(),
  }
  const reply = {
    id: nextId('message'),
    sender_id: PIP_ACCOUNT,
    receiver_id: senderId,
    content: REPLIES[Math.floor(Math.random() * REPLIES.length)],
    created_at: new Date(sent.getTime() + 1000).toISOString(),
  }
  state.messages = [...state.messages, mine, reply]
  return mine
}
