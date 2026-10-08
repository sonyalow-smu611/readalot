<script setup>
// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/PageHeader.vue'
import StickerCard from '@/components/StickerCard.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useReveal } from '@/composables/useReveal'
import { useUserStore } from '@/stores/user'

const PLACEHOLDER_ROWS = 3

const page = ref(null)
useReveal(page)

const { readers } = storeToRefs(useUserStore())
</script>

<template>
  <section ref="page" class="view">
    <PageHeader
      data-reveal
      eyebrow="Your reading crew"
      title="People"
      subtitle="Readers nearby who share your taste."
      emoji="👯"
      color="lilac"
    />

    <StickerCard data-reveal class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="h6 mb-0">🫶 {{ readers.length }} readers want to say hi</h2>
        <span class="sticker-tag">Coming soon</span>
      </div>
      <ul class="list-unstyled d-flex flex-column gap-3 mb-0">
        <li v-for="row in PLACEHOLDER_ROWS" :key="row" class="d-flex align-items-center gap-3">
          <SkeletonBlock width="48px" height="48px" radius="50%" />
          <div class="flex-grow-1 d-flex flex-column gap-2">
            <SkeletonBlock width="60%" />
            <SkeletonBlock width="35%" height="10px" />
          </div>
        </li>
      </ul>
    </StickerCard>

    <EmptyState
      data-reveal
      emoji="🤝"
      title="Your book buddies are on the way"
      message="Soon you'll see readers near you, how compatible your shelves are, and what they're reading right now."
      color="lilac"
    />
  </section>
</template>
