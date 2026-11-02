// Scaffolded with AI assistance — see AI_USAGE.md
// The big signs over the four main buildings: a chunky pixel plate in the building's accent colour
// (dark outline with stepped corners, a thick base, one bright line low down with a white glint)
// with a box set into it, its name and app section in white pixel letters on a dark backing in
// that box, and a motif of its own on top
// (an open book, a coffee cup, a roof, scissors and a comb). All of it is pixel art drawn here from
// places.js, so a new accent or name needs no redrawing. Each sign bobs, its plate sparkles, its
// motif moves a little, and after dark the plate glows like a lantern.
import Phaser from 'phaser'
import { LARGE, SMALL, measure, write } from './pixelFont.js'
import { SKY_DEPTH } from './sky.js'

// One sign's size in map pixels, and how many of them make one block of the art. It opens at
// 0.6 zoom, so anything finer than this would read as smooth rather than blocky.
const W = 360
const H = 200
const BLOCK = 4
const GRID_W = W / BLOCK
const GRID_H = H / BLOCK
// the app section's letters are a little smaller than a block, and sit this far below the middle
const SECTION_BLOCK = 3
const SECTION_Y = 38
// The fewest screen pixels a block may cover. Below two, drawing without blending drops rows and
// columns of blocks and the letters clog up, so a zoomed-out sign stops shrinking here.
const MIN_BLOCK = 2
// how far below the sign's middle its bottom edge is, in map pixels: it grows up from there
const FOOT = 96
// how long the night glow takes to come and go, like the sky's
const FADE = 1200

const OUTLINE = '#2b2133'
const BRONZE_LIGHT = '#d9a466'
const PAGE = '#fff8ea'
const CREAM = '#fff4e2'
const COFFEE = '#5a3218'
const COFFEE_LIGHT = '#8a5a34'

// The four motifs: `art` is drawn with the frame; `parts` are drawn alone so they can move,
// turning on `pivot` (in map pixels); `puffs` is where steam or smoke rises from.
const MOTIFS = {
  library: { art: book, parts: [{ name: 'ribbon', art: ribbon, pivot: [180, 30], swing: 5 }] },
  cafe: { art: cup, puffs: [180, 22, 0xffffff] },
  house: { art: roof, behind: true, puffs: [256, 18, 0xd6d0c8] },
  salon: {
    art: comb,
    parts: [
      { name: 'blade-a', art: (x, c) => blade(x, c, false), pivot: [180, 40], snip: 9 },
      { name: 'blade-b', art: (x, c) => blade(x, c, true), pivot: [180, 40], snip: -9 },
    ],
  },
}

// Where the plate's sparkles sit on the grid: clear of the words.
const SPARKLES = [
  [84, 24],
  [6, 35],
  [84, 35],
]

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
    recess: mix(accent, '#000000', 0.22),
    dark: mix(accent, '#000000', 0.35),
    deep: mix(accent, '#000000', 0.6),
  }
}

// --- Drawing ---------------------------------------------------------------------------------
// Everything is whole blocks on the grid, one canvas pixel to a block.
function sheet(draw, w = GRID_W, h = GRID_H) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  draw(canvas.getContext('2d'))
  return canvas
}

function fill(x, left, top, w, h, colour) {
  x.fillStyle = colour
  x.fillRect(left, top, w, h)
}

// The same block, and its mirror across the middle of the sign.
function both(x, left, top, w, h, colour) {
  fill(x, left, top, w, h, colour)
  fill(x, GRID_W - left - w, top, w, h, colour)
}

// Draws a sheet, then runs a dark outline round whatever is on it, as the characters have.
function inked(draw, corners = false) {
  const canvas = sheet(draw)
  const x = canvas.getContext('2d')
  const { data } = x.getImageData(0, 0, GRID_W, GRID_H)
  const solid = (left, top) => left >= 0 && top >= 0 && left < GRID_W && top < GRID_H && data[(top * GRID_W + left) * 4 + 3] > 0
  const diagonal = (left, top) => solid(left - 1, top - 1) || solid(left + 1, top - 1) || solid(left - 1, top + 1) || solid(left + 1, top + 1)
  for (let top = 0; top < GRID_H; top++) {
    for (let left = 0; left < GRID_W; left++) {
      if (solid(left, top)) continue
      if (solid(left - 1, top) || solid(left + 1, top) || solid(left, top - 1) || solid(left, top + 1) || (corners && diagonal(left, top))) fill(x, left, top, 1, 1, OUTLINE)
    }
  }
  return canvas
}

// --- Art -------------------------------------------------------------------------------------
// A scroll along the top of the plate, out to both sides from the motif.
function curls(x, c) {
  both(x, 54, 14, 6, 2, c.gem)
  both(x, 60, 13, 6, 2, c.gem)
  both(x, 66, 12, 5, 2, c.gem)
  both(x, 71, 10, 2, 3, c.gem)
  both(x, 68, 9, 4, 2, c.gem)
  both(x, 67, 10, 2, 1, c.gem)
  both(x, 54, 14, 6, 1, c.pale)
  both(x, 60, 13, 6, 1, c.pale)
  both(x, 66, 12, 5, 1, c.pale)
  both(x, 68, 9, 4, 1, c.pale)
}

// A block with its corners stepped in, two blocks along and two down.
function pill(x, left, top, w, h, colour) {
  fill(x, left + 2, top, w - 4, h, colour)
  fill(x, left + 1, top + 1, w - 2, h - 2, colour)
  fill(x, left, top + 2, w, h - 4, colour)
}

// The dark outline, thicker along the bottom so the plate stands up off the sign.
function frame(x) {
  pill(x, 2, 16, 86, 33, OUTLINE)
}

// The plate: one flat colour, a dark band along the bottom with a bright line above it, and a box
// set into it, lit from the top left: a thick shadow inside its top and left edges, a light lip
// along its bottom and right, and a darker floor.
function plate(x, c) {
  pill(x, 3, 17, 84, 29, c.dark)
  pill(x, 3, 17, 84, 26, c.gem)
  fill(x, 6, 41, 78, 1, c.pale)
  fill(x, 7, 41, 4, 1, '#ffffff')
  fill(x, 13, 41, 2, 1, '#ffffff')
  pill(x, 6, 19, 78, 21, c.light)
  pill(x, 6, 19, 77, 20, c.deep)
  pill(x, 8, 21, 75, 18, c.recess)
}

// The building's name in white pixel letters on a dark backing. A long name drops to plain letters
// to stay on the plate.
function nameplate(x, place) {
  const fits = measure(LARGE, place.name, true, 1) <= 74
  write(x, LARGE, place.name, GRID_W / 2, 22, '#ffffff', fits)
}

// The app section, in the middle of its own sheet: it's drawn at SECTION_BLOCK.
function sectionplate(x, place) {
  write(x, SMALL, place.tab, GRID_W / 2, 23, '#fff6dc')
}

// A small four-pointed sparkle, three blocks across.
function sparkle(x) {
  fill(x, 1, 0, 1, 3, '#ffffff')
  fill(x, 0, 1, 3, 1, '#ffffff')
}

// Library: an open book standing on the sign.
function book(x, c) {
  curls(x, c)
  both(x, 27, 8, 18, 8, c.dark)
  both(x, 29, 6, 10, 8, PAGE)
  both(x, 39, 7, 4, 8, PAGE)
  both(x, 43, 8, 2, 7, PAGE)
  for (const top of [8, 10, 12]) both(x, 31, top, 10, 1, '#b7aa94')
  fill(x, 44, 7, 2, 9, OUTLINE)
}

// The bookmark ribbon hanging from the book's spine; it sways.
function ribbon(x) {
  fill(x, 43, 8, 4, 8, '#d8503f')
  fill(x, 44, 8, 1, 8, '#f08a74')
  fill(x, 43, 16, 1, 2, '#d8503f')
  fill(x, 46, 16, 1, 2, '#d8503f')
}

// Cafe: a cup of coffee on its saucer, and coffee beans for studs in the corners.
function cup(x, c) {
  curls(x, c)
  fill(x, 35, 14, 20, 2, CREAM)
  fill(x, 38, 6, 14, 6, CREAM)
  fill(x, 39, 12, 12, 1, CREAM)
  fill(x, 40, 13, 10, 1, CREAM)
  fill(x, 38, 9, 14, 2, c.gem)
  fill(x, 39, 6, 12, 2, COFFEE)
  fill(x, 41, 6, 3, 1, COFFEE_LIGHT)
  fill(x, 52, 7, 3, 1, CREAM)
  fill(x, 55, 8, 1, 3, CREAM)
  fill(x, 52, 11, 3, 1, CREAM)
  for (const top of [24, 34]) {
    both(x, 4, top, 2, 2, '#6b3f22')
    both(x, 4, top + 1, 1, 1, '#2f1a0d')
  }
}

// Your house: the sign sits under a little roof with a chimney and a heart in the gable.
function roof(x, c) {
  fill(x, 61, 5, 7, 9, '#b5654a')
  fill(x, 62, 7, 2, 1, '#8c4a35')
  fill(x, 65, 9, 2, 1, '#8c4a35')
  fill(x, 60, 4, 9, 2, '#8c4a35')
  for (let top = 3; top < 19; top++) {
    const half = Math.round(((top - 2) / 17) * 43)
    fill(x, 45 - half, top, half * 2, 1, c.gem)
    both(x, 45 - half, top, Math.min(3, half), 1, c.light)
    if (top % 4 === 3 && top > 5) fill(x, 45 - half + 5, top, half * 2 - 10, 1, c.dark)
  }
  fill(x, 42, 8, 2, 1, '#ffd27a')
  fill(x, 46, 8, 2, 1, '#ffd27a')
  fill(x, 41, 9, 8, 2, '#ffd27a')
  fill(x, 42, 11, 6, 1, '#ffd27a')
  fill(x, 43, 12, 4, 1, '#ffd27a')
  fill(x, 44, 13, 2, 1, '#ffd27a')
}

// Hair Salon: a comb lying behind the scissors.
function comb(x, c) {
  curls(x, c)
  fill(x, 32, 8, 26, 4, c.light)
  fill(x, 33, 8, 24, 1, c.pale)
  for (let tooth = 33; tooth < 57; tooth += 2) fill(x, tooth, 12, 1, 3, c.pale)
}

// One half of the scissors: a blade up to one side, a finger ring down the other. `flip` gives
// the other half, which carries the screw they turn on.
function blade(x, c, flip) {
  x.save()
  if (flip) {
    x.translate(GRID_W, 0)
    x.scale(-1, 1)
  }
  for (let step = 0; step < 12; step++) {
    const top = 9 - Math.round(step * 0.75)
    fill(x, 45 + step, top, 2, step < 9 ? 2 : 1, '#e9eef2')
  }
  for (let step = 0; step < 5; step++) fill(x, 44 - step, 11 + step, 2, 2, c.light)
  fill(x, 35, 14, 5, 1, c.light)
  fill(x, 34, 15, 1, 5, c.light)
  fill(x, 40, 15, 1, 5, c.light)
  fill(x, 35, 20, 5, 1, c.light)
  x.restore()
  if (flip) fill(x, 44, 9, 2, 2, BRONZE_LIGHT)
}

// --- Loading ---------------------------------------------------------------------------------
// Draws every sign's pictures; call from the scene's preload.
export function loadSigns(scene, places) {
  const add = (key, canvas) => {
    if (!scene.textures.exists(key)) scene.textures.addCanvas(key, canvas)
  }
  add('sign-sparkle', sheet(sparkle, 3, 3))
  for (const place of places.filter(hasSign)) {
    const c = colours(place.accent)
    const motif = MOTIFS[place.id]
    const art = inked((x) => motif.art(x, c))
    const board = sheet((x) => {
      if (motif.behind) x.drawImage(art, 0, 0)
      frame(x)
      if (!motif.behind) x.drawImage(art, 0, 0)
    })
    add(`sign-${place.id}`, board)
    add(`sign-${place.id}-gem`, sheet((x) => plate(x, c)))
    add(`sign-${place.id}-name`, inked((x) => nameplate(x, place), true))
    add(`sign-${place.id}-section`, inked((x) => sectionplate(x, place), true))
    for (const part of motif.parts ?? []) add(`sign-${place.id}-${part.name}`, inked((x) => part.art(x, c)))
  }
}

// --- The sign --------------------------------------------------------------------------------
export class Sign {
  // `listen(target)` makes the sign tappable the same way as its building. `index` staggers the
  // signs so they don't all bob, sparkle and move together.
  constructor(scene, place, { reducedMotion, listen, index = 0 }) {
    this.scene = scene
    this.reducedMotion = reducedMotion
    this.home = place.y - 34
    this.lift = 0
    this.growth = 1
    this.fit = 1
    const c = colours(place.accent)
    const motif = MOTIFS[place.id]
    const local = ([x, y]) => [x - W / 2, y - H / 2]
    const picture = (key) => scene.add.image(0, 0, key).setScale(BLOCK)

    // a soft light behind the sign after dark
    this.glow = scene.add.image(0, 20, 'glow').setScale(4.2, 1.9).setTint(Phaser.Display.Color.HexStringToColor(c.light).color)
    this.glow.setBlendMode(Phaser.BlendModes.ADD).setAlpha(0)
    const board = picture(`sign-${place.id}`)
    this.gem = picture(`sign-${place.id}-gem`)
    // the plate lit from inside: a brighter copy over it, seen at night
    this.lamp = picture(`sign-${place.id}-gem`).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0)
    this.parts = (motif.parts ?? []).map((part) => {
      const [x, y] = local(part.pivot)
      return { ...part, image: picture(`sign-${place.id}-${part.name}`).setOrigin(part.pivot[0] / W, part.pivot[1] / H).setPosition(x, y) }
    })

    // brief glints on the plate, in place of a smooth shine that would not suit the blocks
    this.sparkles = SPARKLES.map(([x, y]) => scene.add.image(...local([x * BLOCK, y * BLOCK]), 'sign-sparkle').setScale(BLOCK))

    const name = picture(`sign-${place.id}-name`)
    this.section = picture(`sign-${place.id}-section`).setScale(SECTION_BLOCK).setPosition(0, SECTION_Y)

    const children = [this.glow, board, this.gem, this.lamp, ...this.parts.map((p) => p.image), ...this.sparkles, name, this.section]
    // the plate sits on the roof; the motif rises above the building
    this.box = scene.add.container(place.x + place.w / 2, this.home, children).setDepth(SKY_DEPTH + 30)

    // tapping the sign is tapping the building
    board.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(8 / BLOCK, 0, (W - 16) / BLOCK, 196 / BLOCK),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    })
    listen(board)

    // WebGL only: the plate shines brighter while chosen
    this.bright = this.gem.preFX?.addColorMatrix()
    this.blinks = []
    if (reducedMotion) return

    // the plate catches the light now and then, each sparkle in its turn
    this.blinks = this.sparkles.map((image, i) => {
      image.setAlpha(0)
      return scene.tweens.add({
        targets: image,
        alpha: 1,
        duration: 80,
        hold: 240,
        yoyo: true,
        repeat: -1,
        repeatDelay: 2600,
        delay: 500 + i * 900 + index * 370,
      })
    })

    const bob = 1900 + index * 170
    scene.tweens.add({ targets: this, lift: -8, duration: bob, ease: 'Sine.easeInOut', yoyo: true, repeat: -1, onUpdate: () => this.place() })
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

  // The plate glows like a lantern after dark.
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

  // Brighter, with quicker sparkles, while its building is the chosen one.
  setChosen(chosen) {
    this.bright?.reset()
    if (chosen) this.bright?.brightness(1.12)
    for (const blink of this.blinks) blink.timeScale = chosen ? 3 : 1
  }

  // Grows with its building when the building pops.
  setGrowth(scale) {
    this.growth = scale
    this.place()
  }

  // Keeps the blocks at least MIN_BLOCK on screen as the camera zooms out. The section's smaller
  // letters reach that first, so they grow back towards full size before the sign does.
  setZoom(zoom) {
    const fit = Math.max(1, MIN_BLOCK / (BLOCK * zoom))
    this.section.setScale(Math.max(SECTION_BLOCK, MIN_BLOCK / (zoom * fit)))
    if (fit === this.fit) return
    this.fit = fit
    this.place()
  }

  place() {
    this.box.setScale(this.growth * this.fit)
    this.box.y = this.home + this.lift - (this.fit - 1) * FOOT
  }
}
