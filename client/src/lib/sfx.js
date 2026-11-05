// Scaffolded with AI assistance — see AI_USAGE.md
// Sound effects: button clicks, the "off we go" pop when you send your character somewhere,
// footsteps while it walks there, and the door with its shop bell as you go in.
// All sounds are CC0 (Kenney's Interface, RPG and Impact packs; 100 CC0 SFX), in public/sfx/.
//
// Web Audio, not <audio>: a sound plays the instant it's asked for and can overlap itself
// (footsteps, quick clicks). Browsers keep audio locked until the first tap; every sound here
// follows a tap, and the first one unlocks it.

const SOUNDS = {
  click: { files: ['/sfx/click.mp3'], volume: 0.45 },
  go: { files: ['/sfx/go.mp3'], volume: 0.7 },
  door: { files: ['/sfx/door.mp3'], volume: 0.75 },
  grass: { files: [0, 1, 2, 3, 4].map((i) => `/sfx/steps/grass-${i}.mp3`), volume: 0.32 },
  pavement: { files: [0, 1, 2, 3, 4].map((i) => `/sfx/steps/pavement-${i}.mp3`), volume: 0.32 },
}

// a click this close before "go" is the same tap (e.g. the Go in button): only "go" is heard
const SAME_TAP_MS = 150

let context = null
const buffers = {}
let loading = null
let lastClick = null
const lastVariant = {}

// shared with lib/ambience.js, so one tap unlocks both
export function audioContext() {
  if (!context) {
    const Context = window.AudioContext || window.webkitAudioContext
    if (!Context) return null
    context = new Context()
  }
  return context
}

// Fetches and decodes every sound once.
function load() {
  if (loading) return loading
  const ctx = audioContext()
  if (!ctx) return Promise.resolve()
  loading = Promise.all(
    Object.entries(SOUNDS).map(async ([name, { files }]) => {
      buffers[name] = await Promise.all(
        files.map(async (file) => {
          try {
            const response = await fetch(file)
            return await ctx.decodeAudioData(await response.arrayBuffer())
          } catch {
            return null
          }
        }),
      )
    }),
  )
  return loading
}

// A different take from last time, so footsteps don't sound like one sample on repeat.
function pick(name) {
  const takes = (buffers[name] ?? []).filter(Boolean)
  if (takes.length < 2) return takes[0] ?? null
  let i = Math.floor(Math.random() * takes.length)
  if (i === lastVariant[name]) i = (i + 1) % takes.length
  lastVariant[name] = i
  return takes[i]
}

export function playSfx(name) {
  const sound = SOUNDS[name]
  const ctx = audioContext()
  if (!sound || !ctx) return
  // development only: tests read what played from window.__sfxLog
  if (import.meta.env.DEV && window.__sfxLog) window.__sfxLog.push(name)
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  const buffer = pick(name)
  if (!buffer) {
    // not loaded yet (the very first tap): load, and play it if that's quick
    const asked = performance.now()
    load().then(() => {
      if (performance.now() - asked < 400) playSfx(name)
    })
    return
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  // a touch of pitch variety on footsteps
  if (name === 'grass' || name === 'pavement') source.playbackRate.value = 0.94 + Math.random() * 0.12
  const gain = ctx.createGain()
  gain.gain.value = sound.volume
  source.connect(gain).connect(ctx.destination)
  source.start()

  if (name === 'click') lastClick = { source, at: performance.now() }
  if (name === 'go' && lastClick && performance.now() - lastClick.at < SAME_TAP_MS) {
    try {
      lastClick.source.stop()
    } catch {
      // already finished
    }
    lastClick = null
  }
}

// Every button in the app clicks: real buttons, links styled as buttons, and role="button".
const CLICKABLE = 'button, a.btn, [role="button"], input[type="checkbox"], input[type="radio"]'

let listening = false
export function startButtonClicks() {
  if (listening || typeof document === 'undefined') return
  listening = true
  load()
  // any tap unlocks audio (browsers keep it suspended until then), for the ambience too
  document.addEventListener(
    'pointerdown',
    () => {
      if (context?.state === 'suspended') context.resume().catch(() => {})
    },
    true,
  )
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target instanceof Element ? event.target.closest(CLICKABLE) : null
      if (!target || target.disabled || target.getAttribute('aria-disabled') === 'true') return
      playSfx('click')
    },
    true,
  )
}
