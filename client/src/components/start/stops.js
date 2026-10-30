// Scaffolded with AI assistance — see AI_USAGE.md
// The landing page's town: one place per building, each with a scene made from the app's own
// art and a few words on what you do there. Every scene piece gives its size in art pixels and a
// whole-number `scale` (or a fraction for the big building pictures) so the pixels stay square;
// the scene lines the pieces up along the ground in front of its `backdrop`.
import { PLACES } from '@/town/places.js'

const ART = {
  house: {
    // a big bookcase with the reader's three shelves (StartBookcase)
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

// Each place is named by what you do there with books, so a visitor can tell at a glance it is a
// reading app. The town keeps its own names (places.js).
const COPY = {
  house: {
    heading: 'Your bookshelf',
    line: 'Every book you want to read, are reading and have finished, on one shelf in your room.',
    points: ['Sort books into Want to read, Reading and Finished', 'Track how far through each book you are', 'Decorate the room around it; friends can visit'],
  },
  library: {
    heading: 'Find your next book',
    line: 'Browse a shelf for every genre, or search for any title.',
    points: ['Search for any book by its title', 'Scan a cover with your camera to find it', 'Put it on your shelf in one tap'],
  },
  cafe: {
    heading: 'Meet other readers',
    line: 'Find readers who read what you read, and say hi.',
    points: ['See your reading match with each reader', 'Browse their shelves for ideas', 'Visit their room and leave a note'],
  },
  salon: {
    heading: 'Make it you',
    line: 'Style your town character and set up your profile.',
    points: ['Change your hair, skin and outfit', 'Pick the genres you love', 'Choose whether other readers can find you'],
  },
}

export const STOPS = PLACES.map((place) => ({
  id: place.id,
  title: place.name,
  tab: place.tab,
  accent: place.accent,
  art: ART[place.id],
  ...COPY[place.id],
}))
