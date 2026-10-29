<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// One section of the landing page under the hero: its heading, a line under it and whatever it
// shows. The section is #start-<id>, so the bar can scroll to it. Its words fade in as it
// arrives (data-fade, see useScrollFade) while the sky behind stays put.
defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  lede: { type: String, default: '' },
  // centre the heading (the FAQ and the last screen)
  centred: { type: Boolean, default: false },
})
</script>

<template>
  <section :id="`start-${id}`" class="section" :aria-labelledby="`start-${id}-title`">
    <div class="section__inner" :class="{ 'section__inner--centred': centred }" data-fade>
      <h2 :id="`start-${id}-title`" class="section__title">{{ title }}</h2>
      <p v-if="lede" class="section__lede">{{ lede }}</p>
      <slot />
    </div>
  </section>
</template>

<style scoped>
.section {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  min-height: 100%;
  padding: 96px 20px 72px;
}

@media (max-width: 575px) {
  .section {
    padding-top: 128px;
  }
}

.section__inner {
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
}

.section__inner--centred {
  max-width: 780px;
  text-align: center;
}

.section__title {
  max-width: 22ch;
  margin: 0 0 12px;
  font-family: var(--rl-font-title);
  font-size: clamp(30px, 4.6vw, 52px);
  font-weight: 700;
  line-height: 1.12;
  color: var(--rl-surface);
  text-shadow: 0 2px 14px rgba(30, 26, 36, 0.45);
}

.section__inner--centred .section__title {
  margin-left: auto;
  margin-right: auto;
}

.section__lede {
  max-width: 60ch;
  margin: 0 0 32px;
  color: rgba(255, 253, 249, 0.88);
  font-size: clamp(16px, 1.8vw, 19px);
  line-height: 1.55;
}

.section__inner--centred .section__lede {
  margin-left: auto;
  margin-right: auto;
}
</style>
