// Scaffolded with AI assistance — see AI_USAGE.md
// The reader's shelf, shared by the room bookcase, the full bookshelf and the reading chair.
// Books come from the API (GET /api/user-books) and a status change is saved straight back.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getMyBooks, saveUserBook, updateReadingStatus } from '@/services/api.js'
import { normalizeBook } from '@/lib/book.js'

export const BOOK_STATUSES = ['want_to_read', 'reading', 'read']

// Where each book sits on its shelf is a per-device preference, not server data.
const ORDER_KEY = 'readalot.shelfOrder'

function readOrder() {
  try {
    return JSON.parse(localStorage.getItem(ORDER_KEY)) || []
  } catch {
    return []
  }
}

export const useBookshelfStore = defineStore('bookshelf', () => {
  const saved = ref([])
  const order = ref(readOrder())
  const loading = ref(false)
  const error = ref('')
  const moveError = ref('')

  // Shelf order first; books this device has never arranged go to the end.
  const books = computed(() => {
    const rank = new Map(order.value.map((id, index) => [id, index]))
    const last = order.value.length
    return [...saved.value].sort((a, b) => (rank.get(a.id) ?? last) - (rank.get(b.id) ?? last))
  })

  const booksByStatus = computed(() =>
    Object.fromEntries(
      BOOK_STATUSES.map((status) => [status, books.value.filter((book) => book.status === status)]),
    ),
  )

  const statusCounts = computed(() =>
    Object.fromEntries(BOOK_STATUSES.map((status) => [status, booksByStatus.value[status].length])),
  )

  // The book picked up most recently.
  const currentlyReading = computed(
    () =>
      [...booksByStatus.value.reading].sort((a, b) =>
        String(b.updatedAt).localeCompare(String(a.updatedAt)),
      )[0] ?? null,
  )

  async function load() {
    loading.value = true
    error.value = ''
    try {
      saved.value = (await getMyBooks()).books.map(normalizeBook)
    } catch (err) {
      error.value = err.message || "Couldn't load your shelf."
    } finally {
      loading.value = false
    }
  }

  // Put a book on a shelf, then re-read the shelf so the room shows it. Throws if the save
  // fails, so the caller can say so next to the button that was pressed.
  async function addBook(bookId, status = 'want_to_read') {
    await saveUserBook({ bookId, status })
    saved.value = (await getMyBooks()).books.map(normalizeBook)
  }

  function findBook(id) {
    return saved.value.find((book) => book.id === id) ?? null
  }

  function setOrder(ids) {
    order.value = ids
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(ids))
    } catch {
      // storage unavailable: the order just lasts for this visit
    }
  }

  // Shows a change to a book's status or progress at once, then saves it; a failed save puts
  // the book back as it was.
  async function save(book, changes, failure) {
    const previous = { status: book.status, progress: book.progress, updatedAt: book.updatedAt }
    Object.assign(book, changes, { updatedAt: new Date().toISOString() })
    moveError.value = ''

    try {
      await updateReadingStatus(book.id, changes)
    } catch {
      Object.assign(book, previous)
      moveError.value = failure
    }
  }

  // Move a book to another shelf. Finishing a book also fills in its progress.
  async function setStatus(id, status) {
    if (!BOOK_STATUSES.includes(status)) {
      throw new Error(`Unknown book status: ${status}`)
    }
    const book = findBook(id)
    if (!book || book.status === status) return

    const changes = status === 'read' ? { status, progress: 100 } : { status }
    await save(book, changes, `Couldn't move "${book.title}". Try again.`)
  }

  // How far through a book the reader is, 0-100.
  async function setProgress(id, progress) {
    const book = findBook(id)
    const percent = Math.min(100, Math.max(0, Math.round(Number(progress) || 0)))
    if (!book || book.progress === percent) return

    await save(book, { progress: percent }, `Couldn't save your progress in "${book.title}". Try again.`)
  }

  // Re-file every book on a shelf to one status. Used after a drag so the store matches
  // whichever shelf each book actually landed on.
  function applyShelf(ids, status) {
    ids.forEach((id) => setStatus(id, status))
  }

  return {
    books,
    booksByStatus,
    statusCounts,
    currentlyReading,
    loading,
    error,
    moveError,
    load,
    addBook,
    findBook,
    setOrder,
    setStatus,
    setProgress,
    applyShelf,
  }
})
