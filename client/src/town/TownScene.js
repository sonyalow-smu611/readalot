// Scaffolded with AI assistance — see AI_USAGE.md
// Phaser 3 (phaser.io, MIT) — draws the town map, lets the reader drag and pinch around it, and
// reports taps on buildings and friends' houses. On top of the picture: moving water
// (water.js), the campfire (fire.js), cars and walkers (traffic.js) and the weather (sky.js).
// Everything you press
// besides the map itself is HTML (components/town).
import Phaser from 'phaser'
import mapData from './map-data.json'
import { ALL_PLACES, AVATARS, MAP_W, MAP_H, SPAWN, TOWNSFOLK } from './places.js'
import { SKY_DEPTH, Sky } from './sky.js'
import { Traffic } from './traffic.js'
import { Water } from './water.js'
import { Campfire } from './fire.js'

const MAX_ZOOM = 1.5
const START_ZOOM = 0.6
// A press that moves less than this is a tap; more is a drag.
const TAP_SLOP = 10
// How much a building grows when you point at it.
const POP_SCALE = 1.06

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
    this.skyState = { night: false, rain: false }
    this.pops = {}
    this.hovered = null
  }

  preload() {
    this.load.on('loaderror', (file) => {
      if (file.key === 'map') this.onError?.()
    })
    this.load.image('map', '/town/map.png')
    for (const id of [...AVATARS, ...TOWNSFOLK]) this.load.image(`avatar-${id}`, `/town/avatars/${id}.png`)
    for (const id of Object.keys(mapData.buildings)) this.load.image(`building-${id}`, `/town/buildings/${id}.png`)
    for (const id of mapData.cars) this.load.image(`car-${id}`, `/town/cars/${id}.png`)
  }

  create() {
    if (!this.textures.exists('map')) return
    this.add.image(0, 0, 'map').setOrigin(0)
    this.highlight = this.add.graphics().setDepth(SKY_DEPTH + 20)

    const cam = this.cameras.main
    cam.setBounds(0, 0, MAP_W, MAP_H)
    cam.setBackgroundColor('#6fb14b')
    this.fitZoom()
    cam.setZoom(Math.max(START_ZOOM, this.minZoom))
    cam.centerOn(SPAWN.x, SPAWN.y - 200)

    const motion = { reducedMotion: this.reducedMotion }
    this.sky = new Sky(this, motion)
    this.sky.set(this.skyState, false)
    this.water = new Water(this, motion)
    this.campfire = new Campfire(this, { ...motion, glow: (x, y, options) => this.sky.glow(x, y, options) })
    this.traffic = new Traffic(this, { ...motion, lights: this.sky.lights })
    this.addPlaces()
    this.addYou()
    this.addCameraControls()
    this.scale.on('resize', () => this.fitZoom())
    this.onReady?.()
  }

  update(time, delta) {
    this.sky?.update(delta)
    this.water?.update(delta)
  }

  // { night, rain }: may come before the map has loaded; it is used as soon as it has.
  setSky(state) {
    this.skyState = state
    this.sky?.set(state)
  }

  // The smallest zoom still fills the screen, so the map's edge never shows.
  fitZoom() {
    const cam = this.cameras.main
    this.minZoom = Math.max(this.scale.width / MAP_W, this.scale.height / MAP_H)
    if (cam.zoom < this.minZoom) cam.setZoom(this.minZoom)
  }

  // --- Buildings: invisible zones over the picture --------------------------------------
  addPlaces() {
    for (const place of ALL_PLACES) {
      const zone = this.add.zone(place.x + place.w / 2, place.y + place.h / 2, place.w, place.h)
      zone.setInteractive({ useHandCursor: true })
      zone.on('pointerup', (pointer) => {
        // Phaser hears pointer-ups on the whole window: a click on an HTML button over the
        // map must not also tap the building underneath it
        const onMap = pointer.downElement === this.game.canvas && pointer.upElement === this.game.canvas
        if (onMap && !this.dragged && !this.pinch) this.select(place)
      })
      this.addPop(place)
      zone.on('pointerover', () => {
        this.hovered = place.id
        this.pop(place.id, true)
      })
      zone.on('pointerout', () => {
        if (this.hovered === place.id) this.hovered = null
        this.pop(place.id, false)
      })
      if (place.label) this.addNameTag(place)
    }
  }

  // A copy of the building's art laid exactly over the picture, hidden until it pops.
  addPop(place) {
    const art = place.art ?? place.id
    const box = mapData.buildings[art]
    if (!box) return
    const image = this.add
      .image(box.x + box.w / 2, box.y + box.h, `building-${art}`)
      .setOrigin(0.5, 1)
      .setDepth(box.y + box.h)
      .setVisible(false)
    this.pops[place.id] = { image, art }
  }

  // Grows the building a little from its base while it is pointed at, and back after.
  pop(id, up) {
    const popping = this.pops[id]
    if (!popping || this.reducedMotion) return
    const { image, art } = popping
    // its lit windows (at night) grow with it
    const onUpdate = () => this.sky.scaleWindows(art, image.scale, image.x, image.y)
    this.tweens.killTweensOf(image)
    if (up) {
      image.setVisible(true)
      this.tweens.add({ targets: image, scale: POP_SCALE, duration: 180, ease: 'Back.easeOut', onUpdate })
    } else {
      this.tweens.add({
        targets: image,
        scale: 1,
        duration: 160,
        ease: 'Sine.easeOut',
        onUpdate,
        onComplete: () => {
          onUpdate()
          image.setVisible(false)
        },
      })
    }
  }

  // A name tag floating over a friend's roof, readable at night too.
  addNameTag(place) {
    const text = this.add.text(0, 0, place.label, {
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#3f2e24',
    })
    text.setOrigin(0.5).setResolution(2)
    text.texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
    const w = text.width + 32
    const h = 42
    const accent = Phaser.Display.Color.HexStringToColor(place.accent).color
    const pill = this.add.graphics()
    pill.fillStyle(0xfffdf9, 0.96).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2)
    pill.lineStyle(4, accent, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2)
    const tag = this.add.container(place.x + place.w / 2, place.y + 4, [pill, text]).setDepth(SKY_DEPTH + 10)
    if (!this.reducedMotion) this.tweens.add({ targets: tag, y: tag.y - 8, duration: 1400, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
  }

  select(place) {
    this.outline(place)
    // on a touch screen there is no pointing first, so a tap gives the pop on its own
    if (this.hovered !== place.id) {
      this.pop(place.id, true)
      this.time.delayedCall(220, () => {
        if (this.hovered !== place.id) this.pop(place.id, false)
      })
    }
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
    const place = ALL_PLACES.find((p) => p.id === id)
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

  // --- You -------------------------------------------------------------------------------
  addYou() {
    const ring = this.add.circle(SPAWN.x, SPAWN.y, 22, 0x2f5fb3, 0.25).setDepth(SPAWN.y)
    this.add.circle(SPAWN.x, SPAWN.y, 13, 0xfffdf9).setStrokeStyle(7, 0x2f5fb3).setDepth(SPAWN.y + 1)
    if (!this.reducedMotion) this.tweens.add({ targets: ring, scale: 1.8, alpha: 0, duration: 1600, repeat: -1 })
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
