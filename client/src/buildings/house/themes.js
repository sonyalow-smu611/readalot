// Scaffolded with AI assistance — see AI_USAGE.md
// Each house's look. A theme gives the colours the room paints itself (wall, ceiling, skirting
// board, floor) and, in `sprites`, the room's pieces it swaps for its own versions (curtains,
// bedding, lamps, rug): { 'curtain-left': 'curtain-left-navy', … }. My Room is Peach, the room's
// own colours; each reader in visitors.js names theirs.
export const THEMES = {
  peach: {
    name: 'Peach',
    wall: '#f9dec1', wallShade: '#f3cdae', wallDeep: '#e8bf9f', ceiling: '#f3d2b4',
    skirting: '#f3eee0', skirtingShade: '#d9c2a2',
    floor: '#b0b39c', floorShade: '#9c9f88', floorLine: '#8f927c', floorLight: '#c2c4ae',
    sprites: {},
  },
  'rose-garden': {
    name: 'Rose garden',
    wall: '#f4d6d6', wallShade: '#ecc3c3', wallDeep: '#dfb0b0', ceiling: '#efcaca',
    skirting: '#fbf3ee', skirtingShade: '#dcc0b8',
    floor: '#c9a27a', floorShade: '#b08a64', floorLine: '#9e7a56', floorLight: '#d8b48e',
    sprites: {
      'curtain-left': 'curtain-left-sage', 'curtain-right': 'curtain-right-sage',
      bed: 'bed-floral',
      'floor-lamp': 'floor-lamp-white', 'floor-lamp-lit': 'floor-lamp-white-lit', 'table-lamp': 'table-lamp-white', 'table-lamp-lit': 'table-lamp-white-lit',
      rug: 'rug-sage',
    },
  },
  'night-sky': {
    name: 'Night sky',
    wall: '#9aa8c4', wallShade: '#8a98b5', wallDeep: '#7a88a5', ceiling: '#8f9dba',
    skirting: '#e8e6f0', skirtingShade: '#b9b6c9',
    floor: '#7a5d4d', floorShade: '#664c3f', floorLine: '#5a4236', floorLight: '#8c6e5c',
    sprites: {
      'curtain-left': 'curtain-left-navy', 'curtain-right': 'curtain-right-navy',
      bed: 'bed-stars',
      rug: 'rug-navy',
    },
  },
  'tea-room': {
    name: 'Tea room',
    wall: '#cfd9c2', wallShade: '#bfcab1', wallDeep: '#aebba0', ceiling: '#c6d1b8',
    skirting: '#f6f2e6', skirtingShade: '#d6cdb6',
    floor: '#d9c4a0', floorShade: '#c2ab86', floorLine: '#b29b77', floorLight: '#e6d3b2',
    sprites: {
      'curtain-left': 'curtain-left-cream', 'curtain-right': 'curtain-right-cream',
      bed: 'bed-gingham',
      'floor-lamp': 'floor-lamp-white', 'floor-lamp-lit': 'floor-lamp-white-lit', 'table-lamp': 'table-lamp-white', 'table-lamp-lit': 'table-lamp-white-lit',
      rug: 'rug-sage',
    },
  },
  'reading-den': {
    name: 'Reading den',
    wall: '#5f7a62', wallShade: '#546d57', wallDeep: '#48604b', ceiling: '#587259',
    skirting: '#e9e0cc', skirtingShade: '#c4b896',
    floor: '#8a5f45', floorShade: '#74503a', floorLine: '#664532', floorLight: '#9a6f54',
    sprites: {
      'curtain-left': 'curtain-left-mustard', 'curtain-right': 'curtain-right-mustard',
      bed: 'bed-tartan',
      'floor-lamp': 'floor-lamp-green', 'floor-lamp-lit': 'floor-lamp-green-lit', 'table-lamp': 'table-lamp-green', 'table-lamp-lit': 'table-lamp-green-lit',
      rug: 'rug-rust',
    },
  },
}

export const MY_THEME = 'peach'

export function themeOf(id) {
  return THEMES[id] ?? THEMES[MY_THEME]
}
