// Scaffolded with AI assistance — see AI_USAGE.md
// Remove from shelf, for the house's book cards (the room's and My Shelf's): asks first unless
// told not to (remembered on this device), then takes the book off with Undo in a toast.
// `removing` is the book being asked about, for RemoveBookModal; `onGone` runs as it goes, so the
// card can close.
import { ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { useBookshelfStore } from '@/stores/bookshelf'

const SKIP_CONFIRM_KEY = 'readalot.skipRemoveConfirm'

function skipConfirm() {
  try {
    return localStorage.getItem(SKIP_CONFIRM_KEY) === 'yes'
  } catch {
    return false
  }
}

export function useRemoveBook(onGone) {
  const bookshelf = useBookshelfStore()
  const { show: showToast } = useToast()
  const removing = ref(null)

  function askRemove(book) {
    if (skipConfirm()) removeBook(book)
    else removing.value = book
  }

  function confirmRemove({ remember }) {
    const book = removing.value
    removing.value = null
    if (remember) {
      try {
        localStorage.setItem(SKIP_CONFIRM_KEY, 'yes')
      } catch {
        // storage unavailable: it asks again next visit
      }
    }
    removeBook(book)
  }

  async function removeBook(book) {
    onGone()
    try {
      const removed = await bookshelf.removeBook(book.id)
      if (!removed) return
      showToast(`Removed “${removed.title}”`, 5000, { label: 'Undo', run: () => undoRemove(removed) })
    } catch {
      showToast(`Couldn't remove “${book.title}”. Try again.`)
    }
  }

  async function undoRemove(book) {
    try {
      await bookshelf.restoreBook(book)
    } catch {
      showToast(`Couldn't put “${book.title}” back. Try again.`)
    }
  }

  return { removing, askRemove, confirmRemove }
}
