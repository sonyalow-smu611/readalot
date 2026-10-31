<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// One of the cards on a reader's profile: a brass tab with its heading, a paper inside with a thin
// teal line, a dark outline and a hard shadow. The card is a section named by its heading.
import { useId } from 'vue'

defineProps({
  title: { type: String, required: true },
  // a small picture for the tab, decorative
  icon: { type: String, default: '' },
})

const headingId = useId()
</script>

<template>
  <section class="pixel-card" :aria-labelledby="headingId">
    <h2 :id="headingId" class="pixel-card__tab">
      <span v-if="icon" class="pixel-card__icon" aria-hidden="true">{{ icon }}</span>
      {{ title }}
    </h2>
    <div class="pixel-card__paper">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.pixel-card {
  margin-top: 26px;
}

/* the tab sits on the card's top edge */
.pixel-card__tab {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 -2px 10px;
  padding: 4px 10px;
  border: var(--px-border);
  background: var(--profile-brass);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--px-outline);
}

.pixel-card__paper {
  padding: 14px;
  border: var(--px-border);
  background: var(--profile-paper);
  box-shadow: var(--px-shadow);
  outline: 2px solid var(--profile-teal);
  outline-offset: -6px;
}
</style>
