<script setup>
// Scaffolded with AI assistance — see AI_USAGE.md
// The bell in the town's top bar, with how many notifications you haven't seen. It opens the
// list (NotificationsPanel).
import { computed } from 'vue'

const props = defineProps({
  unread: { type: Number, default: 0 },
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle'])

const label = computed(() => `Notifications, ${props.unread} new`)
</script>

<template>
  <button
    type="button"
    class="btn btn-secondary btn-icon px-sign notifications-button"
    :aria-label="label"
    :aria-expanded="open"
    aria-controls="town-notifications"
    @click="emit('toggle')"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.8 2H4.2z" />
      <path d="M10 21.2a2.2 2.2 0 0 0 4 0" />
    </svg>
    <span v-if="unread" class="notifications-button__badge" aria-hidden="true">{{ unread > 9 ? '9+' : unread }}</span>
  </button>
</template>

<style scoped>
.notifications-button {
  position: relative;
  pointer-events: auto;
}

/* a phone's top bar has no room beside the weather chip: it sits next to the Daily button instead */
@media (max-width: 600px) {
  .notifications-button {
    position: absolute;
    top: 62px;
    left: 82px;
  }
}

.notifications-button svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.notifications-button__badge {
  position: absolute;
  top: -7px;
  right: -7px;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  border: 2px solid #2b1d24;
  border-radius: 999px;
  background: #e5484d;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  line-height: 16px;
  text-align: center;
}
</style>
