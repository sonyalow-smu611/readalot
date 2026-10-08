<script setup>
// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import StickerCard from '@/components/StickerCard.vue'
import AppButton from '@/components/AppButton.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useReveal } from '@/composables/useReveal'

const page = ref(null)
useReveal(page)
</script>

<template>
  <section ref="page" class="view">
    <PageHeader
      data-reveal
      eyebrow="Shelve in a snap"
      title="Scan"
      subtitle="Point at a barcode, add it to your shelf."
      emoji="📷"
      color="tangerine"
    />

    <StickerCard data-reveal color="cream" class="mb-4">
      <div class="viewfinder mb-3" aria-hidden="true">
        <span class="viewfinder__corner viewfinder__corner--tl" />
        <span class="viewfinder__corner viewfinder__corner--tr" />
        <span class="viewfinder__corner viewfinder__corner--bl" />
        <span class="viewfinder__corner viewfinder__corner--br" />
        <span class="viewfinder__book">📕</span>
      </div>
      <AppButton variant="tangerine" block disabled>📸 Camera coming soon</AppButton>
    </StickerCard>

    <EmptyState
      data-reveal
      emoji="🔎"
      title="Point. Scan. Shelve."
      message="Barcode scanning lands in a later update. Your future shelf is already making space."
      color="butter"
    />
  </section>
</template>

<style scoped>
.viewfinder {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 3;
  background: var(--ink);
  border-radius: var(--radius-md);
}

.viewfinder__book {
  font-size: 3.5rem;
  animation: bob 2.4s ease-in-out infinite;
}

.viewfinder__corner {
  position: absolute;
  width: 36px;
  height: 36px;
  border: 4px solid var(--butter);
}

.viewfinder__corner--tl { top: 16px; left: 16px; border-right: 0; border-bottom: 0; border-top-left-radius: 12px; }
.viewfinder__corner--tr { top: 16px; right: 16px; border-left: 0; border-bottom: 0; border-top-right-radius: 12px; }
.viewfinder__corner--bl { bottom: 16px; left: 16px; border-right: 0; border-top: 0; border-bottom-left-radius: 12px; }
.viewfinder__corner--br { bottom: 16px; right: 16px; border-left: 0; border-top: 0; border-bottom-right-radius: 12px; }

@keyframes bob {
  0%, 100% { transform: translateY(0) rotate(-4deg); }
  50% { transform: translateY(-10px) rotate(4deg); }
}
</style>
