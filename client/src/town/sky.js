// Scaffolded with AI assistance — see AI_USAGE.md
// The weather over the town. A tint darkens the map for night or rain; after dark the street
// lamps, windows and lighthouse light up (and cars put their headlights on, see traffic.js);
// rain blows past the camera (rain.js) and splashes on the ground.
import Phaser from 'phaser'
import mapData from './map-data.json'
import { MAP_H, MAP_W } from './places.js'
import { Rain } from './rain.js'

// Above everything on the map, below the selection outline and name tags.
export const SKY_DEPTH = MAP_H + 20

// Multiplied over the map: white leaves it as it is.
const TINTS = { clear: 0xffffff, rain: 0xa9b3c6, night: 0x5262a6, rainyNight: 0x444f7e }
const WARM = 0xffd27a
const FADE = 1200

function makeTextures(scene) {
  if (!scene.textures.exists('glow')) {
    const glow = scene.textures.createCanvas('glow', 128, 128)
    const ctx = glow.getContext()
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.35, 'rgba(255,255,255,0.45)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    glow.refresh()
  }
  if (!scene.textures.exists('pool')) {
    // a soft, even spread of light with no bright middle, for light falling on the ground
    const pool = scene.textures.createCanvas('pool', 128, 128)
    const ctx = pool.getContext()
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(255,255,255,0.8)')
    g.addColorStop(0.5, 'rgba(255,255,255,0.45)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    pool.refresh()
  }
  if (!scene.textures.exists('beam')) {
    const beam = scene.textures.createCanvas('beam', 256, 96)
    const ctx = beam.getContext()
    const g = ctx.createLinearGradient(0, 0, 256, 0)
    g.addColorStop(0, 'rgba(255,255,255,0.9)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(0, 44)
    ctx.lineTo(256, 0)
    ctx.lineTo(256, 96)
    ctx.lineTo(0, 52)
    ctx.fill()
    beam.refresh()
  }
  if (!scene.textures.exists('splash')) {
    const g = scene.make.graphics({ add: false })
    g.lineStyle(2, 0xdcebff, 1)
    g.strokeEllipse(12, 6, 20, 8)
    g.generateTexture('splash', 24, 12)
    g.destroy()
  }
}

export class Sky {
  constructor(scene, { reducedMotion }) {
    this.scene = scene
    this.reducedMotion = reducedMotion
    makeTextures(scene)

    this.shade = scene.add
      .rectangle(0, 0, MAP_W, MAP_H, TINTS.clear)
      .setOrigin(0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(SKY_DEPTH)
      .setVisible(false)

    // everything that glows after dark; headlights are added here too
    this.lights = scene.add.container(0, 0).setDepth(SKY_DEPTH + 1).setAlpha(0).setVisible(false)
    this.addLamps()
    this.addWindows()
    this.addLighthouse()

    this.rain = new Rain(scene, SKY_DEPTH + 3)
    this.rainAlpha = 0
    this.splashes = Array.from({ length: 24 }, () =>
      scene.add.image(0, 0, 'splash').setDepth(SKY_DEPTH + 2).setVisible(false).setBlendMode(Phaser.BlendModes.ADD),
    )
    this.nextSplash = 0
    this.splashClock = 0
  }

  glow(x, y, { scale = 1, scaleY = scale, tint = WARM, alpha = 1, texture = 'glow' } = {}) {
    const light = this.scene.add.image(x, y, texture).setScale(scale, scaleY).setTint(tint).setAlpha(alpha)
    light.setBlendMode(Phaser.BlendModes.ADD)
    this.lights.add(light)
    return light
  }

  addLamps() {
    for (const [x, y] of mapData.lamps) {
      // a small halo round the bulb, and the wide pool of light it throws on the street
      this.glow(x, y, { scale: 0.45, alpha: 0.95 })
      this.glow(x, y + 70, { texture: 'pool', scale: 6, scaleY: 3.8, alpha: 0.42, tint: 0xffc565 })
    }
  }

  addWindows() {
    // each building's windows, so they can move with it when it pops (see scaleWindows)
    this.windowsOf = {}
    const buildings = Object.entries(mapData.buildings)
    for (const { x, y, w, h } of mapData.windows) {
      // lamp-lit glass, drawn over the darkened picture
      const pane = this.scene.add.rectangle(x, y, w, h, 0xffd98a, 0.9).setOrigin(0)
      this.lights.add(pane)
      const glow = this.glow(x + w / 2, y + h / 2, { scale: Math.max(w, h) / 40, alpha: 0.35 })
      const [id] = buildings.find(([, b]) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) ?? []
      if (id) (this.windowsOf[id] ??= []).push({ pane, glow, x, y, w, h })
    }
  }

  // Lights a building's windows after dark, or leaves them dark (nobody has been home for weeks).
  setWindowsLit(id, lit) {
    for (const { pane, glow } of this.windowsOf[id] ?? []) {
      pane.setVisible(lit)
      glow.setVisible(lit)
    }
  }

  // Keeps a building's lit windows on it while it grows by `scale` from the point (ox, oy).
  scaleWindows(id, scale, ox, oy) {
    for (const { pane, glow, x, y, w, h } of this.windowsOf[id] ?? []) {
      pane.setPosition(ox + (x - ox) * scale, oy + (y - oy) * scale).setScale(scale)
      glow.setPosition(ox + (x + w / 2 - ox) * scale, oy + (y + h / 2 - oy) * scale)
    }
  }

  addLighthouse() {
    const [x, y] = mapData.lighthouse
    this.glow(x, y, { scale: 1.4, tint: 0xfff1b8 })
    const beam = this.scene.add.image(x, y, 'beam').setOrigin(0, 0.5).setScale(3, 2).setAlpha(0.5).setTint(0xfff1b8)
    beam.setBlendMode(Phaser.BlendModes.ADD)
    this.lights.add(beam)
    if (!this.reducedMotion) this.scene.tweens.add({ targets: beam, angle: 360, duration: 7000, repeat: -1 })
  }

  // { night, rain }: fades to the new look, or jumps there when `animate` is false.
  set({ night = false, rain = false } = {}, animate = true) {
    const scene = this.scene
    const duration = animate && !this.reducedMotion ? FADE : 0
    const to = night && rain ? TINTS.rainyNight : night ? TINTS.night : rain ? TINTS.rain : TINTS.clear

    // from the colour on screen now, which is mid-fade when the sky changes twice quickly
    const from = Phaser.Display.Color.IntegerToColor(this.shade.fillColor)
    const target = Phaser.Display.Color.IntegerToColor(to)
    scene.tweens.killTweensOf([this.lights, this])
    this.tintTween?.stop()
    this.shade.setVisible(true)
    this.tintTween = scene.tweens.addCounter({
      from: 0,
      to: 100,
      duration,
      onUpdate: (tween) => {
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(from, target, 100, tween.getValue())
        this.shade.setFillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b))
      },
      onComplete: () => this.shade.setVisible(to !== TINTS.clear),
    })

    this.lights.setVisible(true)
    scene.tweens.add({
      targets: this.lights,
      alpha: night ? 1 : 0,
      duration,
      onComplete: () => this.lights.setVisible(night),
    })

    scene.tweens.add({ targets: this, rainAlpha: rain ? 1 : 0, duration })
  }

  update(delta) {
    this.rain.update(delta, this.rainAlpha, this.reducedMotion)
    if (this.rainAlpha <= 0.01 || this.reducedMotion) return
    const view = this.scene.cameras.main.worldView

    this.splashClock += delta
    if (this.splashClock < 90) return
    this.splashClock = 0
    const splash = this.splashes[this.nextSplash]
    this.nextSplash = (this.nextSplash + 1) % this.splashes.length
    this.scene.tweens.killTweensOf(splash)
    splash
      .setPosition(view.x + Math.random() * view.width, view.y + Math.random() * view.height)
      .setScale(0.3)
      .setAlpha(0.7 * this.rainAlpha)
      .setVisible(true)
    this.scene.tweens.add({ targets: splash, scale: 1, alpha: 0, duration: 420, onComplete: () => splash.setVisible(false) })
  }
}
