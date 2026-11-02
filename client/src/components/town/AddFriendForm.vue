<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// Type a username to send a friend request (town/username.js says what it's waiting on). The view
// sends it and says how it went.
import { ref, watch } from 'vue'
import { cleanUsername } from '@/town/username.js'

const props = defineProps({
  // { busy, ok, message } for the last try, or null
  status: { type: Object, default: null },
  // your own username, to share; '' until you have one
  username: { type: String, default: '' },
})
const emit = defineEmits(['add'])

const text = ref('')

function submit() {
  const username = cleanUsername(text.value)
  if (username) emit('add', username)
}

// sent: ready for the next one
watch(
  () => props.status?.ok,
  (ok) => {
    if (ok) text.value = ''
  },
)
</script>

<template>
  <form class="add-friend" @submit.prevent="submit">
    <label class="add-friend__label" for="add-friend-username">Friend's username</label>
    <div class="add-friend__row">
      <input
        id="add-friend-username"
        v-model="text"
        class="form-control"
        type="text"
        autocomplete="off"
        autocapitalize="none"
        spellcheck="false"
      />
      <button type="submit" class="btn btn-primary btn-sm" :disabled="status?.busy || !text.trim()">Send request</button>
    </div>
    <p v-if="status?.message" class="add-friend__message" :class="{ 'is-wrong': !status.ok }" role="status">{{ status.message }}</p>
    <p v-if="username" class="add-friend__yours">Your username: {{ username }}</p>
  </form>
</template>

<style scoped>
.add-friend {
  padding: 4px 8px 8px;
}

.add-friend__label {
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 700;
  color: var(--rl-text);
}

.add-friend__row {
  display: flex;
  gap: 6px;
}

.add-friend__row .form-control {
  flex: 1;
  min-width: 0;
  min-height: 44px;
}

.add-friend__row .btn {
  flex: none;
}

.add-friend__message {
  margin: 6px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: #2f7a43;
}

.add-friend__message.is-wrong {
  color: #b3362f;
}

.add-friend__yours {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--rl-muted);
}
</style>
