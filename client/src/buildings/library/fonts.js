// Scaffolded with AI assistance — see AI_USAGE.md
// The pixel fonts the genre signs are lettered in (categories.js `sign.font`), all free on
// Google Fonts. They load once, the first time the library opens; until then (or offline) the
// signs fall back to the app's own bold title font.
const FAMILIES = [
  'Pixelify Sans:wght@600',
  'Jacquarda Bastarda 9',
  'Jacquard 12',
  'Jacquard 24',
  'VT323',
  'Workbench',
  'Press Start 2P',
  'Handjet:wght@500',
  'Jersey 15',
]

const ID = 'library-genre-fonts'
const HREF = `https://fonts.googleapis.com/css2?${FAMILIES.map((family) => `family=${family.replace(/ /g, '+')}`).join('&')}&display=swap`

export function loadGenreFonts() {
  if (document.getElementById(ID)) return
  const link = document.createElement('link')
  link.id = ID
  link.rel = 'stylesheet'
  link.href = HREF
  document.head.append(link)
}
