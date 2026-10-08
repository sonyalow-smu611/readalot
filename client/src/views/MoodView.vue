<script setup>
// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
import { computed, ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import StickerCard from '@/components/StickerCard.vue'
import AppButton from '@/components/AppButton.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useReveal } from '@/composables/useReveal'
import quotes from '@/data/quotes.json'

const page = ref(null)
useReveal(page)

const quoteIndex = ref(Math.floor(Math.random() * quotes.length))
const quote = computed(() => quotes[quoteIndex.value])

function showNextQuote() {
  quoteIndex.value = (quoteIndex.value + 1) % quotes.length
}
</script>

<template>
  <section ref="page" class="view">
    <PageHeader
      data-reveal
      eyebrow="Read how you feel"
      title="Mood"
      subtitle="Books matched to your vibe of the day."
      emoji="🌈"
      color="hot-pink"
    />

    <StickerCard data-reveal color="butter" :tilt="-1" class="mb-4">
      <Transition name="fade" mode="out-in">
        <figure :key="quote.id" class="mb-3">
          <blockquote class="mood-quote mb-2">“{{ quote.text }}”</blockquote>
          <figcaption class="small fw-semibold">— {{ quote.author }}</figcaption>
        </figure>
      </Transition>
      <AppButton variant="hot-pink" @click="showNextQuote">Another quote ✨</AppButton>
    </StickerCard>

    <EmptyState
      data-reveal
      emoji="🎭"
      title="Mood matching is getting dressed up"
      message="Soon you'll pick a vibe (cosy, curious, heartbroken, adventurous) and we'll find the perfect book for it."
      color="cream"
    />
  </section>
</template>

<style scoped>
.mood-quote {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.35;
}
</style>
