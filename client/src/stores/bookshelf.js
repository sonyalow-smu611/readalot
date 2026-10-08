// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import booksData from '@/data/books.json'

export const BOOK_STATUSES = ['tbr', 'reading', 'read']

// Phase 1: seeded from local mock JSON. Later phases swap the seed for API/backend data.
export const useBookshelfStore = defineStore('bookshelf', () => {
  const books = ref(structuredClone(booksData))

  const booksByStatus = computed(() =>
    Object.fromEntries(
      BOOK_STATUSES.map((status) => [status, books.value.filter((book) => book.status === status)]),
    ),
  )

  const statusCounts = computed(() =>
    Object.fromEntries(BOOK_STATUSES.map((status) => [status, booksByStatus.value[status].length])),
  )

  const currentlyReading = computed(() => booksByStatus.value.reading[0] ?? null)

  function findBook(id) {
    return books.value.find((book) => book.id === id) ?? null
  }

  function setStatus(id, status) {
    if (!BOOK_STATUSES.includes(status)) {
      throw new Error(`Unknown book status: ${status}`)
    }
    const book = findBook(id)
    if (book) book.status = status
  }

  // Re-file every book on a shelf to one status. Used after a drag so the store matches
  // whichever shelf each book actually landed on.
  function applyShelf(ids, status) {
    ids.forEach((id) => setStatus(id, status))
  }

  return { books, booksByStatus, statusCounts, currentlyReading, findBook, setStatus, applyShelf }
})
