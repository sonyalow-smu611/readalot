// Scaffolded with AI assistance — see AI_USAGE.md
const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// "just now", "5 minutes ago", "3 days ago", "2 weeks ago", "4 months ago"
export function timeAgo(value, now = Date.now()) {
  const ms = Math.max(0, now - new Date(value).getTime())
  const count = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'} ago`
  if (ms < MINUTE) return 'just now'
  if (ms < HOUR) return count(Math.round(ms / MINUTE), 'minute')
  if (ms < DAY) return count(Math.round(ms / HOUR), 'hour')
  if (ms < 14 * DAY) return count(Math.round(ms / DAY), 'day')
  if (ms < 60 * DAY) return count(Math.round(ms / (7 * DAY)), 'week')
  return count(Math.round(ms / (30 * DAY)), 'month')
}

const exact = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

// "30 Oct 2026, 2:15 pm"; empty for a date that can't be read
export function exactDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : exact.format(date)
}
