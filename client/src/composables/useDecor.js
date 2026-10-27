import { computed, ref } from 'vue'
import { FURNITURE } from '@/buildings/house/furniture.js'

// everything the Shop sells: the house's furniture library, drawn in the room's own pixel style
export const DECOR_CATALOG = [...FURNITURE]

// the room's small surfaces
const SHELF_ZONES = new Set(['seat', 'nightstand', 'side-table'])
// zones that take only their own kind of piece
const OWN_ZONES = new Set(['wall', 'chair', 'curtains', 'bed'])
// zones with room for one piece: a new one sends the one there back to the inventory
const ONE_ZONES = new Set(['chair', 'curtains', 'bed'])

const credits = ref(480)
const inventory = ref([])
const placed = ref([])
const shopOpen = ref(false)
const inventoryOpen = ref(false)
const pending = ref(null)
const placing = ref(null)
const selected = ref(null)
const drag = ref(null)
const notice = ref(null)
const sparkle = ref(null)

let nextUid = 1
let noticeTimer = 0
let sparkleTimer = 0

export function decorMeta(id) {
  return DECOR_CATALOG.find((item) => item.id === id)
}

function askBuy(item) {
  pending.value = item
}

function confirmBuy() {
  const item = pending.value
  if (!item || credits.value < item.price) return
  credits.value -= item.price
  inventory.value = [...inventory.value, { uid: nextUid++, id: item.id }]
  pending.value = null
  shopOpen.value = false
  inventoryOpen.value = true
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

function placeOn(zone, x, entry = placing.value) {
  if (!entry) return false
  const meta = decorMeta(entry.id)
  if (!meta || !fitsZone(meta, zone)) return false
  const min = 0.12
  const max = zone === 'room' ? 0.72 : 0.88
  // a spot on the wall, the reading nook, the window or the bed is exact: what goes there goes on that spot
  const exact = OWN_ZONES.has(zone)
  let next = exact ? Number(x) : Math.min(max, Math.max(min, Number(x) || 0.5))
  const crowded = !exact && placed.value.some((item) => item.zone === zone && Math.abs(item.x - next) < 0.08)
  if (crowded) next = Math.min(max, next + 0.1)
  // one reading chair (or pair of curtains, or set of bedding) at a time: the one already there
  // goes back to the inventory
  const swapped = ONE_ZONES.has(zone) ? placed.value.filter((item) => item.zone === zone) : []
  if (swapped.length) {
    placed.value = placed.value.filter((item) => item.zone !== zone)
    inventory.value = [...inventory.value, ...swapped.map(({ uid, id }) => ({ uid, id }))]
  }
  placed.value = [...placed.value, { uid: entry.uid, id: entry.id, zone, x: next }]
  inventory.value = inventory.value.filter((item) => item.uid !== entry.uid)
  placing.value = null
  return true
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
  const meta = decorMeta(item.id)
  flash(`${meta?.name || 'Piece'} ${meta?.plural ? 'are' : 'is'} back in your inventory`, 'ok')
}

export function useDecor() {
  const canAfford = computed(() => (pending.value ? credits.value >= pending.value.price : false))

  const placingMeta = computed(() => (placing.value ? decorMeta(placing.value.id) : null))

  return {
    catalog: DECOR_CATALOG,
    credits,
    inventory,
    placed,
    shopOpen,
    inventoryOpen,
    pending,
    placing,
    placingMeta,
    selected,
    drag,
    notice,
    sparkle,
    canAfford,
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
    pick,
    unplace,
  }
}
