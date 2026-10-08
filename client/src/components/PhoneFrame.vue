<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
</script>

<template>
  <div class="phone-stage">
    <div class="phone-frame grain">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.phone-stage {
  background: var(--wall);
}

.phone-frame {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: var(--paper);
}

/* Wide (and tall enough) screens: centre the app in a phone-style column */
@media (min-width: 576px) and (min-height: 600px) {
  .phone-stage {
    position: relative;
    display: flex;
    background: #efe8de;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 24px;
    overflow: hidden;
  }

  .phone-frame {
    width: 100%;
    max-width: 480px;
    height: min(880px, calc(100vh - 48px));
    height: min(880px, calc(100dvh - 48px));
    border: 1px solid var(--rl-line);
    border-radius: 36px;
    box-shadow: 0 18px 48px rgba(63, 46, 36, 0.12);
  }
}
</style>
