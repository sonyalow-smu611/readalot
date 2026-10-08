<script setup>
// Pets roam the floor in a loop: walk, sleep, and — once bought — eat or drink.
// Motion is translate and scale only.
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import DecorPiece from '@/components/DecorPiece.vue'

const props = defineProps({
  pets: { type: Array, default: () => [] },
  hasFood: { type: Boolean, default: false },
  hasDrink: { type: Boolean, default: false },
  selected: { type: [Number, String], default: null },
})

const emit = defineEmits(['pick', 'remove'])

const root = ref(null)
const loops = new Map()

function stop(uid) {
  loops.get(uid)?.kill()
  loops.delete(uid)
}

function start(el, index) {
  const uid = el.dataset.uid
  stop(uid)
  const bounds = () => {
    const width = el.parentElement?.clientWidth || 280
    const height = el.parentElement?.clientHeight || 120
    return {
      minX: 6,
      maxX: Math.max(28, width - 90),
      depth: Math.max(0, height - 76),
    }
  }
  const spot = () => {
    const box = bounds()
    return {
      x: box.minX + Math.random() * (box.maxX - box.minX),
      y: -(Math.random() * box.depth),
    }
  }
  const home = spot()
  let prev = home.x
  el.dataset.pose = 'walk'
  el.dataset.face = 'right'
  if (prefersReducedMotion()) {
    gsap.set(el, home)
    return
  }
  gsap.set(el, home)

  const timeline = gsap.timeline({ repeat: -1 })
  const walkTo = (point, duration) => {
    timeline.call(() => {
      el.dataset.pose = 'walk'
    })
    timeline.to(el, {
      x: point.x,
      y: point.y,
      scale: 1 - Math.min(1, Math.abs(point.y) / (bounds().depth || 1)) * 0.16,
      duration,
      ease: 'sine.inOut',
      force3D: false,
      onUpdate: () => {
        const current = Number(gsap.getProperty(el, 'x'))
        const y = Number(gsap.getProperty(el, 'y'))
        if (Math.abs(current - prev) > 0.4) el.dataset.face = current > prev ? 'right' : 'left'
        prev = current
        el.style.zIndex = String(30 + Math.round(y))
      },
    })
  }

  walkTo(spot(), 2.4 + index * 0.25)
  walkTo(spot(), 2.1)
  walkTo(spot(), 2.6)
  timeline.call(() => {
    el.dataset.pose = 'sleep'
  })
  timeline.to(el, { duration: 2.1 })

  if (props.hasFood) {
    timeline.call(() => {
      el.dataset.pose = 'eat'
    })
    timeline.to(el, { duration: 1.6 })
  }
  if (props.hasDrink) {
    timeline.call(() => {
      el.dataset.pose = 'drink'
    })
    timeline.to(el, { duration: 1.5 })
  }

  walkTo(home, 2.3)
  loops.set(uid, timeline)
}

async function sync() {
  await nextTick()
  const alive = new Set(props.pets.map((pet) => String(pet.uid)))
  loops.forEach((_, uid) => {
    if (!alive.has(uid)) stop(uid)
  })
  root.value?.querySelectorAll('.critter').forEach((el, index) => {
    if (!loops.has(el.dataset.uid)) start(el, index)
  })
}

onMounted(sync)

watch(() => [props.pets.map((pet) => pet.uid).join(','), props.hasFood, props.hasDrink], () => {
  loops.forEach((_, uid) => stop(uid))
  sync()
}, { immediate: true })

onBeforeUnmount(() => {
  loops.forEach((timeline) => timeline.kill())
  loops.clear()
})
</script>

<template>
  <div ref="root" class="life">
    <button
      v-for="pet in pets"
      :key="pet.uid"
      type="button"
      class="critter"
      :data-uid="pet.uid"
      :data-kind="pet.id"
      @click.stop="emit('pick', pet.uid)"
    >
      <span class="critter__flip">
        <span class="critter__bob" :data-decor-uid="pet.uid">
          <DecorPiece :kind="pet.id" />
        </span>
      </span>
      <span v-if="selected === pet.uid" class="critter__remove" @click.stop="emit('remove', pet.uid)">
        Remove
      </span>
    </button>
  </div>
</template>

<style scoped>
.life {
  position: absolute;
  left: 0;
  right: 18%;
  bottom: 0;
  height: 22%;
  z-index: 4;
  pointer-events: none;
}

.critter {
  position: absolute;
  left: 0;
  bottom: 0;
  padding: 0;
  border: 0;
  background: none;
  pointer-events: auto;
  cursor: pointer;
}

.critter__flip,
.critter__bob {
  display: block;
}

.critter__flip {
  filter: drop-shadow(0 3px 1px rgba(28, 27, 25, 0.28));
}

.critter :deep(.art) {
  height: 72px;
}

.critter[data-face='left'] .critter__flip {
  transform: scaleX(-1);
}

.critter[data-pose='walk'] :deep(.art) {
  animation: stride 0.32s ease-in-out infinite;
  transform-origin: 62% 100%;
}

.critter[data-kind='pet-bird'][data-pose='walk'] :deep(.art) {
  animation-duration: 0.22s;
}

.critter[data-pose='walk'] .critter__bob {
  animation: none;
}

.critter[data-pose='sleep'] .critter__bob {
  transform: scaleY(0.78) translateY(6px);
  transform-origin: center bottom;
}

.critter[data-pose='sleep']::after {
  content: 'z';
  position: absolute;
  top: -10px;
  right: -4px;
  color: var(--ink-muted);
  font-family: var(--font-serif);
  font-size: 0.75rem;
  animation: rise 1.4s ease-in-out infinite;
}

.critter[data-pose='eat'] .critter__bob,
.critter[data-pose='drink'] .critter__bob {
  animation: peck 0.42s ease-in-out infinite;
  transform-origin: center bottom;
}

.critter[data-pose='eat']::before,
.critter[data-pose='drink']::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -2px;
  width: 16px;
  height: 6px;
  border-radius: 0 0 8px 8px;
  transform: translateX(-50%);
}

.critter[data-pose='eat']::before {
  background: #c47a5a;
}

.critter[data-pose='drink']::before {
  background: #7eb0c8;
}

.critter__remove {
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  margin-bottom: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  background: #b42318;
  color: #fff;
  font-size: 0.68rem;
  white-space: nowrap;
}

@keyframes stride {
  0%, 100% { transform: translateY(0) scaleY(1); }
  35% { transform: translateY(-5px) scaleY(0.94); }
  70% { transform: translateY(0) scaleX(1.04); }
}

@keyframes bob {
  50% { transform: translateY(-3px); }
}

@keyframes peck {
  50% { transform: rotate(-8deg) translateY(2px); }
}

@keyframes rise {
  50% { transform: translateY(-4px); opacity: 0.4; }
}

@media (prefers-reduced-motion: reduce) {
  .critter[data-pose='walk'] :deep(.art),
  .critter[data-pose='walk'] .critter__bob,
  .critter[data-pose='eat'] .critter__bob,
  .critter[data-pose='drink'] .critter__bob,
  .critter[data-pose='sleep']::after {
    animation: none;
  }
}
</style>
