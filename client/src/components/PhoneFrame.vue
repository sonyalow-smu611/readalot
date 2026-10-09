<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const auth = computed(() => Boolean(route.meta.bare))
</script>

<template>
  <div class="phone-stage" :class="{ 'phone-stage--auth': auth }">
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

  /* Sign-in fills the window. The room stays in the phone column. */
  .phone-stage--auth {
    padding: 0;
    background: var(--rl-canvas);
  }

  .phone-stage--auth .phone-frame {
    max-width: none;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }
}
</style>
