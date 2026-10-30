// Scaffolded with AI assistance — see AI_USAGE.md
// Your friends in town, and how long since each of them was online: the readers who have a house
// in town (town/places.js), from the people store (GET /api/people), with when each was last
// active.
import { FRIEND_HOUSES } from '@/town/places.js'
import { usePeopleStore } from '@/stores/people.js'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
// seen this recently counts as online
export const ONLINE_WITHIN = 5 * MINUTE
// how a friend's house ages while they are away: dusty after a month, neglected (windows dark
// at night) after two, derelict after three
export const DUSTY_AFTER = 30 * DAY
export const NEGLECTED_AFTER = 60 * DAY
export const DERELICT_AFTER = 90 * DAY

// [{ id, displayName, lastSeenAt, character }], lastSeenAt an ISO date (or null when never seen)
// and character their town look (part ids, see lib/avatar/catalogue.js). Throws when the readers
// can't be loaded.
export async function getFriends() {
  const people = usePeopleStore()
  await people.load()
  if (people.error) throw new Error(people.error)
  return FRIEND_HOUSES.flatMap(({ reader: id }) => {
    const reader = people.find(id)
    if (!reader) return []
    return [{ id, displayName: reader.displayName, lastSeenAt: reader.lastSeenAt, character: reader.character }]
  })
}

// { online, upkeep: 'kept' | 'dusty' | 'neglected' | 'derelict', lastSeen: '6 days ago' } for one
// friend.
export function presence(lastSeenAt, now = Date.now()) {
  const away = Math.max(0, now - new Date(lastSeenAt).getTime())
  const online = away < ONLINE_WITHIN
  let upkeep = 'kept'
  if (!online && away >= DERELICT_AFTER) upkeep = 'derelict'
  else if (!online && away >= NEGLECTED_AFTER) upkeep = 'neglected'
  else if (!online && away >= DUSTY_AFTER) upkeep = 'dusty'
  return { online, upkeep, lastSeen: timeAgo(away) }
}

function timeAgo(ms) {
  const count = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'} ago`
  if (ms < HOUR) return count(Math.max(1, Math.round(ms / MINUTE)), 'minute')
  if (ms < DAY) return count(Math.round(ms / HOUR), 'hour')
  if (ms < 14 * DAY) return count(Math.round(ms / DAY), 'day')
  if (ms < 60 * DAY) return count(Math.round(ms / (7 * DAY)), 'week')
  return count(Math.round(ms / (30 * DAY)), 'month')
}
