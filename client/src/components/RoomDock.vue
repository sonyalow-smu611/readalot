<script setup>
import { nextTick, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import { useDecor } from '@/composables/useDecor'
import DecorPiece from '@/components/DecorPiece.vue'

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
} = useDecor()

function grab(event, entry) {
  if (event.button != null && event.button !== 0) return
  startDrag(entry, event.clientX, event.clientY)
}

function meta(id) {
  return catalog.find((item) => item.id === id)
}

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
        <button
          v-for="item in catalog"
          :key="item.id"
          type="button"
          class="dock-card"
          @click="askBuy(item)"
        >
          <span class="dock-card__art"><DecorPiece :kind="item.id" /></span>
          <span class="dock-card__name">{{ item.name }}</span>
          <span class="dock-card__price">${{ item.price }}</span>
          <span class="dock-card__where">{{ item.blurb }}</span>
        </button>
      </div>
    </section>

    <section v-if="inventoryOpen && !placing" ref="panel" class="panel" aria-label="Inventory">
      <header class="panel__bar">
        <h2 class="panel__title">Inventory</h2>
        <button type="button" class="panel__close" @click="inventoryOpen = false">Close</button>
      </header>
        <p v-if="!inventory.length" class="panel__empty">Buy something in the shop, then drag it into the room.</p>
        <template v-else>
          <p class="panel__note">Drag a piece out. It settles on the floor or a shelf, whichever that piece belongs on.</p>
          <div class="panel__row">
            <button
              v-for="entry in inventory"
              :key="entry.uid"
              type="button"
              class="dock-card dock-card--drag"
              @pointerdown="grab($event, entry)"
            >
            <span class="dock-card__art"><DecorPiece :kind="entry.id" /></span>
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
  height: 40px;
  padding: 0 12px 0 10px;
  border: 1px solid rgba(63, 46, 36, 0.12);
  border-radius: 999px;
  background: var(--paper);
  color: var(--ink);
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 8px 18px rgba(63, 46, 36, 0.12);
}

.dock__item.is-on {
  background: var(--ink);
  color: var(--paper);
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
  border: 0;
  border-radius: 50%;
  background: var(--ink);
  color: var(--paper);
  box-shadow: 0 10px 22px rgba(63, 46, 36, 0.22);
}

.dock__bars,
.dock__bars::before,
.dock__bars::after {
  display: block;
  width: 16px;
  height: 1.5px;
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
  padding: 10px 10px 12px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--paper) 96%, transparent);
  box-shadow: 0 16px 40px rgba(63, 46, 36, 0.18);
}

.panel__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.panel__title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 500;
}

.panel__note,
.panel__empty {
  margin: 0 0 8px;
  color: var(--ink-muted);
  font-size: 0.75rem;
  line-height: 1.35;
}

.panel__close,
.confirm__btn {
  border: 0;
  background: transparent;
  color: var(--ink-muted);
  font-size: 0.78rem;
}

.panel__row {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  padding-bottom: 4px;
  touch-action: pan-x;
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
  border: 1px solid rgba(63, 46, 36, 0.08);
  border-radius: 12px;
  background: #fff;
  color: var(--ink);
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
  color: var(--ink-muted);
}

.confirm {
  align-self: stretch;
  padding: 14px;
  border-radius: 16px;
  background: var(--paper);
  box-shadow: 0 16px 40px rgba(63, 46, 36, 0.2);
}

.confirm__title {
  margin: 0 0 6px;
  font-family: var(--font-serif);
  font-size: 1.05rem;
}

.confirm__copy,
.confirm__warn {
  margin: 0 0 12px;
  font-size: 0.82rem;
  color: var(--ink-muted);
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
  padding: 8px 10px;
  border-radius: 999px;
  background: var(--ink);
  color: var(--paper);
}

.confirm__btn:disabled {
  opacity: 0.4;
}

.confirm__btn--quiet {
  background: transparent;
  color: var(--ink);
}

@media (prefers-reduced-motion: reduce) {
  .dock__bars,
  .dock__bars::before,
  .dock__bars::after {
    transition: none;
  }
}
</style>
