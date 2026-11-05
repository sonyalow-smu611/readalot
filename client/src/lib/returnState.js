// Scaffolded with AI assistance — see AI_USAGE.md
// Where a page was when the reader left it for another, kept for this tab only. A pop-up is not a
// page, so the Back button can't bring it back by itself: the page that opened it stashes what it
// showed under a name before the reader goes, and takes it back out when it mounts again. Taking
// it also forgets it, so it comes back once, for the Back button, and not on every later visit.
const memory = new Map()
const keyOf = (name) => `readalot.return.${name}`

export function stashView(name, state) {
  memory.set(name, state)
  try {
    sessionStorage.setItem(keyOf(name), JSON.stringify(state))
  } catch {
    // the copy in memory still serves this visit
  }
}

export function takeView(name) {
  let state = memory.get(name) ?? null
  memory.delete(name)
  try {
    if (!state) state = JSON.parse(sessionStorage.getItem(keyOf(name)) ?? 'null')
    sessionStorage.removeItem(keyOf(name))
  } catch {
    // nothing was kept
  }
  return state
}

export function forgetView(name) {
  takeView(name)
}
