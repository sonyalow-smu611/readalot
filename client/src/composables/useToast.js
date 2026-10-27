// Scaffolded with AI assistance — see AI_USAGE.md
// One shared toast. Any view calls show(); the single <Toast> in App.vue renders it.
import { reactive } from 'vue'

const state = reactive({ message: '', visible: false, action: null })
let timer = null

export function useToast() {
  // `action` adds one button to the toast, e.g. { label: 'Undo', run: () => {} }
  function show(message, ms = 2200, action = null) {
    state.message = message
    state.action = action
    state.visible = true
    clearTimeout(timer)
    timer = window.setTimeout(() => {
      state.visible = false
    }, ms)
  }

  function hide() {
    clearTimeout(timer)
    state.visible = false
  }

  return { state, show, hide }
}
