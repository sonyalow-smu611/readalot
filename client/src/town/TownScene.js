// Scaffolded with AI assistance — see AI_USAGE.md
// Phaser 3 (phaser.io, MIT) — draws the town map, lets the reader drag and pinch around it, and
// reports taps on buildings and friends' houses. On top of the picture: moving water
// (water.js), the campfire (fire.js), cars and walkers (traffic.js), the weather (sky.js) and
// your own character (you.js), whom the camera can follow. Everything you press
// besides the map itself is HTML (components/town).
import Phaser from 'phaser'
import mapData from './map-data.json'
import { ALL_PLACES, AVATARS, MAP_W, MAP_H, SPAWN, TOWNSFOLK } from './places.js'
import { SKY_DEPTH, Sky } from './sky.js'
import { Traffic } from './traffic.js'
import { Water } from './water.js'
import { Campfire } from './fire.js'
import { You } from './you.js'
import { doorstep } from './door.js'

const MAX_ZOOM = 1.5
const START_ZOOM = 0.6
// A press that moves less than this is a tap; more is a drag.
const TAP_SLOP = 10
// How much a building grows when you point at it.
const POP_SCALE = 1.06
// How close the camera comes while following you, and how far it leans in at a door.
const FOLLOW_ZOOM = 0.8
const DOOR_ZOOM = 1.4

export default class TownScene extends Phaser.Scene {
  // onSelect(place) runs when a building is tapped, onReady() once the map is on screen and
  // onError() if the map picture cannot be loaded. onFollow(false) says a drag stopped the
  // camera following you; onInside(place) says you have walked in through its door.
  // `character` is the reader's saved character (see lib/avatar/catalogue.js).
  constructor({ character, onSelect, onReady, onError, onFollow, onInside, reducedMotion }) {
    super('town')
    this.character = character
    this.onSelect = onSelect
    this.onReady = onReady
    this.onError = onError
    this.onFollow = onFollow
    this.onInside = onInside
    this.reducedMotion = reducedMotion
    this.following = false
    // on the way into a building: taps and the Places list wait
    this.busy = false
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
    this.you = new You(this, { ...motion, character: this.character })
    this.addCameraControls()
    this.scale.on('resize', () => this.fitZoom())
    this.onReady?.()
  }

  update(time, delta) {
    this.sky?.update(delta)
    this.water?.update(delta)
    this.you?.sync()
  }

  // May come before the map has loaded; it is used as soon as it has.
  setCharacter(character) {
    this.character = character
    this.you?.setLook(character)
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
    // above the selection outline, which would otherwise cut through the name
    const tag = this.add.container(place.x + place.w / 2, place.y + 4, [pill, text]).setDepth(SKY_DEPTH + 30)
    if (!this.reducedMotion) this.tweens.add({ targets: tag, y: tag.y - 8, duration: 1400, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
  }

  select(place) {
    if (this.busy) return
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
    if (!place || this.busy) return
    this.stopFollowing()
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
  // Keeps you in the middle of the screen as you walk, or lets the camera go.
  follow(on) {
    const cam = this.cameras.main
    this.following = on
    if (!on) {
      cam.stopFollow()
      return
    }
    if (this.reducedMotion) cam.startFollow(this.you.body)
    else {
      cam.startFollow(this.you.body, true, 0.12, 0.12)
      if (cam.zoom < FOLLOW_ZOOM) cam.zoomTo(Math.max(FOLLOW_ZOOM, this.minZoom), 500, 'Sine.easeInOut')
    }
  }

  stopFollowing() {
    if (!this.following) return
    this.follow(false)
    this.onFollow?.(false)
  }

  // Walks you to the building; as its door opens the camera leans in, and once you are through
  // it says you are inside.
  goInto(id) {
    const place = ALL_PLACES.find((p) => p.id === id)
    if (!place || this.busy) return
    this.busy = true
    this.highlight?.clear()
    // a building still grown from being pointed at would cover its door
    this.pop(place.id, false)
    if (!this.following) {
      this.follow(true)
      this.onFollow?.(true)
    }
    this.you.goIn(place, {
      atDoor: () => {
        const cam = this.cameras.main
        const [x, y] = doorstep(place).front
        this.follow(false)
        cam.pan(x, y - 60, 1100, 'Sine.easeInOut')
        cam.zoomTo(DOOR_ZOOM, 1100, 'Sine.easeInOut')
      },
      inside: () => this.onInside?.(place),
    })
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
      if (!this.dragged || this.busy) return
      this.stopFollowing()
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
