// Scaffolded with AI assistance — see AI_USAGE.md
// Every reader's reviews of the book a card is showing, and the rating to show for it: the
// Readalot readers' average, or Google's when nobody here has rated it. `book` is a getter
// (() => props.book); the reviews load again whenever its id changes.
import { computed, ref, watch } from 'vue'
import { deleteReview, getReviews, saveReview } from '@/services/api.js'
import { useBookshelfStore } from '@/stores/bookshelf'

export function useBookReviews(book) {
  const reviews = ref([])
  const loading = ref(false)
  const error = ref(false)

  async function load() {
    const id = book()?.id
    if (!id) return
    loading.value = true
    error.value = false
    try {
      const data = await getReviews(id)
      // a quicker reader may have opened another book meanwhile
      if (book()?.id === id) reviews.value = data?.reviews ?? []
    } catch {
      if (book()?.id === id) error.value = true
    } finally {
      if (book()?.id === id) loading.value = false
    }
  }

  watch(
    () => book()?.id,
    () => {
      reviews.value = []
      load()
    },
    { immediate: true },
  )

  const googleRating = computed(() => Number(book()?.rating ?? book()?.averageRating) || 0)
  const rating = computed(() =>
    reviews.value.length
      ? reviews.value.reduce((sum, review) => sum + review.rating, 0) / reviews.value.length
      : googleRating.value,
  )
  // "4", "3.7"
  const ratingText = computed(() => rating.value.toFixed(1).replace(/\.0$/, ''))
  // where the rating comes from: "from 3 Readalot readers", "from Google Books", or ''
  const ratingSource = computed(() => {
    const readers = reviews.value.length
    if (readers) return `from ${readers} Readalot ${readers === 1 ? 'reader' : 'readers'}`
    if (!googleRating.value) return ''
    const count = Number(book()?.ratingsCount) || 0
    return count ? `from ${count} ${count === 1 ? 'rating' : 'ratings'} on Google Books` : 'from Google Books'
  })

  // --- your own review ---
  const bookshelf = useBookshelfStore()
  const saving = ref(false)
  const saveError = ref('')

  // Saves your rating (1-5) and caption; the list shows it straight away. Resolves true when it
  // saved, false when it didn't (saveError says why).
  async function save({ rating: stars, text }) {
    const id = book()?.id
    if (!id) return false
    saving.value = true
    saveError.value = ''
    try {
      const { review } = await saveReview(id, { rating: stars, reviewText: text })
      if (book()?.id === id) reviews.value = [review, ...reviews.value.filter((item) => !item.mine)]
      bookshelf.setMyReview(id, review)
      return true
    } catch (err) {
      saveError.value = err.message || "Couldn't save your review. Try again."
      return false
    } finally {
      saving.value = false
    }
  }

  async function remove() {
    const id = book()?.id
    if (!id) return false
    saving.value = true
    saveError.value = ''
    try {
      await deleteReview(id)
      if (book()?.id === id) reviews.value = reviews.value.filter((item) => !item.mine)
      bookshelf.setMyReview(id, null)
      return true
    } catch (err) {
      saveError.value = err.message || "Couldn't delete your review. Try again."
      return false
    } finally {
      saving.value = false
    }
  }

  return { reviews, loading, error, load, rating, ratingText, ratingSource, saving, saveError, save, remove }
}
