// Other readers (GET /api/people): the Cafe, the friends' houses in town and reader profiles all
// read them from here, so they are fetched once. Each reader is { id, userId, username,
// displayName, initials, tagline, neighborhood, lat, lng, favoriteGenres, character, lastSeenAt,
// books: [{ id, title, author, genre, status }] }; `id` is their username, used in links.
// Also who you follow, and how well each reader matches your shelf and favourite genres.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getFollowing, getReader, getReaders, setFollowing } from '@/services/api.js'
import { getCompatibility, getSharedBooks, getSharedGenres } from '@/lib/readerMatch.js'
import { useBookshelfStore } from '@/stores/bookshelf.js'
import { useUserStore } from '@/stores/user'

export const usePeopleStore = defineStore('people', () => {
  const readers = ref([])
  const following = ref([])
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref('')
  let pending = null

  const user = useUserStore()
  const bookshelf = useBookshelfStore()
  // you, as the match compares you
  const me = computed(() => ({ books: bookshelf.books, favoriteGenres: user.profile.favouriteGenres ?? [] }))

  // Fetches the readers and your follows once; `force` fetches them again.
  function load(force = false) {
    if (loaded.value && !force) return Promise.resolve()
    pending ??= (async () => {
      loading.value = true
      error.value = ''
      try {
        const [list, follows] = await Promise.all([getReaders(), getFollowing()])
        readers.value = list.readers
        following.value = follows.following
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
  // such reader. Throws when the request fails for another reason.
  async function fetchReader(id) {
    await load()
    const known = find(id)
    if (known) return known
    try {
      return (await getReader(id)).reader
    } catch (err) {
      if (err.message === 'Reader not found') return null
      throw err
    }
  }

  function isFollowing(id) {
    return following.value.includes(String(id))
  }

  // Follow or unfollow; resolves to whether you now follow them, and throws when it isn't saved.
  async function toggleFollow(id) {
    const follow = !isFollowing(id)
    await setFollowing(id, follow)
    following.value = follow ? [...following.value, String(id)] : following.value.filter((other) => other !== String(id))
    return follow
  }

  // signed out: the next reader fetches their own
  function reset() {
    readers.value = []
    following.value = []
    loaded.value = false
    error.value = ''
  }

  return {
    readers,
    following,
    loaded,
    loading,
    error,
    load,
    find,
    fetchReader,
    isFollowing,
    toggleFollow,
    reset,
    compatibility: (reader) => getCompatibility(reader, me.value),
    sharedBooks: (reader) => getSharedBooks(reader, me.value),
    sharedGenres: (reader) => getSharedGenres(reader, me.value),
  }
})
