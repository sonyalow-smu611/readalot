import { computed, nextTick, ref } from 'vue'
import { gsap, prefersReducedMotion } from '@/lib/motion'

export const DECOR_CATALOG = [
  { id: 'vase-clay', name: 'Clay vase', group: 'Vases', price: 40, surface: 'shelf', blurb: 'On a bookshelf' },
  { id: 'vase-tall', name: 'Tall vase', group: 'Vases', price: 55, surface: 'shelf', blurb: 'On a bookshelf' },
  { id: 'vase-bud', name: 'Bud vase', group: 'Vases', price: 30, surface: 'shelf', blurb: 'On a bookshelf' },
  { id: 'statue-bust', name: 'Bust', group: 'Statues', price: 90, surface: 'shelf', blurb: 'On a bookshelf' },
  { id: 'statue-owl', name: 'Owl', group: 'Statues', price: 70, surface: 'shelf', blurb: 'On a bookshelf' },
  { id: 'statue-horse', name: 'Horse', group: 'Statues', price: 110, surface: 'shelf', blurb: 'On a bookshelf' },
  { id: 'sofa-low', name: 'Low sofa', group: 'Sofas', price: 180, surface: 'floor', blurb: 'On the room floor' },
  { id: 'sofa-love', name: 'Loveseat', group: 'Sofas', price: 140, surface: 'floor', blurb: 'On the room floor' },
  { id: 'bean-round', name: 'Round bag', group: 'Beanbags', price: 60, surface: 'floor', blurb: 'On the room floor' },
  { id: 'bean-slouch', name: 'Slouch bag', group: 'Beanbags', price: 50, surface: 'floor', blurb: 'On the room floor' },
  { id: 'mattress-floor', name: 'Floor bed', group: 'Mattresses', price: 120, surface: 'floor', blurb: 'On the room floor' },
  { id: 'mattress-day', name: 'Daybed', group: 'Mattresses', price: 160, surface: 'floor', blurb: 'On the room floor' },
  { id: 'food-bowl', name: 'Food dish', group: 'Dispensers', price: 40, surface: 'floor', blurb: 'On the floor. Pets can eat.' },
  { id: 'drink-fountain', name: 'Water dish', group: 'Dispensers', price: 40, surface: 'floor', blurb: 'On the floor. Pets can drink.' },
  { id: 'cat-siamese', name: 'Siamese', group: 'Cats', price: 80, surface: 'floor', pet: true, blurb: 'Roams the floor' },
  { id: 'cat-maine', name: 'Maine Coon', group: 'Cats', price: 90, surface: 'floor', pet: true, blurb: 'Roams the floor' },
  { id: 'cat-persian', name: 'Persian', group: 'Cats', price: 85, surface: 'floor', pet: true, blurb: 'Roams the floor' },
  { id: 'cat-bengal', name: 'Bengal', group: 'Cats', price: 95, surface: 'floor', pet: true, blurb: 'Roams the floor' },
  { id: 'cat-british', name: 'British Shorthair', group: 'Cats', price: 80, surface: 'floor', pet: true, blurb: 'Roams the floor' },
  { id: 'dog-husky', name: 'Husky', group: 'Dogs', price: 90, surface: 'floor', pet: true, blurb: 'Roams the floor' },
  { id: 'dog-corgi', name: 'Corgi', group: 'Dogs', price: 85, surface: 'floor', pet: true, blurb: 'Roams the floor' },
  { id: 'dog-pug', name: 'Pug', group: 'Dogs', price: 70, surface: 'floor', pet: true, blurb: 'Roams the floor' },
  { id: 'dog-golden', name: 'Golden retriever', group: 'Dogs', price: 95, surface: 'floor', pet: true, blurb: 'Roams the floor' },
  { id: 'pet-bird', name: 'Cockatiel', group: 'Birds', price: 45, surface: 'floor', pet: true, blurb: 'Hops along the floor' },
]

const SHELF_ZONES = new Set(['case-top', 'case-low', 'reading', 'tbr', 'read'])

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

function settle(uid) {
  nextTick(() => {
    const el = document.querySelector(`[data-decor-uid="${uid}"]`)
    if (!el || prefersReducedMotion()) return
    gsap.from(el, { scale: 0.2, y: -24, duration: 0.5, ease: 'back.out(2.2)' })
  })
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

function placeOn(zone, x, entry = placing.value) {
  if (!entry) return false
  const meta = decorMeta(entry.id)
  if (!meta) return false
  const onShelf = SHELF_ZONES.has(zone)
  if (meta.surface === 'floor' && zone !== 'room') return false
  if (meta.surface === 'shelf' && !onShelf) return false
  const min = 0.12
  const max = zone === 'room' ? 0.72 : 0.88
  let next = Math.min(max, Math.max(min, Number(x) || 0.5))
  const crowded = placed.value.some((item) => item.zone === zone && Math.abs(item.x - next) < 0.08)
  if (crowded) next = Math.min(max, next + 0.1)
  placed.value = [...placed.value, { uid: entry.uid, id: entry.id, zone, x: next }]
  inventory.value = inventory.value.filter((item) => item.uid !== entry.uid)
  placing.value = null
  if (!meta.pet) settle(entry.uid)
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
  flash(`${decorMeta(item.id)?.name || 'Piece'} is back in your inventory`, 'ok')
}

export function useDecor() {
  const canAfford = computed(() => (pending.value ? credits.value >= pending.value.price : false))

  const ownedIds = computed(() => {
    const ids = new Set(inventory.value.map((item) => item.id))
    placed.value.forEach((item) => ids.add(item.id))
    return ids
  })

  const hasFood = computed(() => ownedIds.value.has('food-bowl'))
  const hasDrink = computed(() => ownedIds.value.has('drink-fountain'))

  const placingMeta = computed(() => (placing.value ? decorMeta(placing.value.id) : null))

  function placedIn(zone) {
    return placed.value.filter((item) => item.zone === zone)
  }

  return {
    catalog: DECOR_CATALOG,
    credits,
    inventory,
    placed,
    placedIn,
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
    hasFood,
    hasDrink,
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
