// Scaffolded with AI assistance — see AI_USAGE.md
// Whether this browser has seen the landing page (/start). Like the guided tour, it is kept in
// localStorage as 'seen'. Storage can be blocked (private windows), so every read and write is
// guarded; when it can't be read the visitor goes to sign in, as before the landing page existed.
const LANDING_KEY = 'readalot-landing'
// a Sign up or Log in press, until App.vue picks it up; the browser's Back and Forward don't set it
let justChose = false

export function landingSeen() {
  try {
    return localStorage.getItem(LANDING_KEY) === 'seen'
  } catch {
    return true
  }
}

export function markLandingSeen() {
  justChose = true
  try {
    localStorage.setItem(LANDING_KEY, 'seen')
  } catch {
    // nothing to remember it in; the visitor may see the landing page again
  }
}

// True once after each press, so one choice plays the loading screen once.
export function justChoseOnLanding() {
  const chose = justChose
  justChose = false
  return chose
}
