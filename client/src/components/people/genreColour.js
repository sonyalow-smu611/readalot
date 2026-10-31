// Scaffolded with AI assistance — see AI_USAGE.md
// Each genre's colour on a reader's profile: the first colour the Library's bookcase of that genre
// draws its books in, so a Mystery chip, a Mystery book and the Mystery bookcase all match.
// A genre with no bookcase is plain wood. The label on a chip is whichever of paper and ink reads
// better on it.
import { CATEGORIES } from '@/buildings/library/categories.js'
import { PAL } from '@/buildings/library/hall/palette.js'

const INK = PAL.outline
const PAPER = PAL.paper

const byName = new Map()
for (const category of CATEGORIES) {
  for (const name of [category.label, category.title]) byName.set(name.toLowerCase(), category.spines[0])
}

export function genreColour(genre) {
  return byName.get(String(genre ?? '').trim().toLowerCase()) ?? PAL.wood
}

const channel = (hex, at) => {
  const value = parseInt(hex.slice(at, at + 2), 16) / 255
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}
const luminance = (hex) => 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5)
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

export function labelColour(background) {
  return contrast(background, PAPER) >= contrast(background, INK) ? PAPER : INK
}
