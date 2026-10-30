<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Edit everything about the reader at once. Checks the answers, then hands them to the page
// to save.
import { nextTick, ref } from 'vue'
import RadioChips from '@/buildings/salon/components/RadioChips.vue'
import { AVATARS, FAITHS, GENDERS, GENRES, validAge } from '@/buildings/salon/profileOptions.js'

const props = defineProps({
  // the saved profile, to start from
  profile: { type: Object, required: true },
  busy: { type: Boolean, default: false },
  // a save that failed
  error: { type: String, default: '' },
})

const emit = defineEmits(['save', 'cancel'])

const words = (list) => list.map((value) => ({ value, text: value }))
const avatarOptions = AVATARS.map((item) => ({ value: item.emoji, text: item.emoji, label: item.name }))
const genderOptions = words(GENDERS)
const faithOptions = words(FAITHS)

const saved = props.profile
const form = ref(null)
const avatar = ref(saved.avatar || AVATARS[0].emoji)
const name = ref(saved.name || '')
const location = ref(saved.location || '')
const gender = ref(saved.gender || '')
const age = ref(saved.age === '' || saved.age == null ? '' : String(saved.age))
const religion = ref(saved.religion || '')
const genres = ref([...saved.favouriteGenres])
const errors = ref({})

function clearError(field) {
  if (errors.value[field]) errors.value = { ...errors.value, [field]: '' }
}

const choices = { avatar, gender, religion }

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
    avatar: avatar.value,
    name: name.value.trim(),
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

    <div class="field">
      <span id="avatar-label" class="form-label">Avatar</span>
      <RadioChips
        :model-value="avatar"
        :options="avatarOptions"
        labelledby="avatar-label"
        variant="avatar"
        @update:model-value="choose('avatar', $event)"
      />
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
        <button class="btn btn-primary flex-grow-1" type="submit" :disabled="busy">
          {{ busy ? 'Saving…' : 'Save' }}
        </button>
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
