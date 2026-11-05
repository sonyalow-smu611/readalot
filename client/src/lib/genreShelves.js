// Scaffolded with AI assistance — see AI_USAGE.md
// The genres a reader can name as a favourite are the library's genre bookcases, and nothing else:
// each one stands for a bookcase, so a favourite can open it. What is saved on a profile
// (profiles.favorite_genres) is the bookcase's name in the library, e.g. "Mystery & Thriller".
// database/favourite_genres_shelves.sql turns older saved names into these and keeps the column to
// these; ALIASES here is the same mapping, so a profile that hasn't been updated yet still reads
// right.
import { CATEGORIES } from '@/buildings/library/categories.js'

// the bookcases, without Bestsellers (a list of this week's books, not a genre)
export const GENRE_SHELVES = CATEGORIES.filter((category) => category.source !== 'bestsellers')

// what the buttons say and what is saved, in the order the hall stands them
export const GENRE_NAMES = GENRE_SHELVES.map((category) => category.label)

// older names that belong on a bookcase; names like Classic or Self-Help have none and are dropped
const ALIASES = {
  'science fiction': 'scifi',
  'sci fi': 'scifi',
  mystery: 'mystery',
  thriller: 'mystery',
  'mystery thriller': 'mystery',
  'memoir biography': 'memoir',
  biography: 'memoir',
  history: 'historical',
  'magical realism': 'fantasy',
  'graphic novels manga': 'graphic',
  'graphic novel': 'graphic',
  'young adult fiction': 'ya',
}

const simple = (name) => String(name ?? '').toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim()

const byName = new Map()
for (const category of GENRE_SHELVES) {
  for (const name of [category.label, category.title, category.key]) byName.set(simple(name), category)
}
for (const [name, key] of Object.entries(ALIASES)) {
  byName.set(simple(name), GENRE_SHELVES.find((category) => category.key === key))
}

// The bookcase a saved genre stands for, or null for a genre the library has no bookcase for.
export function shelfOf(name) {
  return byName.get(simple(name)) ?? null
}

// A saved list as it should read now: each name as its bookcase's name, once, with the ones that
// have no bookcase left out.
export function cleanGenres(list) {
  const names = []
  for (const name of Array.isArray(list) ? list : []) {
    const shelf = shelfOf(name)
    if (shelf && !names.includes(shelf.label)) names.push(shelf.label)
  }
  return names
}
