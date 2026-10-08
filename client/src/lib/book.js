// Scaffolded with AI assistance — see AI_USAGE.md
// The one shared "book shape" plus the deterministic visual rules that make a shelf of
// spines look hand-arranged. Every book component (spine, peek, featured, open) reads from
// here so mock JSON and future Google Books data render identically.

const MIN_PAGES = 180
const MAX_PAGES = 830
const MIN_SPINE_WIDTH = 22
const MAX_SPINE_WIDTH = 56
const BASE_SPINE_HEIGHT = 172
const SPINE_HEIGHT_VARIATION = 17 // 0–16px inclusive

// Small, stable string hash (djb2). Same title always yields the same number, so a book
// keeps its look between renders and page loads.
function hashString(value = '') {
  let hash = 5381
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i)
  }
  return Math.abs(hash)
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/**
 * Normalise any raw book (the API's Book shape, or mock JSON) into one shape. API fields are
 * kept as they are; `cover` and `rating` are the names the shelf components read.
 */
export function normalizeBook(raw = {}) {
  const authors = Array.isArray(raw.authors)
    ? raw.authors
    : raw.author
      ? [raw.author]
      : ['Unknown']
  const genres = Array.isArray(raw.genres) ? raw.genres : raw.genre ? [raw.genre] : []

  const cover = raw.cover || raw.coverUrl || raw.thumbnail || ''
  const rating = Number(raw.rating ?? raw.averageRating) || 0

  return {
    ...raw,
    id: raw.id ?? `bk-${hashString(raw.title ?? '')}`,
    title: raw.title ?? 'Untitled',
    authors,
    cover,
    coverUrl: cover,
    description: raw.description ?? '',
    genres,
    pageCount: Number(raw.pageCount) || 0,
    rating,
    averageRating: rating,
    publishedYear: raw.publishedYear ?? null,
    status: raw.status === 'tbr' ? 'want_to_read' : (raw.status ?? 'want_to_read'),
    progress: Number(raw.progress) || 0,
  }
}

export function primaryAuthor(book) {
  return book.authors?.[0] ?? 'Unknown'
}

export function hasCover(book) {
  return Boolean(book.cover)
}

/** Spine width grows with page count, so thick books look thick. */
export function spineWidth(book) {
  const t = clamp((book.pageCount - MIN_PAGES) / (MAX_PAGES - MIN_PAGES), 0, 1)
  return Math.round(MIN_SPINE_WIDTH + t * (MAX_SPINE_WIDTH - MIN_SPINE_WIDTH))
}

/** Spine height varies only slightly, so a row still reads as one shelf. */
export function spineHeight(book) {
  return BASE_SPINE_HEIGHT + (hashString(book.title) % SPINE_HEIGHT_VARIATION)
}

// Most books stand straight. A few tip by two degrees, chosen deterministically.
export function spineLean(book) {
  const h = hashString(`${book.title}~lean`) % 10
  if (h === 0) return -2
  if (h === 1) return 2
  return 0
}

/** Rating rounded to whole stars for the open spread. */
export function ratingStars(book) {
  return Math.round(book.rating)
}
