// Scaffolded with AI assistance — see AI_USAGE.md
// The landing page's tour: one stop per building, then Scan a book. Each stop's scene is made
// from the app's own art. Every piece gives its size in art pixels and a whole-number `scale`
// (or a fraction for the big building pictures) so the pixels stay square; the scene lines the
// pieces up along the ground in front of its `backdrop`.
import { PLACES } from '@/town/places.js'

const ART = {
  house: {
    // a big bookcase with the reader's three shelves (StartBookcase), filling the stop
    bookcase: true,
  },
  library: {
    backdrop: { src: '/town/buildings/library.png', w: 636, h: 532, scale: 0.5 },
    // book piles either side of the door, and readers coming and going through it
    spread: true,
    walkers: [
      { id: 'theo', to: 70 },
      { id: 'fern', to: 390, in: true },
      { id: 'hazel', to: 400 },
      { id: 'pip', to: 60, in: true },
    ],
    pieces: [
      { src: '/room/strip/book-pile-floor.png', w: 26, h: 32, scale: 3 },
      { src: '/room/strip/book-stack.png', w: 20, h: 16, scale: 3 },
    ],
  },
  cafe: {
    // readers chatting over books at tables outside (StartCafeScene)
    cafe: true,
  },
  salon: {
    // inside the salon, a reader trying on looks (StartSalonScene)
    salon: true,
  },
}

// Little things from the room that float in the corners of each stop's screen.
const sprite = (name, w, h) => ({ src: `/room/strip/${name}.png`, w, h, scale: 3 })
const STAR = sprite('hang-star', 15, 15)
const HEART = sprite('hang-heart', 15, 14)
const CLOUD = sprite('hang-cloud', 20, 12)
const MOON = sprite('hang-moon', 13, 16)
const BOOKS = sprite('book-stack', 20, 16)
const OPEN_BOOK = sprite('open-book', 26, 10)
const MUG = sprite('mug', 12, 11)
const PLANT = sprite('plant-pot-small', 18, 22)
const FLOWERS = sprite('vase-flowers', 18, 30)

const DECOR = {
  house: [HEART, CLOUD, PLANT, STAR],
  library: [BOOKS, STAR, OPEN_BOOK, MOON],
  cafe: [MUG, HEART, CLOUD, FLOWERS],
  salon: [STAR, FLOWERS, HEART, MOON],
  scan: [OPEN_BOOK, STAR, BOOKS, CLOUD],
}

// Each stop's screen is a different corner of town at a different time of day, drawn the same
// way so they belong together: a sky (top, middle, horizon), a sun low or high in it, and along
// the bottom either a street of houses (StartStreet) or a strip of the town map (StartMapBand)
// with townsfolk about. Map spots and people are in map pixels.
const SCENES = {
  house: {
    // golden hour on your street
    sky: ['#24395a', '#3f6c98', '#f2c48d'],
    sun: { x: '80%', y: '60%', size: 170, colour: '#ffd98a' },
    scenery: { type: 'street', houses: ['cottage-white', 'house', 'cottage-lilac', 'cottage-green', 'cottage-brick'], walkers: ['maya', 'pip'] },
  },
  library: {
    // a misty morning at the campsite in the woods
    sky: ['#1f3a42', '#467d8a', '#cfe3d6'],
    sun: { x: '46%', y: '16%', size: 110, colour: '#fff3c9' },
    scenery: {
      type: 'map',
      focus: { x: 900, bottom: 690 },
      people: [{ id: 'theo', x: 330, y: 480 }, { id: 'fern', x: 450, y: 480 }, { id: 'hazel', x: 1100, y: 520, pace: 160 }],
    },
  },
  cafe: {
    // dusk in the fountain square, outside the cafe
    sky: ['#341a26', '#83393a', '#f0a06c'],
    sun: { x: '64%', y: '66%', size: 200, colour: '#ff9a6a' },
    scenery: {
      type: 'map',
      focus: { x: 1950, bottom: 1120 },
      people: [{ id: 'ivy', x: 2050, y: 1080 }, { id: 'leo', x: 2190, y: 1090 }, { id: 'pip', x: 1740, y: 980, pace: 220 }],
    },
  },
  salon: {
    // a pink sunset by the lake and the lighthouse
    sky: ['#33203f', '#87466f', '#f5b3b3'],
    sun: { x: '36%', y: '12%', size: 100, colour: '#ffe0e6' },
    scenery: {
      type: 'map',
      focus: { x: 950, bottom: 2560 },
      people: [{ id: 'nova', x: 765, y: 2150 }, { id: 'rex', x: 1340, y: 2330 }, { id: 'luna', x: 320, y: 2510, pace: 200 }],
    },
  },
  scan: {
    // a fresh morning on the farm by the waterfall
    sky: ['#24402f', '#557a45', '#dbe8b4'],
    sun: { x: '85%', y: '20%', size: 130, colour: '#fff6b8' },
    scenery: {
      type: 'map',
      focus: { x: 2670, bottom: 800 },
      people: [{ id: 'jay', x: 2795, y: 470 }, { id: 'stella', x: 3150, y: 640 }, { id: 'finn', x: 2350, y: 440, pace: 180 }],
    },
  },
}

// The card for the "Get to know the town" row: its building and a resident standing in front.
const HEADLINES = {
  house: { headline: 'Every book you read, on your shelf.', card: { building: 'house', resident: 'rosie' } },
  library: { headline: 'Find your next favourite book.', card: { building: 'library', resident: 'theo' } },
  cafe: { headline: 'Meet readers who love your books.', card: { building: 'cafe', resident: 'ivy' } },
  salon: { headline: 'Make the reader in your room.', card: { building: 'salon', resident: 'nova' } },
  scan: { headline: 'Snap a cover, shelve the book.', card: { building: '', resident: 'jay' } },
}

// The landing page names each stop by what you do there with books, not by its building, so a
// visitor can tell at a glance it is a reading app. The town keeps its own names (places.js).
const COPY = {
  house: {
    tab: 'Your shelf',
    title: 'Your bookshelf',
    line: 'Keep every book you want to read, are reading and have finished on one shelf.',
    points: ['Sort books into Want to read, Reading and Finished', 'Track how far through each book you are', 'Decorate the room around it; friends can visit'],
  },
  library: {
    tab: 'Find books',
    title: 'The Library',
    line: 'Find your next book by genre, or search for any title.',
    points: ['Browse a shelf for every genre', 'Search for any book by its title', 'Put it on your shelf in one tap'],
  },
  cafe: {
    tab: 'Readers',
    title: 'The Cafe',
    line: 'Meet readers nearby who read what you read.',
    points: ['See how much your shelves match', 'Browse their bookshelves for ideas', 'Leave a note on their board'],
  },
  salon: {
    tab: 'Character',
    title: 'The Salon',
    line: 'Make the character who lives in your reading room.',
    points: ['Start from one of five characters', 'Change their hair, outfit and shoes', 'Pick the genres you love'],
  },
}

export const STOPS = [
  ...PLACES.map((place) => ({
    id: place.id,
    title: place.name,
    tab: place.tab,
    accent: place.accent,
    ...COPY[place.id],
    art: ART[place.id],
    decor: DECOR[place.id],
    ...SCENES[place.id],
    ...HEADLINES[place.id],
  })),
  {
    id: 'scan',
    title: 'Scan a book',
    tab: 'Scan',
    accent: '#5f7f4a',
    line: 'Snap a cover to find the book and add it.',
    points: ['Use the scanner in the Library', 'Point your camera at a cover, or upload a photo', 'Put the book on your shelf'],
    decor: DECOR.scan,
    ...SCENES.scan,
    ...HEADLINES.scan,
    // one book held up to the scanner, cover first
    art: { scan: true },
  },
]
