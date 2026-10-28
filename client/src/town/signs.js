// Scaffolded with AI assistance — see AI_USAGE.md
// The big signs over the four main buildings: a bronze frame round a shiny gem in the building's
// accent colour, its name and app section written on the gem, and a motif of its own on top
// (an open book, a coffee cup, a roof, scissors and a comb). The art is SVG built here from
// places.js, so a new accent or name needs no redrawing; the words are live text in Fredoka
// (public/town/signs, SIL Open Font License). Each sign bobs, its gem catches the light, its
// motif moves a little, and after dark the gem glows like a lantern.
import Phaser from 'phaser'
import { SKY_DEPTH } from './sky.js'

// One sign's art, in map pixels; textures are drawn at twice this so they stay sharp up close.
const W = 360
const H = 200
const RES = 2
const FONT = 'Fredoka'
// how long the night glow takes to come and go, like the sky's
const FADE = 1200

const OUTLINE = '#2f1d10'
const BRONZE = '#9b6a3c'
const BRONZE_LIGHT = '#d9a466'
const BRONZE_DARK = '#5e3a1e'

// The four motifs: `art` is drawn with the frame; `parts` are drawn alone so they can move,
// turning on `pivot`; `puffs` is where steam or smoke rises from.
const MOTIFS = {
  library: { art: book, parts: [{ name: 'ribbon', art: ribbon, pivot: [180, 30], swing: 5 }] },
  cafe: { art: cup, puffs: [180, 22, 0xffffff] },
  house: { art: roof, behind: true, puffs: [256, 18, 0xd6d0c8] },
  salon: {
    art: comb,
    parts: [
      { name: 'blade-a', art: (c) => blade(c, false), pivot: [180, 40], snip: 9 },
      { name: 'blade-b', art: (c) => blade(c, true), pivot: [180, 40], snip: -9 },
    ],
  },
}

export function hasSign(place) {
  return Boolean(MOTIFS[place.id])
}

// --- Colours ---------------------------------------------------------------------------------
function mix(hex, toward, amount) {
  const a = Phaser.Display.Color.HexStringToColor(hex)
  const b = Phaser.Display.Color.HexStringToColor(toward)
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, 100, amount * 100)
  return Phaser.Display.Color.RGBToString(Math.round(c.r), Math.round(c.g), Math.round(c.b), 0, '#')
}

function colours(accent) {
  return {
    gem: accent,
    light: mix(accent, '#ffffff', 0.3),
    pale: mix(accent, '#ffffff', 0.55),
    dark: mix(accent, '#000000', 0.35),
    deep: mix(accent, '#000000', 0.6),
  }
}

// --- Art -------------------------------------------------------------------------------------
function svg(body, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W * RES}" height="${H * RES}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${body}</svg>`
}

function dataUrl(markup) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
}

// A bronze curl along the top of the plate, from the motif out to the right (or, flipped, the left).
function curl(flip) {
  const d = 'M218,66 C238,50 266,48 288,58 C304,66 304,46 290,46 C282,46 280,54 286,56'
  const turn = flip ? ` transform="translate(${W},0) scale(-1,1)"` : ''
  return `<g${turn} fill="none" stroke-linecap="round">
    <path d="${d}" stroke="${OUTLINE}" stroke-width="11"/>
    <path d="${d}" stroke="${BRONZE}" stroke-width="6"/>
    <path d="${d}" stroke="${BRONZE_LIGHT}" stroke-width="2" opacity="0.7" transform="translate(-1,-1.5)"/>
  </g>`
}

function frame() {
  return `
    <rect x="22" y="66" width="316" height="108" rx="12" fill="${BRONZE}" stroke="${OUTLINE}" stroke-width="4"/>
    <path d="M32,70 H328" stroke="${BRONZE_LIGHT}" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
    <path d="M32,170 H328" stroke="${BRONZE_DARK}" stroke-width="3" stroke-linecap="round"/>
    <rect x="30" y="74" width="300" height="92" rx="6" fill="${OUTLINE}"/>`
}

// The gem, cut like a cushion: a flat table in the middle and four sloping facets round it.
function gem(c) {
  const defs = `
    <linearGradient id="table" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.light}"/>
      <stop offset="0.55" stop-color="${c.gem}"/>
      <stop offset="1" stop-color="${c.dark}"/>
    </linearGradient>`
  const body = `
    <rect x="33" y="77" width="294" height="86" rx="3" fill="${c.gem}"/>
    <polygon points="33,77 327,77 313,89 47,89" fill="${c.pale}" opacity="0.85"/>
    <polygon points="33,163 327,163 313,151 47,151" fill="${c.deep}"/>
    <polygon points="33,77 47,89 47,151 33,163" fill="${c.dark}"/>
    <polygon points="327,77 313,89 313,151 327,163" fill="${c.deep}" opacity="0.85"/>
    <rect x="47" y="89" width="266" height="62" fill="url(#table)"/>
    <path d="M62,93 Q180,84 298,93 L298,99 Q180,91 62,99 Z" fill="#ffffff" opacity="0.22"/>
    <path d="M96,157 H264" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
    <path d="M316,82 l2,5 l5,2 l-5,2 l-2,5 l-2,-5 l-5,-2 l5,-2 Z" fill="#ffffff" opacity="0.9"/>`
  return svg(body, defs)
}

// Library: an open book standing on the sign.
function book(c) {
  const page = 'M180,62 C162,52 136,50 116,56 L116,24 C136,18 162,20 180,30 Z'
  const cover = 'M180,68 C160,57 132,55 108,61 L108,28 C114,26 118,26 116,30 L116,56 C136,50 162,52 180,62 Z'
  const lines = [32, 40, 48]
    .map((y) => `<path d="M128,${y - 2} C144,${y - 6} 160,${y - 4} 170,${y + 2}" stroke="#b7aa94" stroke-width="2" fill="none" stroke-linecap="round"/>`)
    .join('')
  const half = `<path d="${cover}" fill="${c.dark}" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
    <path d="${page}" fill="#fff8ea" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>${lines}`
  return `${curl(false)}${curl(true)}
    <g>${half}</g><g transform="translate(${W},0) scale(-1,1)">${half}</g>
    <path d="M180,30 V64" stroke="${OUTLINE}" stroke-width="3"/>`
}

// The bookmark ribbon hanging from the book's spine; it sways.
function ribbon() {
  return svg(`<path d="M177,30 H185 L187,74 L181,67 L175,74 Z" fill="#d8503f" stroke="${OUTLINE}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M179,33 V66" stroke="#f08a74" stroke-width="1.5"/>`)
}

// Cafe: a cup of coffee on its saucer, and coffee beans for studs in the corners.
function cup(c) {
  const bean = (x, y, r) => `<g transform="translate(${x},${y}) rotate(${r})">
    <ellipse rx="7" ry="5" fill="#6b3f22" stroke="${OUTLINE}" stroke-width="2"/>
    <path d="M-5,0 C-2,-2 2,2 5,0" stroke="#2f1a0d" stroke-width="1.6" fill="none"/></g>`
  return `${curl(false)}${curl(true)}
    <ellipse cx="180" cy="62" rx="44" ry="8" fill="#fff4e2" stroke="${OUTLINE}" stroke-width="3"/>
    <path d="M206,36 C226,32 228,54 204,54" fill="none" stroke="${OUTLINE}" stroke-width="9" stroke-linecap="round"/>
    <path d="M206,36 C226,32 228,54 204,54" fill="none" stroke="#fff4e2" stroke-width="4" stroke-linecap="round"/>
    <path d="M150,28 H210 L204,52 C200,62 160,62 156,52 Z" fill="#fff4e2" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M153,38 H207 L205,46 H155 Z" fill="${c.gem}"/>
    <ellipse cx="180" cy="28" rx="30" ry="5" fill="#5a3218" stroke="${OUTLINE}" stroke-width="3"/>
    <path d="M160,30 Q170,27 178,29" stroke="#8a5a34" stroke-width="2" fill="none"/>
    ${bean(30, 72, -30)}${bean(330, 72, 30)}${bean(30, 168, 30)}${bean(330, 168, -30)}`
}

// Your house: the sign sits under a little roof with a chimney and a heart in the gable.
function roof(c) {
  const shingles = [30, 42, 54]
    .map((y) => {
      const half = ((y - 14) / 58) * 164
      return `<path d="M${180 - half + 6},${y} H${180 + half - 6}" stroke="${c.deep}" stroke-width="2" opacity="0.6"/>`
    })
    .join('')
  return `
    <rect x="246" y="20" width="22" height="34" fill="#b5654a" stroke="${OUTLINE}" stroke-width="3"/>
    <rect x="242" y="16" width="30" height="8" rx="2" fill="#8c4a35" stroke="${OUTLINE}" stroke-width="3"/>
    <path d="M10,76 L180,10 L350,76 Z" fill="${c.dark}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M40,66 L180,20 L320,66" fill="${c.gem}"/>
    ${shingles}
    <path d="M10,76 L180,10 L350,76" fill="none" stroke="${BRONZE}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M180,58 C164,46 168,32 180,40 C192,32 196,46 180,58 Z" fill="#ffd27a" stroke="${OUTLINE}" stroke-width="2.5" stroke-linejoin="round"/>`
}

// Hair Salon: a comb lying behind the scissors.
function comb(c) {
  const teeth = Array.from({ length: 14 }, (_, i) => 132 + i * 7)
    .map((x) => `<path d="M${x},44 V58" stroke="${OUTLINE}" stroke-width="5" stroke-linecap="round"/><path d="M${x},44 V57" stroke="${c.pale}" stroke-width="2.5" stroke-linecap="round"/>`)
    .join('')
  return `${curl(false)}${curl(true)}${teeth}
    <rect x="126" y="34" width="108" height="13" rx="4" fill="${c.light}" stroke="${OUTLINE}" stroke-width="3"/>`
}

// One half of the scissors: a blade up to one side, a finger ring down the other. `flip` gives
// the other half, which carries the screw they turn on.
function blade(c, flip) {
  const turn = flip ? ` transform="translate(${W},0) scale(-1,1)"` : ''
  const screw = flip ? `<circle cx="180" cy="40" r="4.5" fill="${BRONZE_LIGHT}" stroke="${OUTLINE}" stroke-width="2.5"/>` : ''
  return svg(`<g${turn}>
      <path d="M176,44 L226,4 L230,10 L186,46 Z" fill="#e9eef2" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M180,40 L159,59" stroke="${OUTLINE}" stroke-width="8" stroke-linecap="round"/>
      <path d="M180,40 L159,59" stroke="${c.gem}" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="151" cy="66" r="10" fill="none" stroke="${OUTLINE}" stroke-width="8"/>
      <circle cx="151" cy="66" r="10" fill="none" stroke="${c.gem}" stroke-width="3.5"/>
    </g>${screw}`)
}

// --- Loading ---------------------------------------------------------------------------------
// Queues the font and every sign's pictures; call from the scene's preload.
export function loadSigns(scene, places) {
  scene.load.font(FONT, '/town/signs/fredoka-bold.woff2', 'woff2', { weight: '700' })
  for (const place of places.filter(hasSign)) {
    const c = colours(place.accent)
    const motif = MOTIFS[place.id]
    const art = motif.art(c)
    const body = motif.behind ? `${art}${frame()}` : `${frame()}${art}`
    scene.load.image(`sign-${place.id}`, dataUrl(svg(body)))
    scene.load.image(`sign-${place.id}-gem`, dataUrl(gem(c)))
    for (const part of motif.parts ?? []) scene.load.image(`sign-${place.id}-${part.name}`, dataUrl(part.art(c)))
  }
}

// --- The sign --------------------------------------------------------------------------------
export class Sign {
  // `listen(target)` makes the sign tappable the same way as its building. `index` staggers the
  // signs so they don't all bob, shine and move together.
  constructor(scene, place, { reducedMotion, listen, index = 0 }) {
    this.scene = scene
    this.reducedMotion = reducedMotion
    const c = colours(place.accent)
    const motif = MOTIFS[place.id]
    const local = ([x, y]) => [x - W / 2, y - H / 2]
    const picture = (key) => scene.add.image(0, 0, key).setScale(1 / RES)

    // a soft light behind the sign after dark
    this.glow = scene.add.image(0, 20, 'glow').setScale(4.2, 1.9).setTint(Phaser.Display.Color.HexStringToColor(c.light).color)
    this.glow.setBlendMode(Phaser.BlendModes.ADD).setAlpha(0)
    const board = picture(`sign-${place.id}`)
    this.gem = picture(`sign-${place.id}-gem`)
    // the gem lit from inside: a brighter copy over it, seen at night
    this.lamp = picture(`sign-${place.id}-gem`).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0)
    this.parts = (motif.parts ?? []).map((part) => {
      const [x, y] = local(part.pivot)
      return { ...part, image: picture(`sign-${place.id}-${part.name}`).setOrigin(part.pivot[0] / W, part.pivot[1] / H).setPosition(x, y) }
    })

    const style = { fontFamily: `"${FONT}", system-ui, sans-serif`, fontStyle: '700', color: '#ffffff', stroke: c.deep, align: 'center' }
    const name = scene.add.text(0, 8, place.name.toUpperCase(), { ...style, fontSize: '36px', strokeThickness: 7 })
    const section = scene.add.text(0, 40, place.tab, { ...style, fontSize: '20px', color: '#fff6dc', strokeThickness: 5 })
    for (const text of [name, section]) {
      text.setOrigin(0.5).setResolution(2).setShadow(0, 2, 'rgba(0,0,0,0.35)', 0, true, false)
      text.texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
    }
    // a long name shrinks to fit the gem
    if (name.width > 250) name.setScale(250 / name.width)

    const children = [this.glow, board, this.gem, this.lamp, ...this.parts.map((p) => p.image), name, section]
    // the plate sits on the roof; the motif rises above the building
    this.box = scene.add.container(place.x + place.w / 2, place.y - 34, children).setDepth(SKY_DEPTH + 30)

    // tapping the sign is tapping the building
    board.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(16 * RES, 0, (W - 32) * RES, 178 * RES),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    })
    listen(board)

    // WebGL only: the gem catches the light now and then, and shines brighter while chosen
    this.idleShine = 0.32 + index * 0.05
    this.shine = reducedMotion ? null : this.gem.preFX?.addShine(this.idleShine, 0.35, 4)
    this.bright = this.gem.preFX?.addColorMatrix()
    if (reducedMotion) return

    const bob = 1400 + index * 170
    scene.tweens.add({ targets: this.box, y: this.box.y - 8, duration: bob, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
    if (motif.puffs) this.puff(local(motif.puffs), motif.puffs[2])
    for (const part of this.parts) {
      if (part.swing) {
        part.image.setAngle(-part.swing)
        scene.tweens.add({ targets: part.image, angle: part.swing, duration: 1600, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
      }
      if (part.snip) {
        // two quick snips, then a rest
        scene.tweens.chain({
          targets: part.image,
          loop: -1,
          loopDelay: 2600 + index * 300,
          tweens: [
            { angle: part.snip, duration: 110, ease: 'Sine.easeInOut', yoyo: true },
            { angle: part.snip, duration: 110, ease: 'Sine.easeInOut', yoyo: true },
          ],
        })
      }
    }
  }

  // Steam off the coffee, smoke from the chimney: soft puffs that rise, grow and fade.
  puff([x, y], tint) {
    const puffs = this.scene.add.particles(x, y, 'glow', {
      x: { min: -6, max: 6 },
      speedY: { min: -26, max: -16 },
      speedX: { min: -4, max: 6 },
      lifespan: 2000,
      frequency: 420,
      scale: { start: 0.12, end: 0.38 },
      tint,
      alpha: { start: 0.55, end: 0 },
    })
    // behind the motif, so the steam rises out of the cup rather than across it
    this.box.addAt(puffs, 1)
  }

  // The gem glows like a lantern after dark.
  setNight(night, animate = true) {
    const targets = [
      [this.glow, night ? 0.75 : 0],
      [this.lamp, night ? 0.35 : 0],
    ]
    for (const [image, alpha] of targets) {
      this.scene.tweens.killTweensOf(image)
      if (animate && !this.reducedMotion) this.scene.tweens.add({ targets: image, alpha, duration: FADE })
      else image.setAlpha(alpha)
    }
  }

  // Brighter, with a quicker shine, while its building is the chosen one.
  setChosen(chosen) {
    this.bright?.reset()
    if (chosen) this.bright?.brightness(1.12)
    if (this.shine) this.shine.speed = chosen ? 0.9 : this.idleShine
  }

  // Grows with its building when the building pops.
  setGrowth(scale) {
    this.box.setScale(scale)
  }
}
