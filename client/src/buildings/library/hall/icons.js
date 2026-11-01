// Scaffolded with AI assistance — see AI_USAGE.md
// The library's pixel icons, in place of emoji: each is a tiny bitmap, one letter per pixel,
// with its own colours ('.' is clear). The hall paints them into the wall art (murals.js), and
// the signs and headings show them as pictures (iconUrl), with the town's 1 px outline round them.
import { sprite } from './pixel.js'

const ICONS = {
  trophy: {
    colours: { G: '#f2c94c', H: '#fff4c7', Y: '#b08a3c' },
    rows: ['GGGGGGGGG', 'G.GHGGG.G', 'G.GHGGG.G', '.GGHGGGG.', '..GGGGG..', '...GGG...', '....G....', '..YYYYY..', '..YYYYY..'],
  },
  heart: {
    colours: { R: '#e0526b', W: '#ffd6de' },
    rows: ['.RR...RR.', 'RWRR.RRRR', 'RRRRRRRRR', 'RRRRRRRRR', '.RRRRRRR.', '..RRRRR..', '...RRR...', '....R....'],
  },
  crown: {
    colours: { G: '#e8b84a', Y: '#b08a3c', R: '#d23b5a', B: '#5d8bd8' },
    rows: ['G...G...G', 'GG.GGG.GG', 'GGGGGGGGG', 'GRGGBGGRG', 'GGGGGGGGG', 'YYYYYYYYY'],
  },
  hat: {
    colours: { P: '#7b5bb0', S: '#f7d154', B: '#4e3870' },
    rows: ['.....P...', '....PP...', '...PPS...', '...PPPP..', '..PSPPP..', '..PPPPP..', '.PSSSSSP.', 'BBBBBBBBB'],
  },
  magnifier: {
    colours: { G: '#b08a3c', L: '#9fd3e6', W: '#ffffff', H: '#6b4329' },
    rows: ['.GGGG....', 'GLLLLG...', 'GLWLLG...', 'GLLLLG...', 'GLLLLG...', '.GGGG....', '.....HH..', '......HH.', '.......HH'],
  },
  skull: {
    colours: { W: '#f3eee0', K: '#1e1a24' },
    rows: ['.WWWWWWW.', 'WWWWWWWWW', 'WWWWWWWWW', 'WKKWWWKKW', 'WKKWWWKKW', 'WWWWKWWWW', '.WWWWWWW.', '..WKWKW..', '..WWWWW..'],
  },
  rocket: {
    colours: { R: '#d64545', W: '#e6ebee', B: '#5ec4e6', O: '#f2a93b' },
    rows: ['....R....', '...RWR...', '...WWW...', '...WBW...', '...WWW...', '..RWWWR..', '.RRWWWRR.', '...O.O...', '....O....'],
  },
  hourglass: {
    colours: { W: '#6b4329', G: '#cfe3e6', S: '#e0b65e' },
    rows: ['WWWWWWWWW', '.GSSSSSG.', '..GSSSG..', '...GSG...', '....S....', '...GSG...', '..GGSGG..', '.GSSSSSG.', 'WWWWWWWWW'],
  },
  star: {
    colours: { Y: '#f7d154', O: '#e8a23b' },
    rows: ['....Y....', '....Y....', '...YYY...', 'YYYYYYYYY', '.YYYYYYY.', '..YYYYY..', '..YOOOY..', '.YO...OY.', '.O.....O.'],
  },
  quill: {
    colours: { W: '#fdf7ec', G: '#c9b48a', K: '#1e1a24' },
    rows: ['......WWW', '.....WWWW', '....WWWW.', '...WWWG..', '..WWWG...', '..WGG....', '.KG......', '.K.......', 'K........'],
  },
  bubble: {
    colours: { W: '#ffffff', K: '#1e1a24' },
    rows: ['.WWWWWWW.', 'WWWWWWWWW', 'WWKWKWKWW', 'WWWWWWWWW', '.WWWWWWW.', '..WW.....', '.W.......'],
  },
  bell: {
    colours: { G: '#e0b65e', H: '#fff1b8', Y: '#8a5a3a' },
    rows: ['....G....', '...GGG...', '..GHGGG..', '..GHGGG..', '..GGGGG..', '.GGGGGGG.', 'GGGGGGGGG', 'YYYYYYYYY'],
  },
  camera: {
    colours: { G: '#5d8b98', K: '#1e1a24', L: '#3f6b78', W: '#ffffff', R: '#d64545' },
    rows: ['.KKK.....', 'GGGGGGGGG', 'GGKKKKGRG', 'GKLLWLKGG', 'GKLLLLKGG', 'GGKKKKGGG', 'GGGGGGGGG'],
  },

  // only in the wall art
  bat: {
    colours: { K: '#6a5a7e', R: '#ff4a52' },
    rows: ['K..K.K..K', 'KK.KKK.KK', 'KKKKRKKKK', '.KK...KK.'],
  },
  castle: {
    colours: { S: '#1b1533', W: '#f7d154' },
    rows: [
      'S.S.......S.S',
      'SSS...S...SSS',
      'SSS..SSS..SSS',
      'SWS.S.S.S.SWS',
      'SSSSSSSSSSSSS',
      'SSSSSWSWSSSSS',
      'SSSSSSSSSSSSS',
      'SSSSS...SSSSS',
      'SSSSS...SSSSS',
    ],
  },
  candle: {
    colours: { F: '#ffb43b', Y: '#fff1b8', C: '#f3eee0', S: '#d6cdb8', B: '#b08a3c' },
    rows: ['..Y..', '.YFY.', '..F..', '.CCS.', '.CCS.', '.CCS.', '.CCS.', 'BBBBB'],
  },
  moon: {
    colours: { M: '#f4efe2', S: '#c9c0ad' },
    rows: ['..MMM.', '.MMS..', 'MMS...', 'MMS...', 'MMS...', '.MMS..', '..MMM.'],
  },
  lightning: {
    colours: { Y: '#f7d154', O: '#e8a23b' },
    rows: ['...YYY', '..YYO.', '.YYO..', 'YYYYYY', '...YO.', '..YO..', '.YO...'],
  },
}

// Paints icon `name` at (X, Y), each of its pixels `k` x `k`, with no outline.
export function drawIcon(ctx, name, X, Y, k = 1) {
  const icon = ICONS[name]
  if (!icon) return
  icon.rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const colour = icon.colours[row[i]]
      if (!colour) continue
      ctx.fillStyle = colour
      ctx.fillRect(X + i * k, Y + j * k, k, k)
    }
  })
}

// The icon's size in pixels, before its outline.
export function iconSize(name) {
  const icon = ICONS[name]
  return icon ? { w: icon.rows[0].length, h: icon.rows.length } : { w: 0, h: 0 }
}

const urls = new Map()

// Icon `name` with the town's outline, as a picture's address (a PNG data URL) for an <img> or a
// CSS background. Empty where the device cannot draw on a canvas: the label still says it all.
export function iconUrl(name) {
  if (!ICONS[name]) return ''
  if (!urls.has(name)) {
    let url = ''
    try {
      const { w, h } = iconSize(name)
      url = sprite(w, h, (ctx) => drawIcon(ctx, name, 0, 0)).toDataURL()
    } catch {
      // no canvas: leave the icon out
    }
    urls.set(name, url)
  }
  return urls.get(name)
}
