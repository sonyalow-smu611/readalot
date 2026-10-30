// How much another reader's taste overlaps yours. `me` is { books, favoriteGenres }: your shelf
// (books with a title) and your favourite genres. Books match by title, since two readers can
// shelve the same book from different editions.

const titleKey = (book) => String(book.title ?? '').trim().toLowerCase()

export function getSharedBooks(reader, me) {
  const mine = new Set(me.books.map(titleKey))
  return reader.books.filter((book) => mine.has(titleKey(book)))
}

export function getSharedGenres(reader, me) {
  const mine = new Set(me.favoriteGenres)
  return reader.favoriteGenres.filter((genre) => mine.has(genre))
}

/** A transparent illustrative match metric, not a validated recommendation algorithm.
 * 60% = fraction of my books also on their shelf; 40% = fraction of my favorite genres shared.
 */
export function getCompatibility(reader, me) {
  const bookRatio = getSharedBooks(reader, me).length / Math.max(1, me.books.length)
  const genreRatio = getSharedGenres(reader, me).length / Math.max(1, me.favoriteGenres.length)
  return Math.round(100 * (0.6 * bookRatio + 0.4 * genreRatio))
}

export function getCurrentlyReading(reader) {
  return reader.books.find((book) => book.status === 'reading') ?? null
}

// The shelf statuses (user_books.status) as reader profiles name them.
export const STATUS_LABELS = { reading: 'Reading', want_to_read: 'To Read', read: 'Finished' }
