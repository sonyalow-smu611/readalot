<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The coin balance (shared with the room) and a way to the shop.
import { computed } from 'vue'
import CreditChip from '@/components/CreditChip.vue'
import ProfileBlock from '@/buildings/salon/components/ProfileBlock.vue'

const props = defineProps({
  // decorations owned, placed or not
  decorCount: { type: Number, default: 0 },
})

const emit = defineEmits(['shop'])

const note = computed(() => {
  const n = props.decorCount
  return n ? `${n} decoration${n === 1 ? '' : 's'} owned` : 'Spend them on decorations and pets for your room.'
})
</script>

<template>
  <ProfileBlock title="Coins">
    <div class="coins">
      <div>
        <CreditChip class="coins__balance" />
        <p class="coins__note">{{ note }}</p>
      </div>
      <button type="button" class="btn btn-accent coins__shop" data-tour="profile-shop" @click="emit('shop')">
        Visit the shop
      </button>
    </div>
  </ProfileBlock>
</template>

<style scoped>
.coins__shop {
  flex: none;
}

.coins {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.coins__balance {
  font-size: 1.25rem;
}

.coins__note {
  margin: 6px 0 0;
  color: var(--rl-muted);
  font-size: 0.875rem;
}

</style>
