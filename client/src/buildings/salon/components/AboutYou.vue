<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Gender, age, religion and location as small cards, each edited in place on its own.
// The page saves; this card keeps the draft and moves focus in and out of the field.
import { nextTick, ref, watch } from 'vue'
import ProfileBlock from '@/buildings/salon/components/ProfileBlock.vue'
import { ABOUT_FIELDS, validAge } from '@/buildings/salon/profileOptions.js'

const props = defineProps({
  profile: { type: Object, required: true },
  // the field being edited, or ''
  editingKey: { type: String, default: '' },
  busy: { type: Boolean, default: false },
  // a save that failed
  error: { type: String, default: '' },
})

const emit = defineEmits(['edit', 'cancel', 'save', 'clear-error'])

const draft = ref('')
const invalid = ref('')

watch(
  () => props.editingKey,
  async (key, before) => {
    invalid.value = ''
    if (key) {
      const value = props.profile[key]
      draft.value = value === '' || value == null ? '' : String(value)
      await nextTick()
      document.getElementById(`about-${key}`)?.focus()
    } else if (before) {
      await nextTick()
      document.getElementById(`about-edit-${before}`)?.focus()
    }
  },
)

function check(field, value) {
  if (field.kind === 'choice' && !value) return 'Choose one, including prefer not to say.'
  if (field.kind === 'number' && !validAge(value)) return 'Enter an age from 13 to 120.'
  return ''
}

function submit(field) {
  // a number input's v-model hands back a number, so make it text before trimming
  const value = String(draft.value).trim()
  invalid.value = check(field, value)
  if (invalid.value) return
  emit('save', { [field.key]: field.kind === 'number' ? Number(value) : value })
}

function typed() {
  invalid.value = ''
  emit('clear-error')
}
</script>

<template>
  <ProfileBlock title="About you">
    <ul class="facts">
      <li
        v-for="field in ABOUT_FIELDS"
        :key="field.key"
        class="fact"
        :class="{ 'is-editing': editingKey === field.key }"
      >
        <form
          v-if="editingKey === field.key"
          novalidate
          @submit.prevent="submit(field)"
          @keydown.esc="emit('cancel')"
        >
          <label class="fact__label" :for="`about-${field.key}`">{{ field.label }}</label>
          <select
            v-if="field.kind === 'choice'"
            :id="`about-${field.key}`"
            v-model="draft"
            class="form-select form-select-sm"
            :aria-invalid="Boolean(invalid || error)"
            :aria-describedby="invalid || error ? 'about-error' : undefined"
            @change="typed"
          >
            <option value="" disabled>Choose one</option>
            <option v-for="option in field.options" :key="option" :value="option">{{ option }}</option>
          </select>
          <input
            v-else
            :id="`about-${field.key}`"
            v-model="draft"
            class="form-control form-control-sm"
            :type="field.kind === 'number' ? 'number' : 'text'"
            :min="field.kind === 'number' ? 13 : undefined"
            :max="field.kind === 'number' ? 120 : undefined"
            :inputmode="field.kind === 'number' ? 'numeric' : undefined"
            :maxlength="field.kind === 'text' ? 60 : undefined"
            :placeholder="field.kind === 'number' ? 'e.g. 21' : 'e.g. Tampines, Singapore'"
            :aria-invalid="Boolean(invalid || error)"
            :aria-describedby="invalid || error ? 'about-error' : undefined"
            @input="typed"
          />
          <p v-if="invalid || error" id="about-error" class="field-error" role="alert">{{ invalid || error }}</p>
          <div class="fact__actions">
            <button type="button" class="btn btn-sm btn-outline-primary" @click="emit('cancel')">Cancel</button>
            <button type="submit" class="btn btn-sm btn-primary" :disabled="busy">
              {{ busy ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </form>
        <template v-else>
          <p class="fact__label">{{ field.label }}</p>
          <p class="fact__value" :class="{ 'is-empty': !profile[field.key] }">
            {{ profile[field.key] || 'Not set' }}
          </p>
          <button
            :id="`about-edit-${field.key}`"
            type="button"
            class="fact__edit"
            :aria-label="`Edit ${field.label.toLowerCase()}`"
            :disabled="Boolean(editingKey)"
            @click="emit('edit', field.key)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" /></svg>
          </button>
        </template>
      </li>
    </ul>
  </ProfileBlock>
</template>

<style scoped>
.facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.fact {
  position: relative;
  min-width: 0;
  padding: 12px 40px 12px 14px;
  border: 2px solid #ead2de;
  border-radius: 14px;
  background: #fff7fb;
}

/* the card being edited takes the whole row so the field and buttons fit */
.fact.is-editing {
  grid-column: 1 / -1;
  padding-right: 14px;
  border-color: #a84874;
}

.fact__label {
  display: block;
  margin: 0 0 2px;
  color: var(--rl-muted);
  font-size: 0.8125rem;
}

.fact__value {
  margin: 0;
  overflow: hidden;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fact__value.is-empty {
  color: var(--rl-muted);
  font-weight: 400;
}

.fact__edit {
  position: absolute;
  top: 8px;
  right: 8px;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: #fbe7f0;
  color: #a84874;
}

/* a 44px touch target around the small button */
.fact__edit::before {
  content: '';
  position: absolute;
  inset: -8px;
}

.fact__edit:hover:not(:disabled) {
  background: #f6c9dc;
}

.fact__edit:disabled {
  opacity: 0.4;
}

.fact__edit svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.fact__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.fact__actions .btn {
  min-height: 36px;
  padding-inline: 14px;
}

.field-error {
  margin: 6px 0 0;
  color: #8d2218;
  font-size: 0.875rem;
}
</style>
