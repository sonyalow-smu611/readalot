<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// One friend in the friends list: their character's head, with a green dot while they're online,
// the book they're reading and a chat button. Tapping the row finds them on the map; while you're
// choosing friends to remove, it ticks them instead.
import { computed } from 'vue'
import CharacterSprite from '@/components/shared/CharacterSprite.vue'
import { normaliseCharacter } from '@/lib/avatar/catalogue.js'
import { getCurrentlyReading } from '@/lib/readerMatch.js'

const props = defineProps({
  // { id, displayName, character, books, online, lastSeen, house }
  friend: { type: Object, required: true },
  // the list is choosing friends to remove
  selecting: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
})
const emit = defineEmits(['go', 'chat', 'toggle'])

const character = computed(() => normaliseCharacter(props.friend.character))
const first = computed(() => props.friend.displayName.split(' ')[0])
const book = computed(() => getCurrentlyReading(props.friend))
const seen = computed(() => (props.friend.online ? 'Online now' : `Last seen ${props.friend.lastSeen}`))
const reading = computed(() => (book.value ? `Reading ${book.value.title}` : ''))
const main = computed(() =>
  props.selecting
    ? {}
    : {
        type: 'button',
        disabled: !props.friend.house && !props.friend.online,
        'aria-label': [props.friend.displayName, seen.value, reading.value].filter(Boolean).join(', '),
      },
)
</script>

<template>
  <div class="friend-row">
    <component :is="selecting ? 'label' : 'button'" class="friend-row__main" v-bind="main" @click="!selecting && emit('go', friend)">
      <input
        v-if="selecting"
        type="checkbox"
        class="form-check-input friend-row__tick"
        :checked="selected"
        :aria-label="`Select ${friend.displayName}`"
        @change="emit('toggle', friend.id)"
      />
      <span class="friend-row__head">
        <CharacterSprite :character="character" :scale="2" crop="head" decorative />
        <span class="friend-row__dot" :class="{ 'is-online': friend.online }" aria-hidden="true"></span>
      </span>
      <span class="friend-row__words">
        <span class="friend-row__name">{{ friend.displayName }}</span>
        <span class="friend-row__line">{{ reading || seen }}</span>
      </span>
    </component>
    <button v-if="!selecting" type="button" class="btn btn-secondary btn-icon friend-row__chat" :aria-label="`Chat with ${first}`" @click="emit('chat', friend)">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H10l-4 4v-4H4z" /></svg>
    </button>
  </div>
</template>

<style scoped>
.friend-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-right: 6px;
}

.friend-row:hover {
  background: var(--rl-canvas);
}

.friend-row__main {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 62px;
  margin: 0;
  padding: 6px 4px 6px 8px;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--rl-text);
  text-align: left;
}

label.friend-row__main {
  cursor: pointer;
}

.friend-row__tick {
  flex: none;
  width: 22px;
  height: 22px;
  margin: 0;
}

.friend-row__head {
  position: relative;
  flex: none;
  line-height: 0;
}

.friend-row__dot {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 12px;
  height: 12px;
  border: 2px solid var(--rl-surface);
  border-radius: 50%;
  background: var(--rl-line);
}

.friend-row__dot.is-online {
  background: #3fae5a;
}

.friend-row__words {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.friend-row__name {
  overflow: hidden;
  font-size: 15px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.friend-row__line {
  overflow: hidden;
  font-size: 13px;
  color: var(--rl-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.friend-row__chat {
  flex: none;
}

.friend-row__chat svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linejoin: round;
}
</style>
