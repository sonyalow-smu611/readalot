<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { saveProfile, signOut } from '@/services/auth.js'
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
const editing = ref(false)
const confirming = ref(false)
const error = ref('')
const busy = ref(false)
const name = ref('')
const gender = ref('')
const age = ref('')
const religion = ref('')
const genres = ref([])

onMounted(() => {
  user.openGuideIfNew()
})

function startEdit() {
  const saved = user.profile
  name.value = saved.name || ''
  gender.value = saved.gender || ''
  age.value = saved.age === '' || saved.age == null ? '' : String(saved.age)
  religion.value = saved.religion || ''
  genres.value = [...saved.favouriteGenres]
  error.value = ''
  editing.value = true
}

function toggleGenre(genre) {
  if (genres.value.includes(genre)) {
    genres.value = genres.value.filter((item) => item !== genre)
    return
  }
  genres.value = [...genres.value, genre]
}

async function save() {
  error.value = ''
  if (!name.value.trim()) {
    error.value = 'Add your name to continue.'
    return
  }
  const years = Number(age.value)
  if (!Number.isInteger(years) || years < 13 || years > 120) {
    error.value = 'Enter an age from 13 to 120.'
    return
  }
  if (!gender.value || !religion.value || !genres.value.length) {
    error.value = 'Choose a gender, a religion, and at least one genre.'
    return
  }
  busy.value = true
  const details = {
    name: name.value.trim(),
    gender: gender.value,
    age: years,
    religion: religion.value,
    favouriteGenres: genres.value,
  }
  const result = await saveProfile(details)
  busy.value = false
  if (result.error) {
    error.value = result.error.message
    return
  }
  if (result.data?.user) user.applySession({ user: result.data.user })
  if (!user.profile.name) user.mergeProfile(details)
  editing.value = false
}

async function logout() {
  user.dismissGuide()
  await signOut()
  user.applySession(null)
  router.push({ name: 'login' })
}
</script>

<template>
  <section>
    <template v-if="!editing">
      <h1 class="h3 mb-1">{{ user.profile.name }}</h1>
      <p class="text-muted mb-4">{{ user.profile.email }}</p>
      <dl class="details">
        <div>
          <dt>Gender</dt>
          <dd>{{ user.profile.gender || '—' }}</dd>
        </div>
        <div>
          <dt>Age</dt>
          <dd>{{ user.profile.age || '—' }}</dd>
        </div>
        <div>
          <dt>Religion</dt>
          <dd>{{ user.profile.religion || '—' }}</dd>
        </div>
        <div>
          <dt>Genres</dt>
          <dd>{{ user.profile.favouriteGenres.join(', ') || '—' }}</dd>
        </div>
      </dl>
      <button type="button" class="btn btn-outline-primary w-100 mb-2" @click="startEdit">Edit</button>
      <button type="button" class="btn btn-primary w-100" @click="confirming = true">Log out</button>
    </template>

    <form v-else @submit.prevent="save">
      <h1 class="h3 mb-3">Edit profile</h1>
      <div class="mb-3">
        <label class="form-label" for="profile-name">Name</label>
        <input id="profile-name" v-model="name" class="form-control" maxlength="40" autocomplete="name" placeholder="e.g. Alex" />
      </div>
      <div class="mb-3">
        <span class="form-label">Gender</span>
        <div class="choices" role="radiogroup" aria-label="Gender">
          <button
            v-for="option in GENDERS"
            :key="option"
            type="button"
            class="choice"
            :class="{ 'is-on': gender === option }"
            :aria-pressed="gender === option"
            @click="gender = option"
          >
            {{ option }}
          </button>
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label" for="profile-age">Age</label>
        <input id="profile-age" v-model="age" class="form-control" type="number" min="13" max="120" inputmode="numeric" placeholder="e.g. 21" />
      </div>
      <div class="mb-3">
        <span class="form-label">Religion</span>
        <div class="choices" role="radiogroup" aria-label="Religion">
          <button
            v-for="option in FAITHS"
            :key="option"
            type="button"
            class="choice"
            :class="{ 'is-on': religion === option }"
            :aria-pressed="religion === option"
            @click="religion = option"
          >
            {{ option }}
          </button>
        </div>
      </div>
      <div class="mb-3">
        <span class="form-label">Genres</span>
        <div class="choices" role="group" aria-label="Genres">
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
      </div>
      <p v-if="error" class="edit-error" role="alert">{{ error }}</p>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-outline-primary" @click="editing = false">Cancel</button>
        <button class="btn btn-primary flex-grow-1" type="submit" :disabled="busy">
          {{ busy ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </form>
    <Teleport to=".phone-frame">
      <div v-if="confirming" class="leave" role="dialog" aria-modal="true" aria-labelledby="leave-title">
        <div class="leave__card">
          <div class="leave__book" aria-hidden="true">
            <span class="leave__cover" />
            <span class="leave__page" />
          </div>
          <h2 id="leave-title" class="h4 mb-1">Close this book?</h2>
          <p class="text-muted mb-3">You will leave the shelf. Sign in again when you want to come back.</p>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-outline-primary flex-grow-1" @click="confirming = false">Stay</button>
            <button type="button" class="btn leave__go flex-grow-1" @click="logout">Log out</button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.details {
  margin: 0 0 1.5rem;
}

.details div {
  padding: 10px 0;
  border-top: 1px solid var(--rl-line);
}

.details dt {
  color: var(--rl-muted);
  font-size: 0.75rem;
  font-weight: 400;
}

.details dd {
  margin: 2px 0 0;
  font-size: 1rem;
}

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

.edit-error {
  margin: 0 0 12px;
  color: #8d2218;
  font-size: 0.875rem;
}

.leave {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(44, 36, 30, 0.46);
}

.leave__card {
  width: min(100%, 300px);
  padding: 22px 18px 18px;
  border-radius: 22px;
  background: var(--rl-surface);
  border: 1px solid var(--rl-line);
  box-shadow: 0 18px 40px rgba(44, 36, 30, 0.28);
  text-align: center;
  animation: leave-in 0.35s ease;
}

.leave__book {
  position: relative;
  width: 74px;
  height: 52px;
  margin: 0 auto 14px;
}

.leave__cover,
.leave__page {
  position: absolute;
  top: 0;
  height: 52px;
  border-radius: 3px 8px 8px 3px;
}

.leave__cover {
  left: 8px;
  width: 34px;
  background: #6b4a34;
  transform-origin: right center;
  animation: cover-shut 0.7s ease;
}

.leave__page {
  left: 34px;
  width: 30px;
  background: #fffdf9;
  border: 1px solid var(--rl-line);
}

.leave__go {
  background: #b42318;
  border-color: #b42318;
  color: #fffdf9;
}

.leave__go:hover {
  background: #8d2218;
  border-color: #8d2218;
  color: #fffdf9;
}

@keyframes leave-in {
  from { transform: translateY(16px) scale(0.96); opacity: 0; }
}

@keyframes cover-shut {
  from { transform: scaleX(0.2); }
}

@media (prefers-reduced-motion: reduce) {
  .leave__card,
  .leave__cover {
    animation: none;
  }
}
</style>
