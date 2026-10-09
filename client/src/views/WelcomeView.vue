<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthStage from '@/components/auth/AuthStage.vue'
import { saveProfile } from '@/services/auth.js'
import { useUserStore } from '@/stores/user'

const GENRES = [
  'Fantasy',
  'Literary Fiction',
  'Magical Realism',
  'Science Fiction',
  'Mystery',
  'Thriller',
  'Classic',
  'Historical Fiction',
  'Memoir',
  'Non-fiction',
  'Self-Help',
]

const GENDERS = ['Woman', 'Man', 'Non-binary', 'Prefer not to say']
const FAITHS = ['Christianity', 'Islam', 'Buddhism', 'Hinduism', 'Sikhism', 'Judaism', 'None', 'Prefer not to say']

const router = useRouter()
const user = useUserStore()
const stage = ref(null)
const step = ref(0)
const error = ref('')
const busy = ref(false)
const name = ref('')
const gender = ref('')
const age = ref('')
const religion = ref('')
const genres = ref([])

const titles = ['Your name', 'Gender', 'Age', 'Religion', 'Genres you like']
const notes = [
  'This is how the room greets you.',
  'Choose whichever fits, or skip the detail.',
  'A number is enough.',
  'Optional. Prefer not to say is fine.',
  'Pick at least one. They sit beside the cat.',
]

const gaze = computed(() => (error.value ? 'duck' : 'field'))

onMounted(() => {
  const saved = user.profile
  name.value = saved.name || ''
  gender.value = saved.gender || ''
  age.value = saved.age === '' || saved.age == null ? '' : String(saved.age)
  religion.value = saved.religion || ''
  genres.value = [...saved.favouriteGenres]
})

function toggleGenre(genre) {
  error.value = ''
  if (genres.value.includes(genre)) {
    genres.value = genres.value.filter((item) => item !== genre)
    return
  }
  genres.value = [...genres.value, genre]
}

function choose(field, value) {
  error.value = ''
  if (field === 'gender') gender.value = value
  if (field === 'religion') religion.value = value
}

function fail(message) {
  error.value = message
  stage.value?.shake()
}

function next() {
  error.value = ''
  if (step.value === 0 && !name.value.trim()) {
    fail('Add your name to continue.')
    return
  }
  if (step.value === 1 && !gender.value) {
    fail('Choose one to continue.')
    return
  }
  if (step.value === 2) {
    const years = Number(age.value)
    if (!Number.isInteger(years) || years < 13 || years > 120) {
      fail('Enter an age from 13 to 120.')
      return
    }
  }
  if (step.value === 3 && !religion.value) {
    fail('Choose one, including prefer not to say.')
    return
  }
  if (step.value === 4) {
    if (!genres.value.length) {
      fail('Pick at least one genre.')
      return
    }
    finish()
    return
  }
  step.value += 1
}

function back() {
  error.value = ''
  if (step.value === 0) return
  step.value -= 1
}

async function finish() {
  busy.value = true
  const details = {
    name: name.value.trim(),
    gender: gender.value,
    age: Number(age.value),
    religion: religion.value,
    favouriteGenres: genres.value,
  }
  const result = await saveProfile(details)
  busy.value = false
  if (result.error) {
    fail(result.error.message)
    return
  }
  if (result.data?.user) user.applySession({ user: result.data.user })
  if (!user.profile.name) user.mergeProfile(details)
  router.push({ name: 'profile' })
}
</script>

<template>
  <AuthStage ref="stage" :gaze="gaze" :spines="genres">
    <p class="text-muted mb-1">{{ step + 1 }} of 5</p>
    <h1 class="h3 mb-1">{{ titles[step] }}</h1>
    <p class="text-muted mb-3">{{ notes[step] }}</p>

    <form @submit.prevent="next">
      <div v-if="step === 0" class="mb-3">
        <label class="form-label" for="welcome-name">Name</label>
        <input id="welcome-name" v-model="name" class="form-control" maxlength="40" autocomplete="name" placeholder="e.g. Alex" />
      </div>

      <div v-else-if="step === 1" class="choices mb-3" role="radiogroup" aria-label="Gender">
        <button
          v-for="option in GENDERS"
          :key="option"
          type="button"
          class="choice"
          :class="{ 'is-on': gender === option }"
          :aria-pressed="gender === option"
          @click="choose('gender', option)"
        >
          {{ option }}
        </button>
      </div>

      <div v-else-if="step === 2" class="mb-3">
        <label class="form-label" for="welcome-age">Age</label>
        <input id="welcome-age" v-model="age" class="form-control" type="number" min="13" max="120" inputmode="numeric" placeholder="e.g. 21" />
      </div>

      <div v-else-if="step === 3" class="choices mb-3" role="radiogroup" aria-label="Religion">
        <button
          v-for="option in FAITHS"
          :key="option"
          type="button"
          class="choice"
          :class="{ 'is-on': religion === option }"
          :aria-pressed="religion === option"
          @click="choose('religion', option)"
        >
          {{ option }}
        </button>
      </div>

      <div v-else class="choices mb-3" role="group" aria-label="Genres">
        <button
          v-for="genre in GENRES"
          :key="genre"
          type="button"
          class="choice"
          :class="{ 'is-on': genres.includes(genre) }"
          :aria-pressed="genres.includes(genre)"
          @click="toggleGenre(genre)"
        >
          {{ genre }}
        </button>
      </div>

      <p v-if="error" class="stage-error" role="alert">{{ error }}</p>
      <div class="d-flex gap-2">
        <button v-if="step > 0" type="button" class="btn btn-outline-primary" @click="back">Back</button>
        <button class="btn btn-primary flex-grow-1" type="submit" :disabled="busy">
          {{ step === 4 ? (busy ? 'Saving…' : 'Finish') : 'Next' }}
        </button>
      </div>
    </form>
  </AuthStage>
</template>

<style scoped>
.choices {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.choice {
  border: 1px solid var(--rl-line);
  border-radius: 999px;
  background: var(--rl-canvas);
  color: var(--rl-text);
  font-size: 0.875rem;
  padding: 6px 12px;
}

.choice.is-on {
  background: var(--rl-primary);
  border-color: var(--rl-primary);
  color: var(--rl-surface);
}

.stage-error {
  margin: 0 0 12px;
  color: #8d2218;
  font-size: 0.875rem;
}
</style>
