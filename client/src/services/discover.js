// What the Discover pages show: the shelves on /discover, the filter chips above them and the
// genres that have a "See all" page (/discover/:genre).
// Queries are plain Google Books searches. Plain words work better than `subject:` searches,
// which often come back empty.

export const FILTERS = ['For You', 'Genres', 'Awards', 'Community']

export const GENRES = {
  fiction: { title: 'Popular fiction', emoji: '🔥', query: 'bestselling fiction' },
  fantasy: { title: 'Fantasy', emoji: '🐉', query: 'fantasy novel' },
  romance: { title: 'Romance', emoji: '💌', query: 'romance novel' },
  mystery: { title: 'Mystery', emoji: '🔎', query: 'mystery thriller novel' },
}

// `category` is the filter chip a shelf belongs to; "For You" shows every shelf.
// `genre` links the shelf's "See all" to its genre page (none for shelves without one).
export const SHELVES = [
  { key: 'popular', title: 'Popular right now', emoji: '🔥', query: GENRES.fiction.query, genre: 'fiction', category: 'Genres' },
  { key: 'fantasy', title: 'Fantasy', emoji: '🐉', query: GENRES.fantasy.query, genre: 'fantasy', category: 'Genres' },
  { key: 'romance', title: 'Romance', emoji: '💌', query: GENRES.romance.query, genre: 'romance', category: 'Genres' },
  { key: 'mystery', title: 'Mystery', emoji: '🔎', query: GENRES.mystery.query, genre: 'mystery', category: 'Genres' },
  { key: 'booker', title: 'Booker Prize winners', emoji: '🏆', query: '"booker prize"', genre: null, category: 'Awards' },
  { key: 'pulitzer', title: 'Pulitzer Prize fiction', emoji: '🥇', query: '"pulitzer prize" fiction', genre: null, category: 'Awards' },
]

// A genre from the URL. Genres not in the list still work: their query is built from the name.
export function genreInfo(slug) {
  const key = String(slug || '').toLowerCase()
  if (GENRES[key]) return GENRES[key]
  const name = key.replace(/-/g, ' ')
  return { title: name.charAt(0).toUpperCase() + name.slice(1), emoji: '📚', query: `${name} novel` }
}
