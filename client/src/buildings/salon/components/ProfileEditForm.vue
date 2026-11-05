<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Edit everything about the reader at once. Checks the answers, then hands them to the page
// to save.
import LoadButton from '@/components/shared/LoadButton.vue'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import RadioChips from '@/buildings/salon/components/RadioChips.vue'
import CharacterSprite from '@/components/shared/CharacterSprite.vue'
import { FAITHS, GENDERS, GENRES, validAge } from '@/buildings/salon/profileOptions.js'
import { USERNAME_PATTERN, usernameFree } from '@/services/auth.js'
import { cleanUsername } from '@/town/username.js'

const props = defineProps({
  // the saved profile, to start from
  profile: { type: Object, required: true },
  busy: { type: Boolean, default: false },
  // a save that failed
  error: { type: String, default: '' },
})

// change-look: open the Style studio, where the character is changed
const emit = defineEmits(['save', 'cancel', 'change-look'])

const words = (list) => list.map((value) => ({ value, text: value }))
const genderOptions = words(GENDERS)
const faithOptions = words(FAITHS)

const saved = props.profile
const form = ref(null)
const name = ref(saved.name || '')

// ---- the username: checked as it's typed (a pause first, so each key isn't a request)
const USERNAME_WAIT = 400
const username = ref(saved.username || '')
// same | invalid | checking | free | taken | failed
const usernameState = ref('same')
const wantedUsername = computed(() => cleanUsername(username.value))
const USERNAME_NOTES = {
  same: 'Friends find you by this.',
  invalid: 'Use 3–20 lowercase letters, numbers, dots or underscores.',
  checking: 'Checking…',
  free: 'Available',
  taken: 'Someone already has that username.',
  failed: "Couldn't check that username. Try again.",
}
const usernameNote = computed(() => USERNAME_NOTES[usernameState.value])
let usernameTimer = 0
let usernameAsk = 0

// usernames are lowercase and the box already shows the @: what's in it is what gets saved
watch(username, (typed) => {
  const tidy = typed.replace(/^@+/, '').toLowerCase()
  if (tidy !== typed) username.value = tidy
})

watch(wantedUsername, (wanted) => {
  clearError('username')
  window.clearTimeout(usernameTimer)
  usernameAsk += 1
  if (wanted === (saved.username || '')) {
    usernameState.value = 'same'
    return
  }
  if (!USERNAME_PATTERN.test(wanted)) {
    usernameState.value = 'invalid'
    return
  }
  usernameState.value = 'checking'
  const ask = usernameAsk
  usernameTimer = window.setTimeout(async () => {
    const { data, error } = await usernameFree(wanted)
    // a newer name was typed meanwhile
    if (ask !== usernameAsk) return
    usernameState.value = error ? 'failed' : data ? 'free' : 'taken'
  }, USERNAME_WAIT)
})

onBeforeUnmount(() => window.clearTimeout(usernameTimer))
const location = ref(saved.location || '')
const gender = ref(saved.gender || '')
const age = ref(saved.age === '' || saved.age == null ? '' : String(saved.age))
const religion = ref(saved.religion || '')
const genres = ref([...saved.favouriteGenres])
const errors = ref({})

function clearError(field) {
  if (errors.value[field]) errors.value = { ...errors.value, [field]: '' }
}

const choices = { gender, religion }

function choose(field, value) {
  choices[field].value = value
  clearError(field)
}

function toggleGenre(genre) {
  clearError('genres')
  genres.value = genres.value.includes(genre) ? genres.value.filter((item) => item !== genre) : [...genres.value, genre]
}

function validate() {
  const found = {}
  if (!name.value.trim()) found.name = 'Add your name.'
  const usernameProblem = {
    invalid: USERNAME_NOTES.invalid,
    taken: USERNAME_NOTES.taken,
    failed: USERNAME_NOTES.failed,
    checking: 'Wait a moment while that username is checked.',
  }[usernameState.value]
  if (usernameProblem) found.username = usernameProblem
  if (!gender.value) found.gender = 'Choose one, including prefer not to say.'
  if (!validAge(age.value)) found.age = 'Enter an age from 13 to 120.'
  if (!religion.value) found.religion = 'Choose one, including prefer not to say.'
  if (!genres.value.length) found.genres = 'Pick at least one genre.'
  return found
}

async function submit() {
  errors.value = validate()
  if (Object.values(errors.value).some(Boolean)) {
    await nextTick()
    form.value?.querySelector('[aria-invalid="true"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    return
  }
  emit('save', {
    name: name.value.trim(),
    // only a new one is sent, so saving the rest never touches it
    ...(usernameState.value === 'free' ? { username: wantedUsername.value } : {}),
    location: location.value.trim(),
    gender: gender.value,
    age: Number(age.value),
    religion: religion.value,
    favouriteGenres: genres.value,
  })
}
</script>

<template>
  <form ref="form" novalidate @submit.prevent="submit">
    <h2 class="h3 mb-3">Edit profile</h2>

    <div class="field look">
      <span class="look__sprite">
        <CharacterSprite :character="profile.character" :scale="2" label="Your character" />
      </span>
      <button type="button" class="btn btn-secondary btn-sm" @click="emit('change-look')">Change look</button>
    </div>

    <div class="field">
      <label class="form-label" for="profile-name">Name</label>
      <input
        id="profile-name"
        v-model="name"
        class="form-control"
        maxlength="40"
        autocomplete="name"
        placeholder="e.g. Alex"
        :aria-invalid="Boolean(errors.name)"
        :aria-describedby="errors.name ? 'name-error' : undefined"
        @input="clearError('name')"
      />
      <p v-if="errors.name" id="name-error" class="field-error">{{ errors.name }}</p>
    </div>

    <div class="field">
      <label class="form-label" for="profile-username">Username</label>
      <div class="input-group">
        <span class="input-group-text" aria-hidden="true">@</span>
        <input
          id="profile-username"
          v-model="username"
          class="form-control"
          maxlength="20"
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          placeholder="e.g. alex.reads"
          :aria-invalid="Boolean(errors.username) || ['invalid', 'taken'].includes(usernameState)"
          aria-describedby="username-note"
        />
      </div>
      <p
        id="username-note"
        class="username-note"
        :class="errors.username ? 'field-error' : `username-note--${usernameState}`"
        aria-live="polite"
      >
        {{ errors.username || usernameNote }}
      </p>
    </div>

    <div class="field">
      <label class="form-label" for="profile-location">Location <span class="optional">(optional)</span></label>
      <input
        id="profile-location"
        v-model="location"
        class="form-control"
        maxlength="60"
        autocomplete="address-level2"
        placeholder="e.g. Tampines, Singapore"
      />
    </div>

    <div class="field">
      <span id="gender-label" class="form-label">Gender</span>
      <RadioChips
        :model-value="gender"
        :options="genderOptions"
        labelledby="gender-label"
        :invalid="Boolean(errors.gender)"
        :describedby="errors.gender ? 'gender-error' : undefined"
        @update:model-value="choose('gender', $event)"
      />
      <p v-if="errors.gender" id="gender-error" class="field-error">{{ errors.gender }}</p>
    </div>

    <div class="field">
      <label class="form-label" for="profile-age">Age</label>
      <input
        id="profile-age"
        v-model="age"
        class="form-control"
        type="number"
        min="13"
        max="120"
        inputmode="numeric"
        placeholder="e.g. 21"
        :aria-invalid="Boolean(errors.age)"
        :aria-describedby="errors.age ? 'age-error' : undefined"
        @input="clearError('age')"
      />
      <p v-if="errors.age" id="age-error" class="field-error">{{ errors.age }}</p>
    </div>

    <div class="field">
      <span id="religion-label" class="form-label">Religion</span>
      <RadioChips
        :model-value="religion"
        :options="faithOptions"
        labelledby="religion-label"
        :invalid="Boolean(errors.religion)"
        :describedby="errors.religion ? 'religion-error' : undefined"
        @update:model-value="choose('religion', $event)"
      />
      <p v-if="errors.religion" id="religion-error" class="field-error">{{ errors.religion }}</p>
    </div>

    <div class="field">
      <span id="genres-label" class="form-label">Favourite genres</span>
      <div
        class="genres"
        role="group"
        aria-labelledby="genres-label"
        :aria-invalid="Boolean(errors.genres)"
        :aria-describedby="errors.genres ? 'genres-error' : undefined"
      >
        <button
          v-for="genre in GENRES"
          :key="genre"
          type="button"
          class="btn btn-chip genre"
          :aria-pressed="genres.includes(genre)"
          @click="toggleGenre(genre)"
        >
          {{ genre }}
        </button>
      </div>
      <p v-if="errors.genres" id="genres-error" class="field-error">{{ errors.genres }}</p>
    </div>

    <div class="actions">
      <p v-if="error" class="field-error mb-2" role="alert">{{ error }}</p>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-outline-primary" @click="emit('cancel')">Cancel</button>
        <LoadButton class="btn btn-success flex-grow-1" type="submit" :busy="busy" :failed="Boolean(error)" busy-text="Saving…" done-text="Saved">
          Save
        </LoadButton>
      </div>
    </div>
  </form>
</template>

<style scoped>
form {
  padding: 16px;
  border: 2px solid rgba(30, 26, 36, 0.85);
  border-radius: 18px;
  background: rgba(255, 253, 249, 0.94);
  box-shadow: 5px 5px 0 rgba(30, 26, 36, 0.22);
  backdrop-filter: blur(8px);
  padding-bottom: 0;
}

.field {
  margin-bottom: 20px;
}

.look {
  display: flex;
  align-items: center;
  gap: 16px;
}

.look__sprite {
  display: grid;
  place-items: center;
  width: 76px;
  height: 128px;
  border: 2px solid var(--px-outline);
  background: var(--px-paper-shade);
}

.optional {
  color: var(--rl-muted);
  font-size: 0.875rem;
}

.genres {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 8px;
}

.genre {
  font-size: 0.875rem;
}

.field-error {
  margin: 6px 0 0;
  color: #8d2218;
  font-size: 0.875rem;
}

/* under the username: a hint, then what the check found */
.username-note {
  margin: 6px 0 0;
  color: var(--rl-muted);
  font-size: 0.875rem;
}

.username-note--free {
  color: #2f6b34;
  font-weight: 700;
}

.username-note--invalid,
.username-note--taken,
.username-note--failed {
  color: #8d2218;
}

.actions {
  position: sticky;
  /* sit on the bottom edge of the scrolling dock (it has 1.5rem of bottom padding) */
  bottom: -1.5rem;
  margin: 0 -16px;
  padding: 12px 16px;
  border-top: 2px dashed #ead2de;
  border-radius: 0 0 16px 16px;
  background: #fffdf9;
}

.actions .btn {
  min-height: 44px;
}
</style>
