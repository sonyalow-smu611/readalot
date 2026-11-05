// Scaffolded with AI assistance — see AI_USAGE.md
// How tall the walkthrough's text bar is right now: taller on a phone, where its words wrap onto
// more lines. The app shrinks by this much while the walkthrough plays (App.vue), and the bar
// takes it (GuideTour.vue). It follows the window as it is resized or turned.
import { readonly, ref } from 'vue'
import { BAR_HEIGHT, BAR_HEIGHT_PHONE, PHONE_MAX } from '@/lib/walkthrough.js'

const now = () => (window.innerWidth <= PHONE_MAX ? BAR_HEIGHT_PHONE : BAR_HEIGHT)
const height = ref(now())
window.addEventListener('resize', () => (height.value = now()))

export function useBarHeight() {
  return readonly(height)
}
