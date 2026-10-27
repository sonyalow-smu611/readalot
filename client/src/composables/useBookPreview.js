// Scaffolded with AI assistance — see AI_USAGE.md
// The Quick Book Preview for pages that list books (Discover, genre shelf, search): which book
// is open, and saving the reading status picked in it to the reader's shelf.
import { ref } from 'vue'
import { useBookshelfStore } from '@/stores/bookshelf'
import { useToast } from '@/composables/useToast'
import { STATUSES } from '@/services/shelves.js'

export function useBookPreview() {
  const bookshelf = useBookshelfStore()
  const toast = useToast()
  const previewBook = ref(null)
  const saving = ref(false)

  // If the book is already on the reader's shelf, the modal highlights its current status.
  function openPreview(book) {
    previewBook.value = { ...book, status: bookshelf.findBook(book.id)?.status }
  }

  function closePreview() {
    previewBook.value = null
  }

  async function saveStatus(status) {
    const book = previewBook.value
    if (!book || saving.value) return

    saving.value = true
    try {
      await bookshelf.addBook(book.id, status)
      const shelf = STATUSES.find((option) => option.value === status)?.label ?? 'your shelf'
      toast.show(`Added "${book.title}" to ${shelf}`)
      closePreview()
    } catch {
      toast.show(`Couldn't save "${book.title}". Try again.`)
    } finally {
      saving.value = false
    }
  }

  return { previewBook, openPreview, closePreview, saveStatus }
}
