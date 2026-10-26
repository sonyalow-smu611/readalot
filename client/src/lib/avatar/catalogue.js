// Scaffolded with AI assistance — see AI_USAGE.md
// Every part a reader can give their character, the five ready-made characters, and the rules
// for turning a saved character (ids only) into the settings drawAvatar() needs.
// Prices live here and nowhere else. price 0 is free; anything else is locked until coins are
// saved (see isUnlocked).
import { shade } from './draw.js'

const CREAM = '#fdf7ec'

// A colour swatch: c is the main colour, s its shadow (worked out when not given).
const swatch = (id, label, c, extra = {}) => ({ id, label, c, s: extra.s ?? shade(c, 0.78), ...extra })

export const SLOTS = [
  { id: 'hair', label: 'Hair style', tab: 'hair' },
  { id: 'hairColour', label: 'Hair colour', tab: 'hair', colour: true },
  { id: 'skin', label: 'Skin tone', tab: 'skin' },
  { id: 'top', label: 'Top', tab: 'outfit' },
  { id: 'topColour', label: 'Top colour', tab: 'outfit', colour: true },
  { id: 'bottom', label: 'Bottoms', tab: 'outfit' },
  { id: 'bottomColour', label: 'Bottoms colour', tab: 'outfit', colour: true },
  { id: 'shoes', label: 'Shoes', tab: 'outfit' },
  { id: 'shoeColour', label: 'Shoe colour', tab: 'outfit', colour: true },
  { id: 'eyes', label: 'Glasses', tab: 'extras', optional: true },
  { id: 'head', label: 'On your head', tab: 'extras', optional: true },
  { id: 'hairAccessory', label: 'In your hair', tab: 'extras', optional: true },
  { id: 'neck', label: 'Scarf', tab: 'extras', optional: true },
  { id: 'ears', label: 'Earrings', tab: 'extras', optional: true },
  { id: 'bag', label: 'Bag', tab: 'extras', optional: true },
]

export const CATALOGUE = {
  hair: [
    { id: 'long', label: 'Long', price: 0 },
    { id: 'bun', label: 'Bun', price: 0 },
    { id: 'curly', label: 'Curly', price: 0 },
    { id: 'twists', label: 'Twists', price: 0 },
    { id: 'puff', label: 'Puff', price: 0 },
    { id: 'bob', label: 'Bob', price: 120 },
    { id: 'wavy', label: 'Wavy', price: 120 },
    { id: 'messy', label: 'Messy', price: 120 },
    { id: 'short', label: 'Short', price: 120 },
    { id: 'spiky', label: 'Spiky', price: 120 },
    { id: 'mop', label: 'Mop', price: 120 },
  ],
  hairColour: [
    swatch('pink', 'Pink', '#e27aa0', { s: '#b8547a' }),
    swatch('chestnut', 'Chestnut', '#6b4a34', { s: '#4a3122' }),
    swatch('black', 'Black', '#2b2630', { s: '#4a4452', brow: '#2b2630' }),
    swatch('blonde', 'Blonde', '#e8cf8a', { s: '#c9a95e', roots: '#3a2a20', brow: '#3a2a20' }),
    swatch('ginger', 'Ginger', '#c0502f', { s: '#8e3520' }),
    swatch('auburn', 'Auburn', '#b8572f', { s: '#8e3d1e' }),
    swatch('ash', 'Ash brown', '#b49a7a', { s: '#8a7458' }),
    swatch('sandy', 'Sandy', '#c9a95e', { s: '#a8873e' }),
    swatch('honey', 'Honey', '#d9c48a', { s: '#b8a25e' }),
    swatch('lilac', 'Lilac', '#a98ad9'),
  ],
  // Skin tones are always free. Lightest first; each has its own shadow, lips and blush.
  skin: [
    { id: 'tone-1', label: 'Skin tone 1', skin: '#f6dcc6', skinS: '#e0bea2', lips: '#c0566a', blush: '#f2a0b8' },
    { id: 'tone-2', label: 'Skin tone 2', skin: '#f6d6bd', skinS: '#e0b796', lips: '#c0566a', blush: '#f2a0a8' },
    { id: 'tone-3', label: 'Skin tone 3', skin: '#f3d2b8', skinS: '#dcb294', lips: '#a8574f', blush: '#f3d2b8' },
    { id: 'tone-4', label: 'Skin tone 4', skin: '#f1c9a5', skinS: '#d9a982', lips: '#b4554f', blush: '#ebaa98' },
    { id: 'tone-5', label: 'Skin tone 5', skin: '#e8c0a0', skinS: '#cfa07e', lips: '#a8574f', blush: '#e8c0a0' },
    { id: 'tone-6', label: 'Skin tone 6', skin: '#e0b48e', skinS: '#c49470', lips: '#a8574f', blush: '#e88f80' },
    { id: 'tone-7', label: 'Skin tone 7', skin: '#d9a06a', skinS: '#bd8450', lips: '#8a4a3a', blush: '#d9a06a' },
    { id: 'tone-8', label: 'Skin tone 8', skin: '#b5835c', skinS: '#966644', lips: '#7a4232', blush: '#c4876a' },
    { id: 'tone-9', label: 'Skin tone 9', skin: '#8a5a3c', skinS: '#6e452c', lips: '#5e3624', blush: '#8a5a3c' },
    { id: 'tone-10', label: 'Skin tone 10', skin: '#6b4128', skinS: '#54301c', lips: '#4a2418', blush: '#6b4128' },
  ].map((tone) => ({ ...tone, price: 0 })),
  top: [
    { id: 'pinafore', label: 'Pinafore', price: 0, p: { inner: CREAM, sleeve: CREAM } },
    { id: 'puffer', label: 'Puffer jacket', price: 0, p: {} },
    { id: 'coat', label: 'Long coat', price: 0, p: { inner: '#f4efe2' } },
    { id: 'fuzzy', label: 'Fuzzy jumper', price: 0, p: {} },
    { id: 'tee', label: 'T-shirt', price: 150, p: { shortSleeves: true, print: '#e98aa8' } },
    { id: 'tank', label: 'Tank top', price: 150, p: {} },
    { id: 'tube', label: 'Tube top', price: 150, p: {} },
    { id: 'hoodie', label: 'Hoodie', price: 150, p: {} },
    { id: 'vest', label: 'Sweater vest', price: 150, p: { inner: '#f2b8c0', sleeve: '#f2b8c0' } },
    { id: 'sweater', label: 'Flame jumper', price: 150, p: { pattern: '#d9842f' } },
    { id: 'cardigan', label: 'Cardigan', price: 150, p: { inner: '#6b7a3a' } },
    { id: 'blazer', label: 'Blazer', price: 150, p: { inner: CREAM } },
  ],
  topColour: [
    swatch('pink', 'Pink', '#e98aa8', { s: '#c96a88' }),
    swatch('red', 'Red', '#c0392f', { s: '#8e2a22' }),
    swatch('brown', 'Brown', '#8a6448', { s: '#6b4a34' }),
    swatch('mustard', 'Mustard', '#f0c23a', { s: '#c99a1e' }),
    swatch('charcoal', 'Charcoal', '#2b2b33', { s: '#16161c', inner: '#5a6070' }),
    swatch('sage', 'Sage', '#9cc79a', { s: '#6fa06d' }),
    swatch('sky', 'Sky blue', '#8fb8d9'),
    swatch('lilac', 'Lilac', '#b9a0d9'),
    swatch('cream', 'Cream', '#f4efe2', { s: '#d9d0c4' }),
    swatch('navy', 'Navy', '#2f4a7a'),
  ],
  bottom: [
    { id: 'skirt', label: 'Skirt', price: 0, p: { sock: CREAM } },
    { id: 'baggy', label: 'Baggy trousers', price: 0, p: {} },
    { id: 'pants', label: 'Trousers', price: 0, p: {} },
    { id: 'ripped', label: 'Ripped jeans', price: 0, p: {} },
    { id: 'long', label: 'Long skirt', price: 120, p: {} },
    { id: 'cargo', label: 'Cargo trousers', price: 120, p: {} },
  ],
  bottomColour: [
    swatch('cream', 'Cream', CREAM, { s: '#d9d0c4' }),
    swatch('slate', 'Slate', '#6b6e78', { s: '#53565f' }),
    swatch('grey', 'Grey', '#9aa0ab', { s: '#7d838e' }),
    swatch('denim', 'Denim', '#8fa8bf', { s: '#7690a8' }),
    swatch('charcoal', 'Charcoal', '#2b2b33', { s: '#1e1e26' }),
    swatch('khaki', 'Khaki', '#6b5a3e', { s: '#54452f' }),
    swatch('olive', 'Olive', '#6b7a3a', { s: '#53602c' }),
    swatch('plum', 'Plum', '#4a2a6a', { s: '#341c4e' }),
  ],
  shoes: [
    { id: 'trainers', label: 'Trainers', price: 0, p: { sole: CREAM } },
    { id: 'shoes', label: 'Shoes', price: 0, p: { sole: '#4a4452' } },
    { id: 'skaters', label: 'Skate shoes', price: 0, p: { sole: '#5a5a68' } },
    { id: 'boots', label: 'Boots', price: 100, p: { boots: true, sole: '#5a3a24' } },
  ],
  shoeColour: [
    swatch('ink', 'Black', '#2b2230'),
    swatch('pink', 'Pink', '#e98aa8'),
    swatch('brown', 'Brown', '#8a6440'),
    swatch('cream', 'Cream', '#e8dcc0'),
    swatch('grey', 'Grey', '#8a8f99'),
    swatch('red', 'Red', '#c0392f'),
    swatch('sky', 'Pale blue', '#b9c9d3'),
  ],
  eyes: [
    { id: 'shades', label: 'Shades', price: 0, p: { shades: true } },
    { id: 'goggles', label: 'Goggles', price: 0, p: { goggles: true } },
  ],
  // Hats and the hood tuck the hair in, as on the townsfolk who wear them.
  head: [
    { id: 'beanie', label: 'Beanie', price: 100, tucksHair: true, p: { hat: 'beanie', hatC: '#55585f' } },
    { id: 'fedora', label: 'Fedora', price: 150, tucksHair: true, p: { hat: 'fedora', hatC: '#c9a46a', band: '#4a5a3a' } },
    { id: 'hood', label: 'Hood', price: 100, tucksHair: true, p: { hood: '#4a4d55' } },
    { id: 'crown', label: 'Crown', price: 300, p: { crown: '#f6c84a' } },
  ],
  hairAccessory: [
    { id: 'flower-red', label: 'Red flower', price: 0, requires: { hair: ['curly'] }, p: { flower: '#d0453d' } },
    { id: 'flower-pink', label: 'Pink flower', price: 0, requires: { hair: ['curly'] }, p: { flower: '#f2a0b8' } },
    { id: 'clip', label: 'Hair clip', price: 60, p: { clip: '#9fd4b0' } },
    { id: 'sprout', label: 'Sprout', price: 60, p: { sprout: true } },
  ],
  neck: [
    { id: 'scarf-grey', label: 'Grey scarf', price: 0, p: { scarf: '#5a6070' } },
    { id: 'scarf-red', label: 'Red scarf', price: 0, p: { scarf: '#c0392f' } },
    { id: 'scarf-mustard', label: 'Mustard scarf', price: 0, p: { scarf: '#e3b04b' } },
  ],
  ears: [
    { id: 'earring-gold', label: 'Gold earrings', price: 80, p: { earring: '#f6c84a' } },
    { id: 'earring-blue', label: 'Blue earrings', price: 80, p: { earring: '#9fd4ee' } },
  ],
  bag: [{ id: 'tote', label: 'Tote bag', price: 100, p: { bag: '#bcd6e2' } }],
}

// Colour swatches are free.
for (const slot of SLOTS) if (slot.colour) for (const item of CATALOGUE[slot.id]) item.price = 0

const NO_EXTRAS = { eyes: null, head: null, hairAccessory: null, neck: null, ears: null, bag: null }

// The five ready-made characters, matching public/town/avatars/<id>.png exactly. seed is where
// the map script's random numbers stood when it drew each one (curly, puff and fuzzy use them).
export const PRESETS = [
  {
    id: 'rosie',
    label: 'Rosie',
    seed: 23,
    character: { hair: 'long', hairColour: 'pink', skin: 'tone-2', top: 'pinafore', topColour: 'pink', bottom: 'skirt', bottomColour: 'cream', shoes: 'trainers', shoeColour: 'pink', ...NO_EXTRAS },
  },
  {
    id: 'maya',
    label: 'Maya',
    seed: 23,
    character: { hair: 'bun', hairColour: 'chestnut', skin: 'tone-4', top: 'puffer', topColour: 'red', bottom: 'baggy', bottomColour: 'slate', shoes: 'trainers', shoeColour: 'ink', ...NO_EXTRAS },
  },
  {
    id: 'rex',
    label: 'Rex',
    seed: 23,
    character: { hair: 'curly', hairColour: 'black', skin: 'tone-3', top: 'coat', topColour: 'brown', bottom: 'pants', bottomColour: 'grey', shoes: 'shoes', shoeColour: 'ink', ...NO_EXTRAS, eyes: 'shades', hairAccessory: 'flower-red' },
  },
  {
    id: 'jay',
    label: 'Jay',
    seed: 770898176,
    character: { hair: 'twists', hairColour: 'blonde', skin: 'tone-9', top: 'fuzzy', topColour: 'mustard', bottom: 'ripped', bottomColour: 'denim', shoes: 'skaters', shoeColour: 'ink', ...NO_EXTRAS, eyes: 'goggles' },
  },
  {
    id: 'nova',
    label: 'Nova',
    seed: 2095571520,
    character: { hair: 'puff', hairColour: 'ginger', skin: 'tone-8', top: 'puffer', topColour: 'charcoal', bottom: 'baggy', bottomColour: 'charcoal', shoes: 'trainers', shoeColour: 'ink', ...NO_EXTRAS, neck: 'scarf-grey' },
  },
]

export const DEFAULT_PRESET = 'rosie'

export function findItem(slot, id) {
  return CATALOGUE[slot]?.find((item) => item.id === id) ?? null
}

// Until coins are saved, only free items can be chosen.
export function isUnlocked(item) {
  return item.price === 0
}

export function presetCharacter(id) {
  const preset = PRESETS.find((p) => p.id === id) ?? PRESETS.find((p) => p.id === DEFAULT_PRESET)
  return { v: 1, base: preset.id, ...preset.character }
}

// Why an item can't go with the rest of the character, or null when it can.
export function blockedReason(character, slot, id) {
  const item = findItem(slot, id)
  if (!item?.requires) return null
  for (const [other, allowed] of Object.entries(item.requires)) {
    if (!allowed.includes(character[other])) {
      const names = allowed.map((a) => findItem(other, a)?.label.toLowerCase() ?? a).join(' or ')
      return `Only with ${names} ${other === 'hair' ? 'hair' : findSlot(other).label.toLowerCase()}`
    }
  }
  return null
}

function findSlot(id) {
  return SLOTS.find((slot) => slot.id === id)
}

// The character with one slot changed. Extras that no longer fit are taken off.
export function applyChoice(character, slot, id) {
  const next = { ...character, [slot]: id }
  for (const other of SLOTS) {
    if (other.optional && next[other.id] && blockedReason(next, other.id, next[other.id])) next[other.id] = null
  }
  return next
}

// Anything read back from an account becomes a complete, valid character. An unknown, locked or
// clashing part falls back to the base character's part; a bare preset id (e.g. 'maya') works.
// allowLocked keeps locked parts, for drawing a preview of something not yet owned.
export function normaliseCharacter(raw, { allowLocked = false } = {}) {
  if (typeof raw === 'string') return presetCharacter(raw)
  if (!raw || typeof raw !== 'object') return presetCharacter(DEFAULT_PRESET)
  const fallback = presetCharacter(raw.base)
  const out = { v: 1, base: fallback.base }
  for (const slot of SLOTS) {
    const id = raw[slot.id]
    const item = id == null ? null : findItem(slot.id, id)
    if (id == null && slot.optional) out[slot.id] = null
    else out[slot.id] = item && (allowLocked || isUnlocked(item)) ? id : fallback[slot.id]
  }
  for (const slot of SLOTS) {
    if (out[slot.id] && blockedReason(out, slot.id, out[slot.id])) {
      out[slot.id] = slot.optional ? null : fallback[slot.id]
    }
  }
  return out
}

// The random seed to draw this character with, so it always comes out the same.
export function characterSeed(character) {
  return (PRESETS.find((p) => p.id === character.base) ?? PRESETS[0]).seed
}

// The settings drawAvatar() reads. character must be normalised.
export function toDrawParams(character) {
  const pick = (slot) => findItem(slot, character[slot])
  const hairColour = pick('hairColour')
  const topColour = pick('topColour')
  const bottomColour = pick('bottomColour')
  const top = pick('top')
  const { skin, skinS, lips, blush } = pick('skin')
  const p = {
    hair: character.hair,
    hairC: hairColour.c,
    hairS: hairColour.s,
    roots: hairColour.roots ?? hairColour.s,
    skin,
    skinS,
    lips,
    blush,
    top: top.id,
    topC: topColour.c,
    topS: topColour.s,
    ...top.p,
    inner: topColour.inner ?? top.p.inner ?? CREAM,
    bottom: character.bottom,
    botC: bottomColour.c,
    botS: bottomColour.s,
    ...pick('bottom').p,
    shoe: pick('shoeColour').c,
    ...pick('shoes').p,
  }
  if (hairColour.brow) p.brow = hairColour.brow
  for (const slot of SLOTS) {
    if (!slot.optional || !character[slot.id]) continue
    const item = pick(slot.id)
    Object.assign(p, item.p)
    if (item.tucksHair) p.hair = 'tucked'
  }
  return p
}

// The character in words, for screen readers: "Pink long hair, skin tone 2, pink pinafore, …".
export function describeCharacter(character) {
  const label = (slot) => findItem(slot, character[slot])?.label.toLowerCase() ?? ''
  const parts = [
    `${findItem('hairColour', character.hairColour).label} ${label('hair')} hair`,
    label('skin'),
    `${label('topColour')} ${label('top')}`,
    `${label('bottomColour')} ${label('bottom')}`,
    `${label('shoeColour')} ${label('shoes')}`,
  ]
  const extras = SLOTS.filter((slot) => slot.optional && character[slot.id]).map((slot) => label(slot.id))
  return parts.join(', ') + (extras.length ? `, with ${extras.join(' and ')}` : '')
}

// A random look made only of free parts, for "Surprise me". Extras are left off about half the
// time, and anything that clashes (a flower without curly hair) is skipped.
export function randomCharacter(base = DEFAULT_PRESET, random = Math.random) {
  let character = presetCharacter(base)
  for (const slot of SLOTS) {
    const free = CATALOGUE[slot.id].filter(isUnlocked)
    // an optional part with nothing free yet (earrings, bags) stays off
    const id = !free.length || (slot.optional && random() < 0.5) ? null : free[Math.floor(random() * free.length)].id
    if (id === null || !blockedReason(character, slot.id, id)) character = applyChoice(character, slot.id, id)
  }
  return character
}
