<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthStage from '@/components/auth/AuthStage.vue'
import { beginLogin, beginRegister } from '@/services/auth.js'
import { prefersReducedMotion } from '@/lib/motion'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const stage = ref(null)

const email = ref('')
const password = ref('')
const confirm = ref('')
const showPassword = ref(false)
const blinking = ref(false)
let blinkTimer = 0

function togglePassword() {
  if (prefersReducedMotion()) {
    showPassword.value = !showPassword.value
    return
  }
  if (blinking.value) return
  blinking.value = true
  window.setTimeout(() => {
    showPassword.value = !showPassword.value
  }, 140)
  window.clearTimeout(blinkTimer)
  blinkTimer = window.setTimeout(() => {
    blinking.value = false
  }, 380)
}

onBeforeUnmount(() => window.clearTimeout(blinkTimer))

const focused = ref('')
const error = ref('')
const busy = ref(false)
const ducked = ref(false)

const registerMode = computed(() => route.name === 'register')

const gaze = computed(() => {
  if (ducked.value) return 'duck'
  if (focused.value === 'password' && !showPassword.value) return 'cover'
  if (focused.value === 'password' && showPassword.value) return 'peek'
  if (focused.value === 'email' || focused.value === 'confirm') return 'field'
  return 'idle'
})

const pageNudge = computed(() => Math.min(8, email.value.length * 0.45))

function focus(field) {
  ducked.value = false
  focused.value = field
}

function blur(field) {
  if (focused.value === field) focused.value = ''
}

function fail(message) {
  error.value = message
  ducked.value = true
  stage.value?.shake()
}

async function submit() {
  error.value = ''
  ducked.value = false
  if (registerMode.value && password.value !== confirm.value) {
    fail('Those passwords do not match.')
    return
  }
  if (password.value.length < 6) {
    fail('Use at least 6 characters.')
    return
  }
  busy.value = true
  const result = registerMode.value
    ? await beginRegister(email.value.trim(), password.value)
    : await beginLogin(email.value.trim(), password.value)
  busy.value = false
  if (result.error) {
    fail(result.error.message)
    return
  }
  user.applySession(null)
  router.push({ name: 'verify' })
}
</script>

<template>
  <AuthStage ref="stage" :gaze="gaze" :page-nudge="pageNudge">
    <h1 class="h3 mb-1">{{ registerMode ? 'Create your card' : 'Welcome back' }}</h1>
    <p class="text-muted mb-3">
      {{ registerMode ? 'A code will arrive in your inbox.' : 'Enter your details, then the code from your email.' }}
    </p>
    <form @submit.prevent="submit">
      <div class="mb-3">
        <label class="form-label" for="auth-email">Email</label>
        <input
          id="auth-email"
          v-model="email"
          class="form-control"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          required
          @focus="focus('email')"
          @blur="blur('email')"
        />
      </div>
      <div class="mb-3">
        <label class="form-label" for="auth-password">Password</label>
        <div class="secret">
          <input
            id="auth-password"
            v-model="password"
            class="form-control"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="••••••"
            required
            @focus="focus('password')"
            @blur="blur('password')"
          />
          <button
            type="button"
            class="secret__eye"
            :aria-pressed="showPassword"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @mousedown.prevent
            @click="togglePassword"
          >
            <svg class="eye" :class="{ 'is-blinking': blinking }" viewBox="0 0 24 24" aria-hidden="true">
              <path class="eye__shape" d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
              <circle class="eye__pupil" cx="12" cy="12" r="2.4" fill="currentColor" />
              <path v-if="!showPassword" class="eye__slash" d="M5 19L19 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>
      <div v-if="registerMode" class="mb-3">
        <label class="form-label" for="auth-confirm">Confirm password</label>
        <input
          id="auth-confirm"
          v-model="confirm"
          class="form-control"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          placeholder="••••••"
          required
          @focus="focus('confirm')"
          @blur="blur('confirm')"
        />
      </div>
      <p v-if="error" class="stage-error" role="alert">{{ error }}</p>
      <button class="btn btn-primary w-100" type="submit" :disabled="busy">
        {{ busy ? 'Sending…' : registerMode ? 'Register' : 'Log in' }}
      </button>
    </form>
    <p class="switch">
      <RouterLink v-if="registerMode" :to="{ name: 'login' }">Already have a card? Log in</RouterLink>
      <RouterLink v-else :to="{ name: 'register' }">Need a card? Register</RouterLink>
    </p>
  </AuthStage>
</template>

<style scoped>
.stage-error {
  margin: 0 0 12px;
  color: #8d2218;
  font-size: 0.875rem;
}

.secret {
  position: relative;
}

.secret :deep(.form-control),
.secret .form-control {
  padding-right: 42px;
}

.secret__eye {
  position: absolute;
  top: 50%;
  right: 6px;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--rl-accent);
  transform: translateY(-50%);
}

.secret__eye svg {
  width: 22px;
  height: 22px;
}

.eye__shape,
.eye__pupil {
  transform-origin: 12px 12px;
}

.eye.is-blinking .eye__shape,
.eye.is-blinking .eye__pupil {
  animation: eye-blink 0.38s ease;
}

@keyframes eye-blink {
  0%,
  100% { transform: scaleY(1); }
  42% { transform: scaleY(0.08); }
}

.secret__eye:hover {
  color: var(--rl-primary);
  background: var(--rl-secondary);
}

.switch {
  margin: 18px 0 0;
  text-align: center;
  font-size: 0.875rem;
}
</style>
