<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The landing page's way in: Sign up, and a small Log in link under it. Either one tells the
// page the visitor has chosen, so it can remember the landing page has been seen.
const emit = defineEmits(['choose'])
</script>

<template>
  <div class="actions">
    <RouterLink :to="{ name: 'register' }" class="btn btn-light btn-lg actions__signup" @click="emit('choose')">
      Sign up
    </RouterLink>
    <p class="actions__login">
      Already have an account?
      <RouterLink :to="{ name: 'login' }" @click="emit('choose')">Log in</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.actions__signup {
  min-width: 220px;
  border-radius: 999px;
  color: var(--rl-primary);
  font-weight: 700;
  box-shadow: 0 10px 28px rgba(30, 26, 36, 0.3);
}

.actions__login {
  margin: 12px 0 0;
  font-size: 14px;
  color: rgba(255, 253, 249, 0.85);
}

.actions__login a {
  color: var(--rl-surface);
  font-weight: 700;
}
</style>
