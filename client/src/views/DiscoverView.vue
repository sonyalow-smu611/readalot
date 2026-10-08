<script setup>
// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import StickerCard from '@/components/StickerCard.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useReveal } from '@/composables/useReveal'

const PLACEHOLDER_COVERS = 3

const page = ref(null)
useReveal(page)
</script>

<template>
  <section ref="page" class="view">
    <PageHeader
      data-reveal
      eyebrow="Find your next read"
      title="Discover"
      subtitle="Search, browse and stumble onto gems."
      emoji="🔭"
      color="mint"
    />

    <StickerCard data-reveal class="d-flex align-items-center gap-2 mb-4">
      <span class="fs-5" aria-hidden="true">🔍</span>
      <SkeletonBlock height="20px" />
    </StickerCard>

    <div class="d-flex justify-content-between align-items-center mb-3" data-reveal>
      <h2 class="h5 mb-0">Trending on Readalot</h2>
      <span class="sticker-tag">Coming soon</span>
    </div>

    <div class="row g-3 mb-4">
      <div v-for="cover in PLACEHOLDER_COVERS" :key="cover" class="col-4" data-reveal>
        <SkeletonBlock height="140px" radius="14px" class="mb-2" />
        <SkeletonBlock width="85%" height="10px" class="mb-1" />
        <SkeletonBlock width="55%" height="10px" />
      </div>
    </div>

    <EmptyState
      data-reveal
      emoji="🧭"
      title="Fresh picks are on their way"
      message="We're calibrating the recommendation compass. Soon you'll search millions of books right here."
      color="mint"
    />
  </section>
</template>
