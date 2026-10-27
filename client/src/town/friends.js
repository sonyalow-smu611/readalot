// Scaffolded with AI assistance — see AI_USAGE.md
// Your friends in town, and how long since each of them was online. For now they are the demo
// readers (services/peopleDemo.js) with made-up last-seen times. When the real friends API is
// ready (GET /api/friends → [{ id, displayName, lastSeenAt, character }]), only getFriends()
// changes.
import { getDemoReader } from '@/services/peopleDemo.js'
import { makeRnd } from '@/lib/avatar/draw.js'
import { PRESETS, randomCharacter } from '@/lib/avatar/catalogue.js'

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

// how long ago each demo friend was last online: two online, and one house at each stage
const DEMO_AWAY = {
  'reader-emma': MINUTE,
  'reader-ayaan': MINUTE,
  'reader-priya': 2 * DAY,
  'reader-sofia': 12 * DAY,
  'reader-mei': 35 * DAY,
  'reader-noah': 70 * DAY,
  'reader-daniel': 100 * DAY,
}

// [{ id, displayName, lastSeenAt, character }], lastSeenAt an ISO date and character their town
// look (part ids, see lib/avatar/catalogue.js). Async, like the API call it stands in for.
export async function getFriends(now = Date.now()) {
  return Object.entries(DEMO_AWAY).flatMap(([id, away]) => {
    const reader = getDemoReader(id)
    if (!reader) return []
    return [{ id, displayName: reader.displayName, lastSeenAt: new Date(now - away).toISOString(), character: demoLook(id) }]
  })
}

// A demo friend's look: made up from their id, so it is the same every time.
function demoLook(id) {
  const seed = [...id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) & 0x7fffffff, 7)
  return randomCharacter(PRESETS[seed % PRESETS.length].id, makeRnd(seed))
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
