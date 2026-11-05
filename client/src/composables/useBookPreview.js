// Scaffolded with AI assistance — see AI_USAGE.md
// The Quick Book Preview for pages that list books (the library, genre shelf, search): which
// book is open, and putting it on the reader's shelf. The preview stays open once the book is
// added, and says which shelf it is on now. A book added from the preview can be taken straight back
// off with Undo.
import { ref } from 'vue'
import { useBookshelfStore } from '@/stores/bookshelf'
import { useToast } from '@/composables/useToast'
import { STATUSES } from '@/services/shelves.js'

export function useBookPreview() {
  const bookshelf = useBookshelfStore()
  const toast = useToast()
  const previewBook = ref(null)
  const saving = ref(false)
  // the book this preview just added, which Undo can take off again
  const addedId = ref('')

  // If the book is already on the reader's shelf, the modal highlights its current status.
  function openPreview(book) {
    addedId.value = ''
    previewBook.value = { ...book, status: bookshelf.findBook(book.id)?.status }
  }

  function closePreview() {
    previewBook.value = null
    addedId.value = ''
  }

  async function saveStatus(status) {
    const book = previewBook.value
    if (!book || saving.value) return

    saving.value = true
    try {
      await bookshelf.addBook(book.id, status)
      const shelf = STATUSES.find((option) => option.value === status)?.label ?? 'your shelf'
      toast.show(`Added "${book.title}" to ${shelf}`)
      addedId.value = book.id
      if (previewBook.value?.id === book.id) previewBook.value = { ...previewBook.value, status }
    } catch {
      toast.show(`Couldn't save "${book.title}". Try again.`)
    } finally {
      saving.value = false
    }
  }

  // Takes the book this preview added off the shelf again.
  async function undoAdd() {
    const book = previewBook.value
    if (!book || saving.value || addedId.value !== book.id) return
    saving.value = true
    try {
      await bookshelf.removeBook(book.id)
      addedId.value = ''
      if (previewBook.value?.id === book.id) previewBook.value = { ...previewBook.value, status: undefined }
      toast.show(`Removed "${book.title}" from your shelf`)
    } catch (err) {
      toast.show(err.message)
    } finally {
      saving.value = false
    }
  }

  return { previewBook, saving, addedId, openPreview, closePreview, saveStatus, undoAdd }
}
