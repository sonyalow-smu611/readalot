<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { gsap, prefersReducedMotion } from '@/lib/motion'
import AuthStage from '@/components/auth/AuthStage.vue'
import { authConfigured, readPending, resendCode, verifyEmailCode } from '@/services/auth.js'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const user = useUserStore()
const stage = ref(null)
const boxes = ref([])
const digits = ref(['', '', '', '', '', ''])
const error = ref('')
const busy = ref(false)
const sealed = ref(false)
const hop = ref(0)
const wait = ref(30)
const pending = readPending()

if (!pending) router.replace({ name: 'login' })

let timer = 0
let leaveTimer = 0

const code = computed(() => digits.value.join(''))
const email = computed(() => pending?.email || '')

onMounted(() => {
  if (!pending) return
  boxes.value[0]?.focus()
  timer = window.setInterval(() => {
    if (wait.value > 0) wait.value -= 1
  }, 1000)
  if (prefersReducedMotion()) return
  const slots = stage.value?.$el?.querySelectorAll('.slot') || document.querySelectorAll('.slot')
  gsap.fromTo(
    slots,
    { y: 16, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 0.35, stagger: 0.04, ease: 'power2.out', force3D: false },
  )
})

onBeforeUnmount(() => {
  window.clearInterval(timer)
  window.clearTimeout(leaveTimer)
})

function focusAt(index) {
  boxes.value[index]?.focus()
}

function writeDigits(raw, start) {
  const chars = raw.replace(/\D/g, '').slice(0, 6 - start).split('')
  if (!chars.length) return
  const next = digits.value.slice()
  chars.forEach((char, offset) => {
    next[start + offset] = char
  })
  digits.value = next
  focusAt(Math.min(5, start + chars.length))
  if (next.join('').length === 6) submit()
}

function onDigit(index, event) {
  const value = event.target.value.replace(/\D/g, '')
  if (value.length > 1) {
    writeDigits(value, index)
    return
  }
  const next = digits.value.slice()
  next[index] = value.slice(-1)
  digits.value = next
  if (value && index < 5) focusAt(index + 1)
  if (next.join('').length === 6) submit()
}

function onKey(index, event) {
  if (event.key !== 'Backspace' || digits.value[index] || index === 0) return
  const next = digits.value.slice()
  next[index - 1] = ''
  digits.value = next
  focusAt(index - 1)
}

function onPaste(event) {
  event.preventDefault()
  writeDigits(event.clipboardData?.getData('text') || '', 0)
}

async function submit() {
  if (busy.value || sealed.value || code.value.length < 6 || !pending) return
  busy.value = true
  error.value = ''
  const result = await verifyEmailCode(email.value, code.value, pending.purpose)
  busy.value = false
  if (result.error) {
    error.value = result.error.message
    stage.value?.shake()
    return
  }
  if (!result.data?.session) {
    error.value = 'That code did not sign you in. Request a new one.'
    stage.value?.shake()
    return
  }
  user.applySession(result.data.session)
  sealed.value = true
  hop.value += 1
  leaveTimer = window.setTimeout(() => {
    router.push({ name: user.profileComplete ? 'profile' : 'welcome' })
  }, prefersReducedMotion() ? 400 : 1500)
}

async function resend() {
  if (wait.value > 0 || !pending || busy.value) return
  const result = await resendCode(email.value, pending.purpose)
  if (result.error) {
    error.value = result.error.message
    stage.value?.shake()
    return
  }
  wait.value = 30
  error.value = ''
}
</script>

<template>
  <AuthStage v-if="pending" ref="stage" gaze="field" :hop="hop">
    <h1 class="h3 mb-1">Check your email</h1>
    <p class="text-muted mb-3">Enter the 6-digit code sent to {{ email }}.</p>
    <p v-if="!authConfigured()" class="preview-note">Any 6-digit code will continue while Supabase is not set up.</p>
    <form @submit.prevent="submit">
      <div class="hand" :class="{ 'is-done': sealed }" role="group" aria-label="Verification code">
        <label
          v-for="(digit, index) in digits"
          :key="index"
          class="slot"
          :style="{ '--i': index }"
        >
          <input
            ref="boxes"
            class="slot__input"
            :value="digit"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="1"
            :aria-label="`Digit ${index + 1}`"
            :disabled="sealed"
            @input="onDigit(index, $event)"
            @keydown="onKey(index, $event)"
            @paste="onPaste"
          />
          <span class="slot__mark" aria-hidden="true">{{ digit }}</span>
        </label>
        <div v-if="sealed" class="tick" role="img" aria-label="Code accepted">
          <svg viewBox="0 0 52 52" aria-hidden="true">
            <circle class="tick__ring" cx="26" cy="26" r="23" />
            <path class="tick__mark" d="M14 27.5l7.5 7.5L38 17" />
          </svg>
        </div>
      </div>
      <p v-if="error" class="stage-error" role="alert">{{ error }}</p>
      <button class="btn btn-primary w-100" type="submit" :disabled="busy || sealed || code.length < 6">
        {{ busy ? 'Checking…' : 'Confirm code' }}
      </button>
    </form>
    <p class="resend">
      <button type="button" class="btn btn-link p-0" :disabled="wait > 0" @click="resend">
        {{ wait > 0 ? `Resend in ${wait}s` : 'Resend code' }}
      </button>
    </p>
  </AuthStage>
</template>

<style scoped>
.hand {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  height: 72px;
  margin: 8px 0 16px;
}

.slot {
  position: relative;
  width: 40px;
  height: 48px;
  flex: 0 0 40px;
}

.hand.is-done .slot {
  animation: gather 0.48s ease forwards;
}

@keyframes gather {
  to {
    transform: translateX(calc((2.5 - var(--i)) * 48px)) scale(0.12);
    opacity: 0;
  }
}

.slot__input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 1px solid var(--rl-line);
  border-radius: 6px 8px 8px 6px;
  background: var(--rl-surface);
  color: transparent;
  caret-color: var(--rl-text);
  text-align: center;
  font-size: 1.1rem;
}

.slot__input:focus {
  outline: none;
  border-color: var(--rl-accent);
  background: #fffdf9;
  transform: translateY(-8px);
}

.slot__mark {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--rl-text);
  font-family: var(--rl-font-title);
  font-size: 1.15rem;
  pointer-events: none;
}

.slot:focus-within .slot__mark {
  color: var(--rl-primary);
}

.preview-note {
  margin: -6px 0 12px;
  color: var(--rl-accent);
  font-size: 0.8rem;
}

.stage-error {
  margin: 0 0 12px;
  color: #8d2218;
  font-size: 0.875rem;
}

.resend {
  margin: 12px 0 0;
  text-align: center;
  font-size: 0.875rem;
}

@media (prefers-reduced-motion: reduce) {
  .slot__input:focus {
    transform: none;
  }

  .hand.is-done .slot {
    animation: none;
    opacity: 0;
  }

  .tick,
  .tick__mark {
    animation: none;
  }

  .tick {
    opacity: 1;
    transform: translate(-50%, -50%);
  }

  .tick__mark {
    stroke-dashoffset: 0;
  }
}

.tick {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 56px;
  height: 56px;
  transform: translate(-50%, -50%) scale(0.2);
  opacity: 0;
  animation: tick-in 0.32s 0.4s ease forwards;
}

.tick__ring,
.tick__mark {
  fill: none;
  stroke: #1f8a3b;
  stroke-width: 3.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.tick__mark {
  stroke-dasharray: 36;
  stroke-dashoffset: 36;
  animation: tick-draw 0.34s 0.68s ease forwards;
}

@keyframes tick-in {
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes tick-draw {
  to { stroke-dashoffset: 0; }
}
</style>
