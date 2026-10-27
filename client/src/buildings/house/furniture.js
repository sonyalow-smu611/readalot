// Scaffolded with AI assistance — see AI_USAGE.md
// The furniture library: pieces drawn in the room's own pixel style (by the art script, into
// public/room/strip/) that the reader buys in the Shop and puts in My Room. The Shop's catalog
// takes these in beside its other decorations.
//
// Each item: `id`, `name`, `group` (its row in the Shop), `price` in credits, `sprite`, and
// `surface`, where it can go:
//   wall    a wall spot (WALL in strip/layout.js); hangs centred on it
//   floor   a spot on the room's floor; stands on it
//   shelf   a small surface: the window seat, side table or nightstand
//   chair   the reading nook, in place of the armchair (one chair at a time)
// `blurb` is the line the Shop shows under it. A cat has `pet: true`: it roams the floor rather
// than standing on a spot, and its sprite is a sheet of frames (walk, step, sit, sleep).
export const FURNITURE = [
  { id: 'poster-mountain', name: 'Mountain poster', group: 'Wall art', price: 25, sprite: 'poster-mountain', surface: 'wall', blurb: 'On the wall' },
  { id: 'poster-moon', name: 'Moon poster', group: 'Wall art', price: 25, sprite: 'poster-moon', surface: 'wall', blurb: 'On the wall' },
  { id: 'poster-book-club', name: 'Book club poster', group: 'Wall art', price: 25, sprite: 'poster-book-club', surface: 'wall', blurb: 'On the wall' },
  { id: 'frame-botanical', name: 'Botanical print', group: 'Wall art', price: 40, sprite: 'frame-botanical', surface: 'wall', blurb: 'On the wall' },
  { id: 'frame-gold', name: 'Gold photo frame', group: 'Wall art', price: 45, sprite: 'frame-gold', surface: 'wall', blurb: 'On the wall' },
  { id: 'chair-wingback', name: 'Wingback chair', group: 'Reading chairs', price: 140, sprite: 'chair-wingback', surface: 'chair', blurb: 'In the reading nook' },
  { id: 'chair-rocking', name: 'Rocking chair', group: 'Reading chairs', price: 120, sprite: 'chair-rocking', surface: 'chair', blurb: 'In the reading nook' },
  { id: 'chair-papasan', name: 'Papasan chair', group: 'Reading chairs', price: 160, sprite: 'chair-papasan', surface: 'chair', blurb: 'In the reading nook' },
  { id: 'plant-monstera', name: 'Monstera', group: 'Plants', price: 60, sprite: 'plant-monstera', surface: 'floor', blurb: 'On the room floor' },
  { id: 'plant-fig', name: 'Fiddle-leaf fig', group: 'Plants', price: 55, sprite: 'plant-fig', surface: 'floor', blurb: 'On the room floor' },
  { id: 'cat-ginger', name: 'Ginger tabby', group: 'Cats', price: 80, sprite: 'cat-ginger', surface: 'floor', pet: true, blurb: 'Roams the floor' },
  { id: 'cat-black', name: 'Black cat', group: 'Cats', price: 85, sprite: 'cat-black', surface: 'floor', pet: true, blurb: 'Roams the floor' },
  { id: 'cat-calico', name: 'Calico', group: 'Cats', price: 90, sprite: 'cat-calico', surface: 'floor', pet: true, blurb: 'Roams the floor' },
  { id: 'plant-succulents', name: 'Succulent trio', group: 'Plants', price: 30, sprite: 'plant-succulents', surface: 'shelf', blurb: 'On the window seat, side table or nightstand' },
]

export function furnitureSprite(id) {
  return FURNITURE.find((item) => item.id === id)?.sprite ?? null
}
