// Scaffolded with AI assistance — see AI_USAGE.md
// The library's bookcases: one per genre, left to right in the hall. These are the most read
// genres of 2025 (Goodreads' Reading Challenge lists and Circana's US print sales; see the
// library README), so the shelves match what readers look for.
//   key     id, also seeds the bookcase's spines so it looks the same every visit
//   label   the sign over the bookcase and the place in the Places menu
//   title   the heading when the bookcase is opened, and its button's name
//   icon    its pixel icon (hall/icons.js), on the sign and the heading
//   query   the Google Books search that fills it (plain words work better than `subject:`)
//   spines  the colours its books are drawn in
//   wood    the bookcase's colours: its frame, the frame's light and dark edges, and the back
//   sign    the sign's look: its board, its lettering, a pixel font with the genre's feel
//           (fonts.js loads them), how big that font is drawn next to the others (some pixel
//           fonts run small) and an optional shadow on the letters
//   wall      the art on the wall behind it (hall/murals.js)
//   backdrop  the colour of that wall, behind the art and behind the opened bookcase
//   props     pixel icons (hall/icons.js) that stand among its books when it is opened
export const CATEGORIES = [
  {
    key: 'romance',
    label: 'Romance',
    title: 'Romance',
    icon: 'heart',
    query: 'romance novel',
    spines: ['#e6a68d', '#c45b6c', '#f2c7b4', '#e88aa0', '#f0d6dc'],
    wood: { frame: '#d98ca0', light: '#eeb0c0', dark: '#b5677d', back: '#6e3344' },
    sign: { board: '#f7d3dc', ink: '#a8324f', font: "'Pixelify Sans'", size: 1 },
    wall: 'romance',
    backdrop: '#f6d6dc',
    props: ['heart', 'candle', 'star'],
  },
  {
    key: 'romantasy',
    label: 'Romantasy',
    title: 'Romantasy',
    icon: 'crown',
    query: 'romantasy fantasy romance novel',
    spines: ['#7a2e4a', '#d9b25f', '#c98a78', '#4a2c5a', '#e2ae98'],
    wood: { frame: '#c98a78', light: '#e2ae98', dark: '#9c6150', back: '#43283a' },
    sign: { board: '#43283a', ink: '#f0d48a', font: "'Jacquarda Bastarda 9'", size: 1.35, shadow: '0 2px 0 #7a2e4a' },
    wall: 'romantasy',
    backdrop: '#4a2c45',
    props: ['crown', 'heart', 'star'],
  },
  {
    key: 'fantasy',
    label: 'Fantasy',
    title: 'Fantasy',
    icon: 'hat',
    query: 'fantasy novel',
    spines: ['#5b4a7e', '#7f9a62', '#2f4f5e', '#b48a3c', '#8e6fa8'],
    wood: { frame: '#6b4f8f', light: '#8a6db0', dark: '#4e3870', back: '#251b38' },
    sign: { board: '#2f2450', ink: '#e8d9ff', font: "'Jacquard 12'", size: 1.35, shadow: '0 0 6px #b9a6e8' },
    wall: 'fantasy',
    backdrop: '#2f2450',
    props: ['hat', 'moon', 'star'],
  },
  {
    key: 'mystery',
    label: 'Mystery & Thriller',
    title: 'Mystery & Thriller',
    icon: 'magnifier',
    query: 'mystery thriller novel',
    spines: ['#2b3346', '#51543f', '#7a2e2e', '#6e6a62', '#1e2a2f'],
    wood: { frame: '#34405e', light: '#4a5878', dark: '#232c44', back: '#141a28' },
    sign: { board: '#f3eee0', ink: '#1e2a3f', font: "'VT323'", size: 1.3 },
    wall: 'mystery',
    backdrop: '#c49a6c',
    props: ['magnifier', 'candle', 'hourglass'],
  },
  {
    key: 'horror',
    label: 'Horror',
    title: 'Horror',
    icon: 'skull',
    query: 'horror novel',
    spines: ['#2a2226', '#5a1e22', '#3d3d42', '#8a1f24', '#1a1517'],
    wood: { frame: '#3a2226', light: '#5a2e33', dark: '#24151a', back: '#0f0809' },
    sign: { board: '#14090b', ink: '#d8262e', font: "'Jacquard 24'", size: 1.45, shadow: '0 3px 0 #4a0a0e' },
    wall: 'horror',
    backdrop: '#241a2a',
    props: ['skull', 'bat', 'candle'],
  },
  {
    key: 'scifi',
    label: 'Sci-Fi',
    title: 'Science Fiction',
    icon: 'rocket',
    query: 'science fiction novel',
    spines: ['#3f6b78', '#8fb5b0', '#c9d3d6', '#4a4f6b', '#e08a3c'],
    wood: { frame: '#7d8a94', light: '#a3b0b8', dark: '#56626c', back: '#16242c' },
    sign: { board: '#0f1d26', ink: '#6ff0d8', font: "'Workbench'", size: 1.1, shadow: '0 0 6px #2fb8a0' },
    wall: 'scifi',
    backdrop: '#121f33',
    props: ['rocket', 'star', 'lightning'],
  },
  {
    key: 'historical',
    label: 'Historical Fiction',
    title: 'Historical Fiction',
    icon: 'hourglass',
    query: 'historical fiction novel',
    spines: ['#94755c', '#d2ac72', '#6b4329', '#a8483a', '#c9b48a'],
    wood: { frame: '#5e3d26', light: '#7a5235', dark: '#43291a', back: '#24150c' },
    sign: { board: '#e3cfa0', ink: '#4a2c17', font: "'Jacquard 12'", size: 1.35 },
    wall: 'historical',
    backdrop: '#e3cfa0',
    props: ['hourglass', 'candle', 'quill'],
  },
  {
    key: 'ya',
    label: 'Young Adult',
    title: 'Young Adult',
    icon: 'star',
    query: 'young adult novel',
    spines: ['#f28c6b', '#5ec4b6', '#f7d154', '#9b7fd4', '#ef6f9b'],
    wood: { frame: '#4bb3a8', light: '#79d0c6', dark: '#2f8a80', back: '#1c4148' },
    sign: { board: '#ffe86b', ink: '#3b2a7a', font: "'Press Start 2P'", size: 0.7, shadow: '2px 2px 0 #ef6f9b' },
    wall: 'ya',
    backdrop: '#fbe9d0',
    props: ['star', 'heart', 'lightning'],
  },
  {
    key: 'memoir',
    label: 'Memoir',
    title: 'Memoir & Biography',
    icon: 'quill',
    query: 'memoir biography',
    spines: ['#b07d4f', '#e6dccb', '#5a6b7a', '#8a3d32', '#d2ac72'],
    wood: { frame: '#b07d4f', light: '#c99a6b', dark: '#8a5d36', back: '#4a311b' },
    sign: { board: '#fdf7ec', ink: '#4a311b', font: "'Handjet'", size: 1.2 },
    wall: 'memoir',
    backdrop: '#efe3cc',
    props: ['quill', 'candle', 'hourglass'],
  },
  {
    key: 'graphic',
    label: 'Graphic Novels',
    title: 'Graphic Novels & Manga',
    icon: 'bubble',
    query: 'graphic novel manga',
    spines: ['#e53b3b', '#2f6fd6', '#f7d154', '#1e1a24', '#f3eee0'],
    wood: { frame: '#f2c94c', light: '#f8de85', dark: '#c9a12a', back: '#25336e' },
    sign: { board: '#e53b3b', ink: '#fffbe8', font: "'Jersey 15'", size: 1.25, shadow: '2px 2px 0 #1e1a24' },
    wall: 'graphic',
    backdrop: '#fff4c7',
    props: ['bubble', 'lightning', 'star'],
  },
]

// The library's own bookcase, for books from no one genre (search results): the hall's wood
// and the colours of its old spines.
export const HALL_CASE = {
  key: 'hall',
  spines: ['#c0563f', '#e0b65e', '#3f6b78', '#5b4a7e', '#7f9a62', '#2d4a3a', '#94755c'],
  wood: { frame: '#8a5a3a', light: '#a8744d', dark: '#6b4329', back: '#3a2416' },
  props: ['bell', 'hourglass', 'quill', 'candle'],
}

export function categoryByKey(key) {
  return CATEGORIES.find((category) => category.key === key) ?? null
}
