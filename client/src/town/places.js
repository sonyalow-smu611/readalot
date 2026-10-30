// Scaffolded with AI assistance — see AI_USAGE.md
// The town's layout in map pixels (public/town/map.png is MAP_W x MAP_H). The boxes come from
// `npm --workspace client run draw-map`: when a building moves in the art, paste its new box here.
// The same command writes map-data.json (lamps, windows, water) for the animations; don't edit that.
import { getCurrentlyReading } from '@/lib/readerMatch.js'

export const MAP_W = 3584
export const MAP_H = 2560

// The four buildings. Each opens one teammate's part of the app; x/y/w/h is its tap zone.
export const PLACES = [
  {
    id: 'house',
    name: 'Your house',
    label: 'Your house',
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
    label: 'Library',
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
    label: 'Cafe',
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
    label: 'Hair Salon',
    tab: 'Profile',
    owner: 'Aalric',
    accent: '#9a3f62',
    blurb: 'Change your look and edit your profile.',
    enter: 'Enter the salon',
    route: { name: 'salon' },
    x: 2834, y: 1460, w: 398, h: 432,
  },
]

// Friends' houses: each small house in town is the home of a reader you know (by their reader
// id, see stores/people.js), and tapping it visits their room. `art` names the house in the
// picture (public/town/buildings/<art>.png). Who they are is fetched: nameFriendHouses() puts
// their names on the houses.
const FRIEND_HOMES = [
  { reader: 'emma.reads', art: 'cottage-white', x: 1094, y: 1452, w: 322, h: 312 },
  { reader: 'ayaan.pages', art: 'cottage-brick', x: 1554, y: 1460, w: 322, h: 304 },
  { reader: 'sofia.shelves', art: 'cottage-lilac', x: 18, y: 1484, w: 270, h: 280 },
  { reader: 'noah.bookmarks', art: 'cottage-grey', x: 44, y: 820, w: 309, h: 304 },
  { reader: 'mei.margins', art: 'cottage-green', x: 3116, y: 840, w: 296, h: 284 },
  { reader: 'daniel.dogears', art: 'cottage-rose', x: 1606, y: 103, w: 309, h: 300 },
  { reader: 'priya.pagecount', art: 'cottage-teal', x: 2118, y: 1472, w: 309, h: 292 },
]

export const FRIEND_HOUSES = FRIEND_HOMES.map(({ reader, ...home }) => ({
  id: `friend-${reader}`,
  name: 'A friend’s house',
  tab: 'Friend',
  // the name tag over the roof, once we know whose house it is
  label: '',
  accent: '#5f7f4a',
  blurb: 'A reader you know lives here.',
  enter: 'Visit',
  route: { name: 'reader-room', params: { id: reader } },
  // whose house it is, to match their online status to it (see friends.js)
  reader,
  ...home,
}))

// The friends' houses with their owners' names on, from the readers (stores/people.js). A house
// whose reader isn't among them is left out.
export function nameFriendHouses(readers) {
  return FRIEND_HOUSES.flatMap((house) => {
    const reader = readers.find((r) => r.id === house.reader)
    if (!reader) return []
    const first = reader.displayName.split(' ')[0]
    const book = getCurrentlyReading(reader)
    return [
      {
        ...house,
        name: `${first}'s house`,
        label: first,
        blurb: `${reader.displayName}${reader.tagline ? `: “${reader.tagline}”` : ''}${book ? ` Reading ${book.title} right now.` : ''}`,
        enter: `Visit ${first}`,
      },
    ]
  })
}

// Everything you can tap on the map (the friends' houses not yet named).
export const ALL_PLACES = [...PLACES, ...FRIEND_HOUSES]

// Where the town opens: on the pavement outside your front door.
export const SPAWN = { x: 666, y: 1790 }

// The five characters a reader can pick in the salon (public/town/avatars/<id>.png, 60 x 116).
export const AVATARS = ['rosie', 'maya', 'rex', 'jay', 'nova']
// More people who live in town; they only walk around.
export const TOWNSFOLK = ['theo', 'pip', 'ivy', 'stella', 'leo', 'finn', 'luna', 'fern', 'hazel']

// Everyone wanders the pavements once, each at their own pace (map pixels a second); see roads.js.
export const WALKERS = [...AVATARS, ...TOWNSFOLK].map((avatar, i) => ({ avatar, speed: 48 + ((i * 7) % 18) }))
