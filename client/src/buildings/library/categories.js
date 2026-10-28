// Scaffolded with AI assistance — see AI_USAGE.md
// The library's bookcases: one per category, left to right in the hall.
//   key     id, also seeds the bookcase's spines so it looks the same every visit
//   label   the name plate on the bookcase and the button in the bar of places
//   title   the heading when the bookcase is opened
//   query   the Google Books search that fills it (plain words work better than `subject:`)
//   genre   the /discover/:genre page its "See all" opens (null: no See all)
//   spines  the colours its books are drawn in
export const CATEGORIES = [
  {
    key: 'popular',
    label: 'Popular',
    title: 'Popular right now',
    emoji: '🔥',
    query: 'bestselling fiction',
    genre: 'fiction',
    spines: ['#c0563f', '#e0b65e', '#7f9bb0', '#f3eee0', '#3b342a'],
  },
  {
    key: 'fantasy',
    label: 'Fantasy',
    title: 'Fantasy',
    emoji: '🐉',
    query: 'fantasy novel',
    genre: 'fantasy',
    spines: ['#5b4a7e', '#7f9a62', '#2f4f5e', '#b48a3c', '#8e6fa8'],
  },
  {
    key: 'romance',
    label: 'Romance',
    title: 'Romance',
    emoji: '💌',
    query: 'romance novel',
    genre: 'romance',
    spines: ['#e6a68d', '#c45b6c', '#f2c7b4', '#b4836a', '#f0d6dc'],
  },
  {
    key: 'mystery',
    label: 'Mystery',
    title: 'Mystery',
    emoji: '🔎',
    query: 'mystery thriller novel',
    genre: 'mystery',
    spines: ['#2b3346', '#51543f', '#7a2e2e', '#6e6a62', '#1e2a2f'],
  },
  {
    key: 'scifi',
    label: 'Sci-fi',
    title: 'Science fiction',
    emoji: '🚀',
    query: 'science fiction novel',
    genre: 'science-fiction',
    spines: ['#3f6b78', '#8fb5b0', '#c9d3d6', '#4a4f6b', '#e08a3c'],
  },
  {
    key: 'history',
    label: 'History',
    title: 'History',
    emoji: '🏛️',
    query: 'history',
    genre: 'history',
    spines: ['#94755c', '#d2ac72', '#6b4329', '#a8483a', '#c9b48a'],
  },
  {
    key: 'classics',
    label: 'Classics',
    title: 'Classics',
    emoji: '📜',
    query: 'classic literature',
    genre: 'classics',
    spines: ['#5a2a27', '#2d4a3a', '#1f2f4a', '#7a5d4d', '#b8963e'],
  },
  {
    key: 'awards',
    label: 'Awards',
    title: 'Prize winners',
    emoji: '🏆',
    query: '"booker prize"',
    genre: null,
    spines: ['#d9b25f', '#1f2f4a', '#f3eee0', '#5a2a27', '#2d4a3a'],
  },
]

export function categoryByKey(key) {
  return CATEGORIES.find((category) => category.key === key) ?? null
}
