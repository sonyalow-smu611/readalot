// Scaffolded with AI assistance — see AI_USAGE.md
// My Room's colours (buildings/house/strip/palette.json) as CSS variables, --room-<name>, so the
// app's pixel buttons are drawn in the same colours as the room's sprites and can't drift from them.
import PALETTE from '@/buildings/house/strip/palette.json'

export function applyRoomPalette(root = document.documentElement) {
  for (const [name, colour] of Object.entries(PALETTE)) {
    if (typeof colour === 'string') root.style.setProperty(`--room-${name}`, colour)
  }
}
