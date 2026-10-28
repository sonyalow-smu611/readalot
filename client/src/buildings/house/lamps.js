// Scaffolded with AI assistance — see AI_USAGE.md
// The room's lamps, on or off, for the visit: My Room and each room visited keep their own. Both
// lamps start on. A visitor switching someone's lamps only changes them for their own visit.
import { reactive } from 'vue'

// the lamps that switch, by the id of their piece in strip/layout.js
export const LAMPS = [
  { id: 'floor-lamp', name: 'Floor lamp' },
  { id: 'table-lamp', name: 'Table lamp' },
]

const rooms = reactive({})

// { 'floor-lamp': true, … } for a room ('mine', or the visited reader's id)
export function lampsFor(room) {
  if (!rooms[room]) rooms[room] = Object.fromEntries(LAMPS.map(({ id }) => [id, true]))
  return rooms[room]
}

export function toggleLamp(room, id) {
  const lamps = lampsFor(room)
  lamps[id] = !lamps[id]
}
