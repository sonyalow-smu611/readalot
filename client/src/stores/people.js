// Other readers (GET /api/people): the Cafe, the friends' houses in town and reader profiles all
// read them from here, so they are fetched once. Each reader is { id, userId, username,
// displayName, initials, tagline, neighborhood, lat, lng, favoriteGenres, character, lastSeenAt,
// books: [{ id, title, author, genre, status }] }; `id` is their username, used in links.
// Also how well each reader matches your shelf and favourite genres. Friends are in town/nearbyStore.js.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getReader, getReaders } from '@/services/api.js'
import { isPip, pipInTown } from '@/services/walkthroughPip.js'
import { getCompatibility, getSharedBooks, getSharedGenres } from '@/lib/readerMatch.js'
import { useBookshelfStore } from '@/stores/bookshelf.js'
import { useUserStore } from '@/stores/user'

export const usePeopleStore = defineStore('people', () => {
  const fetched = ref([])
  // Pip, the walkthrough's neighbour, leaves with the walkthrough, even from a list fetched while it played
  const readers = computed(() => (pipInTown.value ? fetched.value : fetched.value.filter((reader) => !isPip(reader.id))))
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref('')
  let pending = null

  const user = useUserStore()
  const bookshelf = useBookshelfStore()
  // you, as the match compares you
  const me = computed(() => ({ books: bookshelf.books, favoriteGenres: user.profile.favouriteGenres ?? [] }))

  // Fetches the readers once; `force` fetches them again.
  function load(force = false) {
    if (loaded.value && !force) return Promise.resolve()
    pending ??= (async () => {
      loading.value = true
      error.value = ''
      try {
        const list = await getReaders()
        fetched.value = list.readers
        loaded.value = true
      } catch (err) {
        error.value = err.message || "Couldn't load the readers."
      } finally {
        loading.value = false
        pending = null
      }
    })()
    // the match needs your shelf
    if (!bookshelf.books.length && !bookshelf.loading) bookshelf.load()
    return pending
  }

  function find(id) {
    return readers.value.find((reader) => reader.id === String(id)) ?? null
  }

  // One reader, from the list when it has them, else fetched on its own; null when there's no
  // such reader. `full` always fetches them on their own: the list only has each book's title,
  // author and shelf, and a visit to their room shows the books in full (cover, synopsis). Throws
  // when the request fails for another reason.
  async function fetchReader(id, { full = false } = {}) {
    await load()
    const known = find(id)
    if (known && !full) return known
    try {
      return (await getReader(id)).reader
    } catch (err) {
      if (err.message === 'Reader not found') return null
      throw err
    }
  }

  // signed out: the next reader fetches their own
  function reset() {
    fetched.value = []
    loaded.value = false
    error.value = ''
  }

  return {
    readers,
    loaded,
    loading,
    error,
    load,
    find,
    fetchReader,
    reset,
    compatibility: (reader) => getCompatibility(reader, me.value),
    sharedBooks: (reader) => getSharedBooks(reader, me.value),
    sharedGenres: (reader) => getSharedGenres(reader, me.value),
  }
})
