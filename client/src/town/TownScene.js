// Scaffolded with AI assistance — see AI_USAGE.md
// Phaser 3 (phaser.io, MIT) — draws the town map, lets the reader drag and pinch around it, and
// reports taps on buildings and friends' houses. On top of the picture: moving water
// (water.js), the campfire (fire.js), cars and walkers (traffic.js), the weather (sky.js) and
// your own character (you.js), whom the camera can follow. A friend's house stands on its plot
// only once they're your friend; it shows whether they are online (a green dot on the name tag)
// and, if they have been away a while, looks dusty or neglected (see friends.js). Friends who are
// online walk the streets with an orange glow and readers nearby with a blue one (friend.js); tap
// one to talk. Everything you press besides the map itself is HTML (components/town).
import Phaser from 'phaser'
import mapData from './map-data.json'
import { ALL_PLACES, AVATARS, FRIEND_HOUSES, MAP_W, MAP_H, PLACES, SPAWN, TOWNSFOLK } from './places.js'
import { somewhereToWalk } from './roads.js'
import { SKY_DEPTH, Sky } from './sky.js'
import { Traffic } from './traffic.js'
import { Water } from './water.js'
import { Campfire } from './fire.js'
import { You } from './you.js'
import { doorstep } from './door.js'
import { Friend } from './friend.js'
import { Sign, hasSign, loadSigns } from './signs.js'

const MAX_ZOOM = 1.5
const START_ZOOM = 0.6
// How close the first tour comes to each building, and how long each half of the trip takes.
const TOUR_ZOOM = 1.1
const TOUR_LEG = 650
// On the tour a building sits this far down the screen (its centre), leaving the lower half for
// the tour's card, and fills at most this much of the screen.
const TOUR_AT = 0.3
const TOUR_FILL_H = 0.38
const TOUR_FILL_W = 0.8
// A press that moves less than this is a tap; more is a drag.
const TAP_SLOP = 10
// How much a building grows when you point at it.
const POP_SCALE = 1.06
// How far the glow round a chosen building reaches, in map pixels.
const HALO = 28
// How close the camera comes while following you, and how far it leans in at a door.
const FOLLOW_ZOOM = 0.8
const DOOR_ZOOM = 1.4
// The looks a friend's house can have besides its clean one (drawn by the map script), and the
// ones where nobody has been home long enough for the lights to stay off.
const AGED = ['dusty', 'neglected', 'derelict']
const DARK = ['neglected', 'derelict']
const ONLINE_GREEN = 0x3fae5a

export default class TownScene extends Phaser.Scene {
  // onSelect(place) runs when a building is tapped, onReady() once the map is on screen and
  // onError() if the map picture cannot be loaded. onFollow(false) says a drag stopped the
  // camera following you; onInside(place) says you have walked in through its door;
  // onSelectFriend(id) says a friend out walking was tapped (or found from the friends list).
  // `character` is the reader's saved character (see lib/avatar/catalogue.js).
  // start: a place id to open on, framed as the tour frames it (a new reader's first look).
  // onTourSpot({ id, x, y, w, h }) says where a tour stop's building is on screen once the
  // camera has settled on it.
  constructor({ character, start, onSelect, onReady, onError, onFollow, onInside, onSelectFriend, onTourSpot, reducedMotion }) {
    super('town')
    this.character = character
    this.start = start
    this.onTourSpot = onTourSpot
    this.onSelect = onSelect
    this.onReady = onReady
    this.onError = onError
    this.onFollow = onFollow
    this.onInside = onInside
    this.onSelectFriend = onSelectFriend
    this.reducedMotion = reducedMotion
    this.following = false
    // on the way into a building: taps and the Places list wait
    this.busy = false
    this.dragged = false
    this.pinch = null
    this.skyState = { night: false, rain: false }
    this.pops = {}
    this.hovered = null
    // [{ id: reader id, online, upkeep, house: place id or null }]: see setFriends
    this.friends = []
    // readers near you, see setNearby
    this.nearby = []
    // each place's tap zone, by place id
    this.zones = {}
    this.tags = {}
    // the big signs over the four main buildings, by place id
    this.signs = {}
    this.aged = {}
    // friends out walking, by reader id, and the one stopped to talk to you
    this.walkers = {}
    this.talkingTo = null
  }

  preload() {
    this.load.on('loaderror', (file) => {
      if (file.key === 'map') this.onError?.()
    })
    this.load.image('map', '/town/map.png')
    for (const id of [...AVATARS, ...TOWNSFOLK]) this.load.image(`avatar-${id}`, `/town/avatars/${id}.png`)
    for (const id of Object.keys(mapData.buildings)) this.load.image(`building-${id}`, `/town/buildings/${id}.png`)
    for (const { art } of FRIEND_HOUSES) {
      for (const level of AGED) this.load.image(`building-${art}-${level}`, `/town/buildings/${art}-${level}.png`)
    }
    for (const id of mapData.cars) this.load.image(`car-${id}`, `/town/cars/${id}.png`)
    loadSigns(this, PLACES)
  }

  create() {
    if (!this.textures.exists('map')) return
    this.add.image(0, 0, 'map').setOrigin(0)
    // the glow round the chosen building: above the night sky, below the name tags
    this.halo = this.add.image(0, 0, '__DEFAULT').setOrigin(0.5, 1).setDepth(SKY_DEPTH + 20).setVisible(false)
    this.haloFor = null

    const cam = this.cameras.main
    cam.setBounds(0, 0, MAP_W, MAP_H)
    cam.setBackgroundColor('#6fb14b')
    this.fitZoom()
    const first = this.start && ALL_PLACES.find((p) => p.id === this.start)
    if (first) {
      // already where the tour begins, so arriving from Welcome is one move, not three
      const frame = this.tourFrame(first)
      cam.setZoom(frame.zoom)
      cam.centerOn(frame.x, frame.y)
    } else {
      cam.setZoom(Math.max(START_ZOOM, this.minZoom))
      cam.centerOn(SPAWN.x, SPAWN.y - 200)
    }

    const motion = { reducedMotion: this.reducedMotion }
    this.sky = new Sky(this, motion)
    this.sky.set(this.skyState, false)
    this.water = new Water(this, motion)
    this.campfire = new Campfire(this, { ...motion, glow: (x, y, options) => this.sky.glow(x, y, options) })
    this.traffic = new Traffic(this, { ...motion, lights: this.sky.lights })
    this.addPlaces()
    this.showFriends()
    this.you = new You(this, { ...motion, character: this.character })
    this.addCameraControls()
    this.scale.on('resize', () => {
      this.fitZoom()
      if (this.spotPlace) this.reportSpot(this.spotPlace)
    })
    this.onReady?.()
  }

  update(time, delta) {
    this.sky?.update(delta)
    this.water?.update(delta)
    this.you?.sync()
    for (const walker of Object.values(this.walkers)) walker.sync()
  }

  // May come before the map has loaded; it is used as soon as it has.
  setCharacter(character) {
    this.character = character
    this.you?.setLook(character)
  }

  // Your friends' presence, [{ id: reader id, online, upkeep: 'kept' or one of AGED, house }].
  // May come before the map has loaded; it is used as soon as it has.
  setFriends(friends) {
    this.friends = friends
    if (this.sky) this.showFriends()
  }

  // Readers near you, [{ id, displayName, character, online }]. May come before the map has
  // loaded; it is used as soon as it has.
  setNearby(readers) {
    this.nearby = readers
    if (this.sky) this.showWalkers()
  }

  // Each friend's house: a green dot on the name tag while they are online, and a dusty,
  // neglected or derelict look (windows dark at night from neglected on) the longer they are away.
  // A plot with no friend on it is plain lawn: nothing shows and nothing can be tapped.
  showFriends() {
    for (const place of FRIEND_HOUSES) {
      const friend = this.friends.find((f) => f.house === place.id)
      this.zones[place.id].input.enabled = Boolean(friend)
      if (!friend) {
        this.clearNameTag(place.id)
        this.aged[place.id]?.setVisible(false)
        this.sky.setWindowsLit(place.art, false)
        continue
      }
      const { upkeep } = friend
      // the house is named after whoever lives there
      this.addNameTag({ ...place, label: friend.displayName.split(' ')[0] }, Boolean(friend.online))
      const box = mapData.buildings[place.art]
      if (!box) continue
      const aged = `building-${place.art}-${upkeep}`
      const look = upkeep !== 'kept' && this.textures.exists(aged) ? aged : `building-${place.art}`
      // just over the picture, so a door opening (door.js) still shows in front of it
      this.aged[place.id] ??= this.add
        .image(box.x + box.w / 2, box.y + box.h, look)
        .setOrigin(0.5, 1)
        .setDepth(1)
      this.aged[place.id].setTexture(look).setVisible(true)
      this.pops[place.id]?.image.setTexture(look)
      this.sky.setWindowsLit(place.art, !DARK.includes(upkeep))
      if (this.haloFor === place.id) this.outline(place)
    }
    this.showWalkers()
  }

  // Who is out walking: online friends, from their front door if they have one, and readers near
  // you. Anyone who has gone, or has become a friend, is taken off the streets first.
  showWalkers() {
    const out = [
      ...this.friends.filter((friend) => friend.online && friend.character).map((reader) => ({ reader, kind: 'friend' })),
      ...this.nearby.map((reader) => ({ reader, kind: 'nearby' })),
    ]
    for (const [id, walker] of Object.entries(this.walkers)) {
      if (out.some(({ reader, kind }) => reader.id === id && kind === walker.kind)) continue
      if (this.talkingTo === id) this.talkingTo = null
      walker.destroy()
      delete this.walkers[id]
    }
    for (const { reader, kind } of out) {
      if (this.walkers[reader.id]) continue
      const house = FRIEND_HOUSES.find((place) => place.id === reader.house)
      this.walkers[reader.id] = new Friend(this, {
        friend: reader,
        kind,
        at: house ? doorstep(house).front : somewhereToWalk(),
        reducedMotion: this.reducedMotion,
        onTap: (pointer) => {
          const onMap = pointer.downElement === this.game.canvas && pointer.upElement === this.game.canvas
          if (onMap && !this.dragged && !this.pinch) this.selectFriend(reader.id)
        },
      })
    }
  }

  // --- Friends out walking ---------------------------------------------------------------------
  // Stops the friend, turned towards you, and says they were chosen.
  selectFriend(id) {
    const walker = this.walkers[id]
    if (!walker || this.busy) return
    this.releaseFriend()
    this.outline(null)
    walker.hold([this.you.body.x, this.you.body.y])
    this.talkingTo = id
    this.onSelectFriend?.(id)
  }

  // Lets the friend you were talking to walk on.
  releaseFriend() {
    if (this.talkingTo) this.walkers[this.talkingTo]?.release()
    this.talkingTo = null
  }

  // Glides to a friend out walking and chooses them. False if they are not out.
  focusFriend(id) {
    const walker = this.walkers[id]
    if (!walker || this.busy) return false
    this.stopFollowing()
    walker.stop()
    const cam = this.cameras.main
    const { x, y } = walker.body
    if (this.reducedMotion) cam.centerOn(x, y - 60)
    else cam.pan(x, y - 60, 700, 'Sine.easeInOut', true)
    this.selectFriend(id)
    return true
  }

  // { night, rain }: may come before the map has loaded; it is used as soon as it has.
  setSky(state) {
    this.skyState = state
    this.sky?.set(state)
    for (const sign of Object.values(this.signs)) sign.setNight(state.night)
  }

  // The smallest zoom still fills the screen, so the map's edge never shows.
  fitZoom() {
    const cam = this.cameras.main
    this.minZoom = Math.max(this.scale.width / MAP_W, this.scale.height / MAP_H)
    if (cam.zoom < this.minZoom) cam.setZoom(this.minZoom)
  }

  // --- Buildings: invisible zones over the picture --------------------------------------
  addPlaces() {
    for (const [index, place] of ALL_PLACES.entries()) {
      const zone = this.add.zone(place.x + place.w / 2, place.y + place.h / 2, place.w, place.h)
      zone.setInteractive({ useHandCursor: true })
      this.zones[place.id] = zone
      this.listen(zone, place)
      this.addPop(place)
      // the four main buildings get a big sign; friends' houses a name tag
      if (hasSign(place)) {
        const listen = (target) => this.listen(target, place)
        this.signs[place.id] = new Sign(this, place, { reducedMotion: this.reducedMotion, listen, index })
        this.signs[place.id].setNight(this.skyState.night, false)
      } else if (place.label) this.addNameTag(place)
    }
  }

  // Taps on a building, or on its sign, choose it; pointing at either pops it.
  listen(target, place) {
    target.on('pointerup', (pointer) => {
      // Phaser hears pointer-ups on the whole window: a click on an HTML button over the
      // map must not also tap the building underneath it
      const onMap = pointer.downElement === this.game.canvas && pointer.upElement === this.game.canvas
      if (onMap && !this.dragged && !this.pinch) this.select(place)
    })
    target.on('pointerover', () => {
      this.hovered = place.id
      this.pop(place.id, true)
    })
    target.on('pointerout', () => {
      if (this.hovered === place.id) this.hovered = null
      this.pop(place.id, false)
    })
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
    // its lit windows (at night), its glow and its sign grow with it
    const onUpdate = () => {
      this.sky.scaleWindows(art, image.scale, image.x, image.y)
      if (this.haloFor === id) this.halo.setScale(image.scale)
      this.signs[id]?.setGrowth(image.scale)
    }
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

  // A name tag floating over a building's roof, readable at night too; `online` puts a green
  // dot before a friend's name. Calling it again replaces the tag.
  addNameTag(place, online = false) {
    this.clearNameTag(place.id)
    const text = this.add.text(0, 0, place.label, {
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#3f2e24',
    })
    text.setOrigin(0.5).setResolution(2)
    text.texture.setFilter(Phaser.Textures.FilterMode.LINEAR)
    const dot = online ? 22 : 0
    const w = text.width + 32 + dot
    const h = 42
    text.setX(dot / 2)
    const accent = Phaser.Display.Color.HexStringToColor(place.accent).color
    const pill = this.add.graphics()
    pill.fillStyle(0xfffdf9, 0.96).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2)
    pill.lineStyle(4, accent, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2)
    if (online) pill.fillStyle(ONLINE_GREEN, 1).fillCircle(-w / 2 + 22, 0, 7)
    // above the chosen building's glow, which would otherwise wash over the name
    const tag = this.add.container(place.x + place.w / 2, place.y + 4, [pill, text]).setDepth(SKY_DEPTH + 30)
    if (!this.reducedMotion) this.tweens.add({ targets: tag, y: tag.y - 8, duration: 1400, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
    this.tags[place.id] = tag
  }

  clearNameTag(id) {
    const old = this.tags[id]
    if (!old) return
    this.tweens.killTweensOf(old)
    old.destroy()
    delete this.tags[id]
  }

  select(place) {
    if (this.busy) return
    this.releaseFriend()
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

  // Lights a soft glow round the building's own shape, or puts it out when place is null.
  outline(place) {
    const art = place && (place.art ?? place.id)
    const box = art && mapData.buildings[art]
    this.tweens.killTweensOf(this.halo)
    for (const [id, sign] of Object.entries(this.signs)) sign.setChosen(id === place?.id)
    if (!box) {
      this.haloFor = null
      this.halo.setVisible(false)
      return
    }
    this.haloFor = place.id
    this.halo
      .setTexture(this.haloTexture(this.pops[place.id]?.image.texture.key ?? `building-${art}`))
      .setPosition(box.x + box.w / 2, box.y + box.h + HALO)
      .setScale(1)
      .setAlpha(0)
      .setVisible(true)
    this.tweens.add({ targets: this.halo, alpha: 1, duration: this.reducedMotion ? 0 : 200 })
    if (!this.reducedMotion) {
      this.tweens.add({ targets: this.halo, alpha: 0.65, delay: 200, duration: 1000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
    }
  }

  // The glow for one building picture, drawn once from it: a soft white haze round its outline,
  // with a hole where the building is so the glow never covers it.
  haloTexture(look) {
    const key = `halo-${look}`
    if (this.textures.exists(key)) return key
    const picture = this.textures.get(look).getSourceImage()
    const w = picture.width
    const h = picture.height
    const shape = document.createElement('canvas')
    shape.width = w
    shape.height = h
    const s = shape.getContext('2d')
    s.drawImage(picture, 0, 0)
    s.globalCompositeOperation = 'source-in'
    s.fillStyle = '#ffffff'
    s.fillRect(0, 0, w, h)

    const glow = document.createElement('canvas')
    glow.width = w + HALO * 2
    glow.height = h + HALO * 2
    const g = glow.getContext('2d')
    g.shadowColor = '#fffbe6'
    // a wide haze, then a brighter edge close in
    g.shadowBlur = HALO
    for (let i = 0; i < 3; i++) g.drawImage(shape, HALO, HALO)
    g.shadowBlur = HALO / 4
    for (let i = 0; i < 2; i++) g.drawImage(shape, HALO, HALO)
    g.shadowBlur = 0
    g.globalCompositeOperation = 'destination-out'
    g.drawImage(shape, HALO, HALO)
    this.textures.addCanvas(key, glow)
    return key
  }

  // Glide to a place (from the Places list) and select it. On the first tour ({ tour: true })
  // the camera pulls back to show the town, then zooms in on the building as it arrives.
  focusPlace(id, { tour = false } = {}) {
    const place = ALL_PLACES.find((p) => p.id === id)
    if (!place || this.busy) return
    this.stopFollowing()
    const cam = this.cameras.main
    const cx = place.x + place.w / 2
    const cy = place.y + place.h / 2
    this.tourZoomIn?.remove()
    this.tourSettle?.remove()
    this.spotPlace = null
    if (tour) {
      const frame = this.tourFrame(place)
      // already framed on it (as on arrival), allowing for the map's edge stopping the camera
      const there =
        Math.abs(cam.zoom - frame.zoom) < 0.01 &&
        Math.abs(cam.scrollX - cam.clampX(frame.x - cam.width / 2)) < 40 &&
        Math.abs(cam.scrollY - cam.clampY(frame.y - cam.height / 2)) < 40
      if (this.reducedMotion || there) {
        cam.setZoom(frame.zoom)
        cam.centerOn(frame.x, frame.y)
      } else {
        cam.zoomTo(this.minZoom, TOUR_LEG, 'Sine.easeInOut', true)
        cam.pan(frame.x, frame.y, TOUR_LEG * 2, 'Sine.easeInOut', true)
        this.tourZoomIn = this.time.delayedCall(TOUR_LEG, () => cam.zoomTo(frame.zoom, TOUR_LEG, 'Sine.easeInOut', true))
      }
      // the camera's view updates on the next frame
      this.tourSettle = this.time.delayedCall(this.reducedMotion || there ? 30 : TOUR_LEG * 2 + 30, () => {
        this.spotPlace = place
        this.reportSpot(place)
      })
    } else if (this.reducedMotion) cam.centerOn(cx, cy)
    else cam.pan(cx, cy, 700, 'Sine.easeInOut', true)
    this.select(place)
  }

  zoomBy(factor) {
    this.zoomAround(this.cameras.main.zoom * factor, this.scale.width / 2, this.scale.height / 2)
  }

  // Where the tour puts the camera for a place: close enough to see it, small enough to leave the
  // lower half of the screen free, with the building's centre TOUR_AT down the screen.
  tourFrame(place) {
    const { width, height } = this.scale
    const zoom = Phaser.Math.Clamp(
      Math.min(TOUR_ZOOM, (height * TOUR_FILL_H) / place.h, (width * TOUR_FILL_W) / place.w),
      this.minZoom,
      MAX_ZOOM,
    )
    return { zoom, x: place.x + place.w / 2, y: place.y + place.h / 2 + (height * (0.5 - TOUR_AT)) / zoom }
  }

  // Tells the page where the place is on screen (the camera may have stopped short at the map's edge).
  reportSpot(place) {
    const cam = this.cameras.main
    const view = cam.worldView
    this.onTourSpot?.({
      id: place.id,
      x: (place.x - view.x) * cam.zoom,
      y: (place.y - view.y) * cam.zoom,
      w: place.w * cam.zoom,
      h: place.h * cam.zoom,
    })
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
    this.releaseFriend()
    this.outline(null)
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
