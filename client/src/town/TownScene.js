// Scaffolded with AI assistance — see AI_USAGE.md
// Phaser 3 (phaser.io, MIT) — draws the town map, lets the reader drag and pinch around it, and
// reports taps on buildings. Everything you press besides the map itself is HTML (components/town).
import Phaser from 'phaser'
import { AVATARS, MAP_H, MAP_W, PLACES, SPAWN, WALKERS } from './places.js'

const MAX_ZOOM = 1.5
const START_ZOOM = 0.6
// A press that moves less than this is a tap; more is a drag.
const TAP_SLOP = 10

export default class TownScene extends Phaser.Scene {
  // onSelect(place) runs when a building is tapped, onReady() once the map is on screen and
  // onError() if the map picture cannot be loaded.
  constructor({ onSelect, onReady, onError, reducedMotion }) {
    super('town')
    this.onSelect = onSelect
    this.onReady = onReady
    this.onError = onError
    this.reducedMotion = reducedMotion
    this.dragged = false
    this.pinch = null
  }

  preload() {
    this.load.on('loaderror', (file) => {
      if (file.key === 'map') this.onError?.()
    })
    this.load.image('map', '/town/map.png')
    for (const id of AVATARS) this.load.image(`avatar-${id}`, `/town/avatars/${id}.png`)
  }

  create() {
    if (!this.textures.exists('map')) return
    this.add.image(0, 0, 'map').setOrigin(0)
    this.highlight = this.add.graphics().setDepth(MAP_H + 10)

    const cam = this.cameras.main
    cam.setBounds(0, 0, MAP_W, MAP_H)
    cam.setBackgroundColor('#6fb14b')
    this.fitZoom()
    cam.setZoom(Math.max(START_ZOOM, this.minZoom))
    cam.centerOn(SPAWN.x, SPAWN.y - 200)

    this.addPlaces()
    this.addYou()
    this.addWalkers()
    this.addCameraControls()
    this.scale.on('resize', () => this.fitZoom())
    this.onReady?.()
  }

  // The smallest zoom still fills the screen, so the map's edge never shows.
  fitZoom() {
    const cam = this.cameras.main
    this.minZoom = Math.max(this.scale.width / MAP_W, this.scale.height / MAP_H)
    if (cam.zoom < this.minZoom) cam.setZoom(this.minZoom)
  }

  // --- Buildings: invisible zones over the picture --------------------------------------
  addPlaces() {
    for (const place of PLACES) {
      const zone = this.add.zone(place.x + place.w / 2, place.y + place.h / 2, place.w, place.h)
      zone.setInteractive({ useHandCursor: true })
      zone.on('pointerup', (pointer) => {
        // Phaser hears pointer-ups on the whole window: a click on an HTML button over the
        // map must not also tap the building underneath it
        const onMap = pointer.downElement === this.game.canvas && pointer.upElement === this.game.canvas
        if (onMap && !this.dragged && !this.pinch) this.select(place)
      })
    }
  }

  select(place) {
    this.outline(place)
    this.onSelect?.(place)
  }

  outline(place) {
    this.highlight?.clear()
    if (!place) return
    this.highlight.lineStyle(8, 0xfffdf9, 0.95)
    this.highlight.strokeRoundedRect(place.x - 6, place.y - 6, place.w + 12, place.h + 12, 14)
  }

  // Glide to a place (from the Places list) and select it.
  focusPlace(id) {
    const place = PLACES.find((p) => p.id === id)
    if (!place) return
    const cam = this.cameras.main
    const cx = place.x + place.w / 2
    const cy = place.y + place.h / 2
    if (this.reducedMotion) cam.centerOn(cx, cy)
    else cam.pan(cx, cy, 700, 'Sine.easeInOut', true)
    this.select(place)
  }

  zoomBy(factor) {
    this.zoomAround(this.cameras.main.zoom * factor, this.scale.width / 2, this.scale.height / 2)
  }

  // --- You and the other readers --------------------------------------------------------
  addYou() {
    const ring = this.add.circle(SPAWN.x, SPAWN.y, 22, 0x2f5fb3, 0.25).setDepth(SPAWN.y)
    this.add.circle(SPAWN.x, SPAWN.y, 13, 0xfffdf9).setStrokeStyle(7, 0x2f5fb3).setDepth(SPAWN.y + 1)
    if (!this.reducedMotion) this.tweens.add({ targets: ring, scale: 1.8, alpha: 0, duration: 1600, repeat: -1 })
  }

  addWalkers() {
    for (const walker of WALKERS) {
      const [startX, startY] = walker.points[0]
      const body = this.add.image(startX, startY, `avatar-${walker.avatar}`).setOrigin(0.5, 1)
      // nearer the bottom of the map draws in front
      body.setDepth(startY)
      if (this.reducedMotion) continue

      // one tween per leg so every reader walks at an even pace, then round again forever
      const legs = []
      const loop = [...walker.points.slice(1), walker.points[0]]
      let [fromX, fromY] = walker.points[0]
      for (const [x, y] of loop) {
        const duration = (Math.hypot(x - fromX, y - fromY) / walker.speed) * 1000
        legs.push({ x, y, duration, ease: 'Linear', onUpdate: () => body.setDepth(body.y), onStart: () => body.setFlipX(x < fromX) })
        fromX = x
        fromY = y
      }
      this.tweens.chain({ targets: body, tweens: legs, loop: -1, delay: Math.random() * 2000 })
    }
  }

  // --- Camera: drag to pan, pinch or wheel to zoom --------------------------------------
  addCameraControls() {
    const cam = this.cameras.main
    this.input.addPointer(1)

    this.input.on('pointerdown', () => {
      this.dragged = false
      const touches = this.activePointers()
      if (touches.length === 2) this.startPinch(touches)
    })

    this.input.on('pointermove', (pointer) => {
      if (this.pinch) {
        this.movePinch()
        return
      }
      if (!pointer.isDown) return
      if (pointer.getDistance() > TAP_SLOP) this.dragged = true
      if (!this.dragged) return
      cam.scrollX -= (pointer.x - pointer.prevPosition.x) / cam.zoom
      cam.scrollY -= (pointer.y - pointer.prevPosition.y) / cam.zoom
    })

    this.input.on('pointerup', () => {
      if (this.activePointers().length < 2) {
        // let the zone's own pointerup see the pinch before it is cleared
        this.time.delayedCall(0, () => {
          this.pinch = null
        })
      }
    })

    this.input.on('wheel', (pointer, objects, dx, dy) => {
      this.zoomAround(cam.zoom * (dy > 0 ? 0.9 : 1.1), pointer.x, pointer.y)
    })
  }

  activePointers() {
    return [this.input.pointer1, this.input.pointer2].filter((p) => p?.isDown)
  }

  startPinch([a, b]) {
    this.pinch = {
      distance: Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y),
      zoom: this.cameras.main.zoom,
    }
    this.dragged = true
  }

  movePinch() {
    const touches = this.activePointers()
    if (touches.length < 2) return
    const [a, b] = touches
    const distance = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y)
    this.zoomAround(this.pinch.zoom * (distance / this.pinch.distance), (a.x + b.x) / 2, (a.y + b.y) / 2)
  }

  // Zoom while keeping the map point under (screenX, screenY) where it is.
  zoomAround(zoom, screenX, screenY) {
    const cam = this.cameras.main
    const before = cam.getWorldPoint(screenX, screenY)
    cam.setZoom(Phaser.Math.Clamp(zoom, this.minZoom, MAX_ZOOM))
    cam.preRender()
    const after = cam.getWorldPoint(screenX, screenY)
    cam.scrollX += before.x - after.x
    cam.scrollY += before.y - after.y
  }
}
