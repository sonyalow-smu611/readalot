// Scaffolded with AI assistance — see AI_USAGE.md
// How long since a reader was online, and what that does to their house.

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

// { online, upkeep: 'kept' | 'dusty' | 'neglected' | 'derelict', lastSeen: '6 days ago' } for one
// reader. Someone with no last-active date yet hasn't been away: they're just not known.
export function presence(lastSeenAt, now = Date.now()) {
  if (!lastSeenAt) return { online: false, upkeep: 'kept', lastSeen: 'a while ago' }
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
