import { computed, ref } from 'vue'
import { FURNITURE } from '@/buildings/house/furniture.js'
import { getRoomFurniture, saveRoomFurniture } from '@/services/api.js'
import { useProgressStore } from '@/stores/progress.js'

// everything the Shop sells: the house's furniture library, drawn in the room's own pixel style
export const DECOR_CATALOG = [...FURNITURE]

// the room's small surfaces
const SHELF_ZONES = new Set(['seat', 'nightstand', 'side-table'])
// zones that take only their own kind of piece
const OWN_ZONES = new Set(['wall', 'chair', 'curtains', 'bed'])
// zones with room for one piece: a new one sends the one there back to the inventory
const ONE_ZONES = new Set(['chair', 'curtains', 'bed'])

// the reader's coins are saved with their progress (stores/progress.js); set by useDecor()
let progress = null
const inventory = ref([])
const placed = ref([])
const shopOpen = ref(false)
const inventoryOpen = ref(false)
// the room menu (Mood check-in, Inventory, Shop) is open: the room shows which pieces can be tapped
const menuOpen = ref(false)
const pending = ref(null)
const placing = ref(null)
const selected = ref(null)
const drag = ref(null)
const notice = ref(null)
const sparkle = ref(null)

let noticeTimer = 0
let sparkleTimer = 0
// whose furniture is held here (their account id), loaded from and saved to the server
let owner = null
// '' before it's asked for, then 'loading', 'ready' or 'error'
const roomStatus = ref('')

// a piece's id, unique across devices so pieces bought on two never clash
function newUid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function decorMeta(id) {
  return DECOR_CATALOG.find((item) => item.id === id)
}

// Loads a reader's furniture when their room opens: once per reader, so it stays as it is while
// they look around the app. Another reader signing in starts from their own.
async function loadRoom(readerId) {
  if (!readerId || owner === readerId) return
  owner = readerId
  inventory.value = []
  placed.value = []
  roomStatus.value = 'loading'
  try {
    const { pieces } = await getRoomFurniture(readerId)
    if (owner !== readerId) return
    inventory.value = pieces.filter((piece) => !piece.zone).map(({ uid, id }) => ({ uid, id }))
    placed.value = pieces.filter((piece) => piece.zone)
    roomStatus.value = 'ready'
  } catch {
    // asking again tries again
    owner = null
    roomStatus.value = 'error'
  }
}

// Saves the whole room after a change: the inventory, then the placed pieces. One save at a time,
// so a slow one can't land after a newer one: a change made while one runs is saved right after.
let saving = false
let saveAgain = false
async function saveRoom() {
  if (!owner) return
  if (saving) {
    saveAgain = true
    return
  }
  saving = true
  try {
    do {
      saveAgain = false
      try {
        await saveRoomFurniture(owner, [...inventory.value, ...placed.value])
      } catch {
        flash("Couldn't save your room. Your next change will try again.", 'bad')
      }
    } while (saveAgain && owner)
  } finally {
    saving = false
  }
}

function askBuy(item) {
  pending.value = item
}

// The coins come off (and are saved) before the piece goes in the inventory.
async function confirmBuy() {
  const item = pending.value
  if (!item || !progress || progress.coins < item.price) return
  pending.value = null
  shopOpen.value = false
  if (!(await progress.spend(item.price))) {
    flash(`Couldn't buy the ${item.name}. Try again.`, 'bad')
    return
  }
  inventory.value = [...inventory.value, { uid: newUid(), id: item.id }]
  inventoryOpen.value = true
  saveRoom()
}

function cancelBuy() {
  pending.value = null
}

function beginPlace(entry) {
  placing.value = { uid: entry.uid, id: entry.id }
  selected.value = null
  inventoryOpen.value = false
  shopOpen.value = false
  pending.value = null
}

function startDrag(entry, x, y) {
  drag.value = { uid: entry.uid, id: entry.id, x, y, ox: x, oy: y, moved: false }
  selected.value = null
  pending.value = null
}

function moveDrag(x, y) {
  const current = drag.value
  if (!current) return
  const moved = current.moved || Math.hypot(x - current.ox, y - current.oy) > 8
  if (moved && !current.moved) {
    inventoryOpen.value = false
    shopOpen.value = false
  }
  drag.value = { ...current, x, y, moved }
}

function endDrag() {
  const current = drag.value
  drag.value = null
  return current
}

function flash(text, tone) {
  notice.value = { text, tone, key: Date.now() }
  window.clearTimeout(noticeTimer)
  noticeTimer = window.setTimeout(() => {
    notice.value = null
  }, 1700)
}

function burst(x, y) {
  sparkle.value = { x, y, key: Date.now() }
  window.clearTimeout(sparkleTimer)
  sparkleTimer = window.setTimeout(() => {
    sparkle.value = null
  }, 700)
}

function cancelPlace() {
  placing.value = null
}

// whether a piece can go in a zone: floor pieces on the room's floor, shelf pieces on the small
// surfaces, wall art on the wall, a reading chair in the reading nook, curtains at the window,
// bedding on the bed
export function fitsZone(meta, zone) {
  // the wall, the reading nook, the window and the bed take only their own kind of piece
  if (OWN_ZONES.has(meta.surface) || OWN_ZONES.has(zone)) return meta.surface === zone
  if (meta.surface === 'floor') return zone === 'room'
  if (meta.surface === 'shelf') return SHELF_ZONES.has(zone)
  return true
}

// Puts a piece on `spot` in `zone`: { x } (0 to 1 along the zone) and, for a piece that can stand
// anywhere, `at`, the point in the room it stands on (see buildings/house/strip/placement.js,
// which says where a piece fits).
function placeOn(zone, spot, entry = placing.value) {
  if (!entry) return false
  const meta = decorMeta(entry.id)
  if (!meta || !fitsZone(meta, zone)) return false
  // one reading chair (or pair of curtains, or set of bedding) at a time: the one already there
  // goes back to the inventory
  const swapped = ONE_ZONES.has(zone) ? placed.value.filter((item) => item.zone === zone) : []
  if (swapped.length) {
    placed.value = placed.value.filter((item) => item.zone !== zone)
    inventory.value = [...inventory.value, ...swapped.map(({ uid, id }) => ({ uid, id }))]
  }
  placed.value = [...placed.value, { uid: entry.uid, id: entry.id, zone, x: spot.x, ...(spot.at && { at: spot.at }) }]
  inventory.value = inventory.value.filter((item) => item.uid !== entry.uid)
  placing.value = null
  saveRoom()
  return true
}

// Moves a placed piece to `at` in `zone` (somewhere it fits). A move shows as it goes, so the room
// saves when the move ends (saveRoom), not here.
function moveTo(uid, zone, at) {
  placed.value = placed.value.map((item) => (item.uid === uid ? { ...item, zone, at } : item))
}

function pick(uid) {
  if (placing.value) return
  selected.value = selected.value === uid ? null : uid
}

function unplace(uid) {
  const item = placed.value.find((entry) => entry.uid === uid)
  if (!item) return
  placed.value = placed.value.filter((entry) => entry.uid !== uid)
  inventory.value = [...inventory.value, { uid: item.uid, id: item.id }]
  selected.value = null
  saveRoom()
  const meta = decorMeta(item.id)
  flash(`${meta?.name || 'Piece'} ${meta?.plural ? 'are' : 'is'} back in your inventory`, 'ok')
}

export function useDecor() {
  progress = useProgressStore()
  const credits = computed(() => progress.coins)
  const canAfford = computed(() => (pending.value ? credits.value >= pending.value.price : false))

  const placingMeta = computed(() => (placing.value ? decorMeta(placing.value.id) : null))

  return {
    catalog: DECOR_CATALOG,
    credits,
    inventory,
    placed,
    shopOpen,
    inventoryOpen,
    menuOpen,
    pending,
    placing,
    placingMeta,
    selected,
    drag,
    notice,
    sparkle,
    canAfford,
    roomStatus,
    loadRoom,
    saveRoom,
    askBuy,
    confirmBuy,
    cancelBuy,
    beginPlace,
    startDrag,
    moveDrag,
    endDrag,
    flash,
    burst,
    cancelPlace,
    placeOn,
    moveTo,
    pick,
    unplace,
  }
}
