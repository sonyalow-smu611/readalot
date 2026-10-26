// Loads the bedroom exported from Blender (client/blender) and finds the named markers in it.
// The marker names are listed at the top of client/blender/build_room.py.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export const ROOM_URL = '/room/bedroom.glb'

// Boxes that only say where things are; they are never drawn.
const HIDDEN = /^(hit\.|hotspot\.|shelf\.)/

// The room as remodelled by hand names its tap targets `hotspot.<name>`, some by other names
// than the app uses; `hit.<name>` from the old build script still works.
const HOTSPOT_NAMES = { bookcase: 'bookshelf', note: 'corkboard' }
const NOT_TAPPABLE = new Set(['shelves', 'floor'])

function worldBox(object) {
  return new THREE.Box3().setFromObject(object)
}

function shelfOf(node, name) {
  node.geometry.computeBoundingBox()
  return {
    row: Number(name.slice(6)),
    box: worldBox(node),
    frame: node.matrixWorld.clone(),
    inside: node.geometry.boundingBox.clone(),
  }
}

function worldPoint(object) {
  return object.getWorldPosition(new THREE.Vector3())
}

export async function loadRoom(url = ROOM_URL) {
  const gltf = await new GLTFLoader().loadAsync(url)
  const scene = gltf.scene
  scene.updateMatrixWorld(true)

  const room = {
    scene,
    view: null,
    hits: {},
    // one per row of the bookcase, row 0 at the top: { row, box, frame, inside }. `box` is where
    // it is in the room; `frame` places the shelf's own space in the room, in which `inside`
    // runs along x, up y, and out of the bookcase towards +z, whichever wall it stands on
    shelves: [],
    slots: [],
    walks: [],
    glass: [],
    sky: [],
    // where the window glass is: the view outside is shown behind it
    windowView: null,
    clock: { hour: null, minute: null },
    // bookshelf.blend's hero book, never drawn itself: { template, clip } (see bookOpen.js)
    herobook: null,
    lamp: { shade: null, light: null },
    // everything solid, for checking whether furniture hides a point
    solids: [],
  }

  scene.traverse((node) => {
    // the loader takes the dots out of `node.name`; the name as written in Blender is kept here
    const name = node.userData.name ?? node.name
    if (node.isCamera) {
      room.view = {
        position: worldPoint(node),
        quaternion: node.getWorldQuaternion(new THREE.Quaternion()),
        fov: node.fov,
      }
      return
    }
    if (HIDDEN.test(name)) node.visible = false

    if (name.startsWith('hit.')) room.hits[name.slice(4)] = worldBox(node)
    else if (name.startsWith('hotspot.')) {
      const id = name.slice(8)
      if (!NOT_TAPPABLE.has(id)) room.hits[HOTSPOT_NAMES[id] ?? id] = worldBox(node)
    } else if (name.startsWith('shelf.')) room.shelves.push(shelfOf(node, name))
    else if (name.startsWith('slot.')) {
      room.slots.push({
        id: name.slice(5),
        zone: node.userData.zone,
        x: Number(node.userData.x),
        point: worldPoint(node),
      })
    } else if (name.startsWith('walk.')) room.walks.push(worldPoint(node))
    else if (name.startsWith('glass.') && node.isMesh) room.glass.push(node)
    else if (name.startsWith('sky.') && node.isMesh) room.sky.push(node)
    else if (name === 'clock.hour') room.clock.hour = node
    else if (name === 'clock.minute') room.clock.minute = node
    else if (name === 'lamp.shade') room.lamp.shade = node
    else if (name === 'lamp.light') room.lamp.light = worldPoint(node)
    else if (name === 'herobook') {
      node.visible = false
      // its one animation opens the cover and flips the pages
      room.herobook = { template: node, clip: gltf.animations[0] ?? null }
    }

    if (node.isMesh && node.visible && !name.startsWith('glass.') && !name.startsWith('sky.')) {
      node.castShadow = true
      node.receiveShadow = true
      room.solids.push(node)
    }
  })

  // a mesh with several materials loads as a group of meshes; a hidden group hides them too
  room.solids = room.solids.filter((mesh) => isShown(mesh))
  if (room.glass.length) {
    room.windowView = room.glass.reduce((box, pane) => box.union(worldBox(pane)), new THREE.Box3())
  }
  return room
}

function isShown(node) {
  for (let current = node; current; current = current.parent) {
    if (!current.visible) return false
  }
  return true
}
