// Scaffolded with AI assistance — see AI_USAGE.md
// The town's layout in map pixels (public/town/map.png is MAP_W x MAP_H). The boxes come from
// `npm --workspace client run draw-map`: when a building moves in the art, paste its new box here.

export const MAP_W = 3584
export const MAP_H = 2560

// The four buildings. Each opens one teammate's part of the app; x/y/w/h is its tap zone.
export const PLACES = [
  {
    id: 'house',
    name: 'Your house',
    tab: 'My Room',
    owner: 'Sonz',
    accent: '#4a7fb0',
    blurb: 'Your own room: your bookshelf, what you are reading, and your decorations.',
    enter: 'Go inside',
    route: { name: 'house' },
    x: 441, y: 1360, w: 450, h: 404,
  },
  {
    id: 'library',
    name: 'Library',
    tab: 'Discover',
    owner: 'Aasim',
    accent: '#3f6b78',
    blurb: 'Shelves of every genre, and a help desk that can find any book.',
    enter: 'Enter the library',
    route: { name: 'library' },
    x: 492, y: 608, w: 552, h: 516,
  },
  {
    id: 'cafe',
    name: 'Cafe',
    tab: 'Social',
    owner: 'Emiley',
    accent: '#a8483a',
    blurb: 'Meet readers nearby, see who shares your taste, and visit their rooms.',
    enter: 'Enter the cafe',
    route: { name: 'cafe' },
    x: 2194, y: 752, w: 398, h: 372,
  },
  {
    id: 'salon',
    name: 'Hair Salon',
    tab: 'Profile',
    owner: 'Aalric',
    accent: '#9a3f62',
    blurb: 'Change your look and edit your profile.',
    enter: 'Enter the salon',
    route: { name: 'salon' },
    x: 2834, y: 1460, w: 398, h: 432,
  },
]

// Where the town opens: on the pavement outside your front door.
export const SPAWN = { x: 666, y: 1790 }

// The five characters (public/town/avatars/<id>.png, 56 x 112).
export const AVATARS = ['rosie', 'maya', 'rex', 'jay', 'nova']

// Readers walking the pavements. Each loops through its points and back to the first.
export const WALKERS = [
  { avatar: 'rosie', speed: 60, points: [[60, 1140], [3500, 1140]] },
  { avatar: 'maya', speed: 55, points: [[40, 1780], [1880, 1780]] },
  { avatar: 'rex', speed: 65, points: [[3500, 1292], [60, 1292]] },
  { avatar: 'jay', speed: 50, points: [[1396, 60], [1396, 1100]] },
  { avatar: 'nova', speed: 55, points: [[2060, 1340], [2060, 2520]] },
]
