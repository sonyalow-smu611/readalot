<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import { useDecor } from '@/composables/useDecor'
import DecorArt from '@/buildings/house/components/DecorArt.vue'

defineEmits(['mood'])

const menu = ref(null)
const panel = ref(null)
const open = ref(false)

const {
  catalog,
  inventory,
  shopOpen,
  inventoryOpen,
  pending,
  placing,
  canAfford,
  askBuy,
  confirmBuy,
  cancelBuy,
  startDrag,
  beginPlace,
} = useDecor()

function grab(event, entry) {
  if (event.button != null && event.button !== 0) return
  startDrag(entry, event.clientX, event.clientY)
}

function meta(id) {
  return catalog.find((item) => item.id === id)
}

// the Shop's items by group (Wall art, Reading chairs, Plants, Cats), in catalog order
const groups = computed(() => {
  const byName = new Map()
  for (const item of catalog) {
    if (!byName.has(item.group)) byName.set(item.group, [])
    byName.get(item.group).push(item)
  }
  return [...byName].map(([name, items]) => ({ name, items }))
})

function toggleDock() {
  open.value = !open.value
  if (!open.value) {
    shopOpen.value = false
    inventoryOpen.value = false
    pending.value = null
  }
}

function showShop() {
  inventoryOpen.value = false
  pending.value = null
  shopOpen.value = !shopOpen.value
}

function showInventory() {
  shopOpen.value = false
  pending.value = null
  inventoryOpen.value = !inventoryOpen.value
}

watch(open, async (isOpen) => {
  await nextTick()
  const items = menu.value?.querySelectorAll('.dock__item')
  if (!items?.length || prefersReducedMotion()) return
  if (isOpen) {
    gsap.fromTo(
      items,
      { y: 22, autoAlpha: 0, scale: 0.7 },
      { y: 0, autoAlpha: 1, scale: 1, stagger: 0.08, duration: 0.42, ease: 'back.out(2.4)' },
    )
  }
})

watch([shopOpen, inventoryOpen], async ([shop, bag]) => {
  if (!shop && !bag) return
  await nextTick()
  if (!panel.value || prefersReducedMotion()) return
  gsap.fromTo(panel.value, { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power3.out' })
})
</script>

<template>
  <div class="dock">
    <button
      type="button"
      class="dock__fab"
      :class="{ 'is-open': open }"
      :aria-expanded="open"
      data-tour="menu"
      aria-label="Room menu"
      @click="toggleDock"
    >
      <span class="dock__bars" aria-hidden="true"></span>
    </button>

    <section v-if="shopOpen && !placing" ref="panel" class="panel" aria-label="Decoration shop">
      <header class="panel__bar">
        <h2 class="panel__title">Shop</h2>
        <button type="button" class="panel__close" @click="shopOpen = false">Close</button>
      </header>
      <p class="panel__note">Swipe the row. Each card says where that piece can sit.</p>
      <div class="panel__row">
        <div v-for="group in groups" :key="group.name" class="panel__group" role="group" :aria-label="group.name">
          <p class="panel__group-name" aria-hidden="true">{{ group.name }}</p>
          <div class="panel__group-items">
            <button
              v-for="item in group.items"
              :key="item.id"
              type="button"
              class="dock-card"
              @click="askBuy(item)"
            >
              <span class="dock-card__art"><DecorArt :kind="item.id" /></span>
              <span class="dock-card__name" data-testid="card-name">{{ item.name }}</span>
              <span class="dock-card__price" data-testid="card-price">${{ item.price }}</span>
              <span class="dock-card__where">{{ item.blurb }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="inventoryOpen && !placing" ref="panel" class="panel" aria-label="Inventory">
      <header class="panel__bar">
        <h2 class="panel__title">Inventory</h2>
        <button type="button" class="panel__close" @click="inventoryOpen = false">Close</button>
      </header>
        <p v-if="!inventory.length" class="panel__empty">Buy something in the shop, then place it in the room.</p>
        <template v-else>
          <p class="panel__note">Tap a piece, then a glowing spot in the room. Or drag it onto one.</p>
          <div class="panel__row">
            <button
              v-for="entry in inventory"
              :key="entry.uid"
              type="button"
              class="dock-card dock-card--drag"
              @pointerdown="grab($event, entry)"
              @click="beginPlace(entry)"
            >
            <span class="dock-card__art"><DecorArt :kind="entry.id" /></span>
            <span class="dock-card__name">{{ meta(entry.id)?.name }}</span>
            <span class="dock-card__where">{{ meta(entry.id)?.blurb }}</span>
          </button>
        </div>
      </template>
    </section>

    <div v-if="pending" class="confirm" role="dialog" aria-labelledby="buy-title">
      <p id="buy-title" class="confirm__title">Buy {{ pending.name }}?</p>
      <p class="confirm__copy">
        ${{ pending.price }} comes out of your credits. {{ pending.blurb }}.
      </p>
      <p v-if="!canAfford" class="confirm__warn">Not enough credits.</p>
      <div class="confirm__actions">
        <button type="button" class="confirm__btn" :disabled="!canAfford" @click="confirmBuy">
          Confirm
        </button>
        <button type="button" class="confirm__btn confirm__btn--quiet" @click="cancelBuy">
          Cancel
        </button>
      </div>
    </div>

    <div v-show="open" ref="menu" class="dock__menu">
      <button type="button" class="dock__item" @click="$emit('mood')">
        <span class="dock__glyph" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7" />
            <path
              d="M8.5 14.2a4.2 4.2 0 0 0 7 0M9 10h.01M15 10h.01"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
            />
          </svg>
        </span>
        Mood check-in
      </button>
      <button type="button" class="dock__item" :class="{ 'is-on': inventoryOpen }" @click="showInventory">
        <span class="dock__glyph" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              d="M3 7h7v7H3zM14 7h7v7h-7zM3 16h7v5H3zM14 16h7v5h-7z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
            />
          </svg>
        </span>
        Inventory
      </button>
      <button type="button" class="dock__item" :class="{ 'is-on': shopOpen }" @click="showShop">
        <span class="dock__glyph" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              d="M6 8h12l-1.2 11H7.2L6 8z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linejoin="round"
            />
            <path d="M9 8V7a3 3 0 0 1 6 0v1" fill="none" stroke="currentColor" stroke-width="1.7" />
          </svg>
        </span>
        Shop
      </button>
    </div>
  </div>
</template>

<style scoped>
.dock {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 20;
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
  gap: 8px;
  pointer-events: none;
}

.dock__menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dock__item,
.dock__fab,
.panel,
.confirm {
  pointer-events: auto;
}

.dock__item {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 14px 0 12px;
  border: 1px solid var(--rl-line);
  border-radius: 999px;
  background: var(--rl-surface);
  color: var(--rl-text);
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(63, 46, 36, 0.15);
}

.dock__item.is-on {
  border-color: var(--house-accent, var(--rl-primary));
  background: var(--house-accent, var(--rl-primary));
  color: var(--rl-surface);
}

.dock__glyph {
  display: grid;
  place-items: center;
  line-height: 1;
}

.dock__fab {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border: 1px solid var(--rl-line);
  border-radius: 50%;
  background: var(--rl-surface);
  color: var(--rl-text);
  box-shadow: 0 4px 14px rgba(63, 46, 36, 0.15);
}

.dock__fab.is-open {
  border-color: var(--house-accent, var(--rl-primary));
  background: var(--house-accent, var(--rl-primary));
  color: var(--rl-surface);
}

.dock__bars,
.dock__bars::before,
.dock__bars::after {
  display: block;
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: currentColor;
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.dock__bars {
  position: relative;
}

.dock__bars::before,
.dock__bars::after {
  content: '';
  position: absolute;
  left: 0;
}

.dock__bars::before {
  top: -5px;
}

.dock__bars::after {
  top: 5px;
}

.dock__fab.is-open .dock__bars {
  transform: rotate(45deg);
}

.dock__fab.is-open .dock__bars::before {
  transform: translateY(5px) rotate(90deg);
}

.dock__fab.is-open .dock__bars::after {
  transform: translateY(-5px) rotate(90deg);
}

.panel {
  align-self: stretch;
  padding: 14px 14px 16px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-modal, 22px);
  background: var(--rl-surface);
  box-shadow: 0 14px 36px rgba(63, 46, 36, 0.25);
}

.panel__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

/* a pill in the house's colour, like the place card's tab */
.panel__title {
  margin: 0;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--house-accent, var(--rl-accent));
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--rl-surface);
}

.panel__note,
.panel__empty {
  margin: 6px 0 10px;
  color: var(--rl-muted);
  font-size: 0.75rem;
  line-height: 1.35;
}

.panel__close,
.confirm__btn {
  border: 0;
  background: transparent;
  color: var(--rl-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.panel__row {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  padding-bottom: 4px;
  touch-action: pan-x;
}

/* each group in the Shop's row: its name over its cards */
.panel__group {
  flex-shrink: 0;
}

.panel__group-name {
  margin: 0 0 4px 2px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--rl-muted);
}

.panel__group-items {
  display: flex;
  gap: 10px;
}

.dock-card--drag {
  touch-action: none;
  cursor: grab;
}

.dock-card {
  flex: 0 0 112px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 6px 10px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-card);
  background: var(--rl-surface);
  color: var(--rl-text);
  text-align: center;
}

.dock-card__art {
  display: grid;
  place-items: end center;
  width: 100%;
  height: 64px;
}

.dock-card__art :deep(.art) {
  height: 58px;
}

.dock-card__name,
.dock-card__price,
.dock-card__where {
  font-size: 0.68rem;
  line-height: 1.25;
}

.dock-card__price,
.dock-card__where {
  color: var(--rl-muted);
}

.confirm {
  align-self: stretch;
  padding: 16px 18px 18px;
  border: 1px solid var(--rl-line);
  border-radius: var(--rl-radius-modal, 22px);
  background: var(--rl-surface);
  box-shadow: 0 14px 36px rgba(63, 46, 36, 0.25);
}

.confirm__title {
  margin: 0 0 6px;
  font-family: var(--font-serif);
  font-size: 1.05rem;
  color: var(--rl-text);
}

.confirm__copy,
.confirm__warn {
  margin: 0 0 12px;
  font-size: 0.82rem;
  color: var(--rl-muted);
}

.confirm__warn {
  color: #8a3d3d;
}

.confirm__actions {
  display: flex;
  gap: 8px;
}

.confirm__btn {
  flex: 1;
  min-height: 44px;
  padding: 8px 10px;
  border-radius: 999px;
  background: var(--house-accent, var(--rl-primary));
  color: var(--rl-surface);
}

.confirm__btn:disabled {
  opacity: 0.4;
}

.confirm__btn--quiet {
  border: 1px solid var(--rl-line);
  background: var(--rl-surface);
  color: var(--rl-text);
}

@media (prefers-reduced-motion: reduce) {
  .dock__bars,
  .dock__bars::before,
  .dock__bars::after {
    transition: none;
  }
}
</style>
