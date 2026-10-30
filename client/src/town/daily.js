// Scaffolded with AI assistance — see AI_USAGE.md
// Daily tasks: three a day, the same for every reader, new at midnight in Singapore (the day
// xp_events counts in). Finish all three to claim the day's reward; claim on days in a row for a
// streak, and the reward grows to its top on day 7. A missed day uses up a streak freeze if the
// reader has one, like Duolingo; with none left the streak starts again.
//
// Front end only for now: the state is kept in this browser (localStorage) until the backend
// (daily_claims and claim_daily() in the database) is written. Only loadState/saveState and the
// claim's coins change then.
const DAY = 24 * 60 * 60 * 1000
const STORAGE_KEY = 'readalot-daily'

// a reader holds up to this many freezes, starts with them all, and earns one back on each
// 7th day of a streak
export const MAX_FREEZES = 2
export const WEEK = 7

// coins and XP for each day of a streak; day 7 and every day after give the last one, and every
// 7th day is a chest that also gives back a streak freeze
const REWARDS = [
  { coins: 50, xp: 20 },
  { coins: 75, xp: 20 },
  { coins: 100, xp: 30 },
  { coins: 125, xp: 30 },
  { coins: 150, xp: 40 },
  { coins: 200, xp: 40 },
  { coins: 300, xp: 75 },
]

// Each task: what to do, a hint, the place Go flies to, and the actions that tick it off (the
// progress store's earn() actions, plus 'progress' for the reading slider and 'check-in').
const CHECK_IN = { id: 'check-in', title: 'Check in at town', hint: 'Open the map', place: null, actions: ['check-in'] }
const READING = {
  id: 'reading',
  title: 'Update your reading progress',
  hint: 'Move the slider on a book you are reading, in your room',
  place: 'house',
  actions: ['progress', 'start_book', 'finish_book'],
}
// the third task, one a day in turn; `friend` tasks go to a friend's house, and are skipped by a
// reader with no friends yet
const PICKS = [
  { id: 'visit-room', title: 'Visit a friend’s room', hint: 'Tap one of the small houses', friend: true, actions: ['visit_room'] },
  { id: 'send-message', title: 'Say hi to a reader', hint: 'Find someone at the cafe', place: 'cafe', actions: ['send_message'] },
  { id: 'add-book', title: 'Add a book to your shelf', hint: 'Browse the library', place: 'library', actions: ['add_book'] },
  { id: 'leave-note', title: 'Leave a note for a friend', hint: 'Pin it on the board in their room', friend: true, actions: ['leave_note'] },
]

// The date in Singapore as 'YYYY-MM-DD', moved on by `offset` days (the preview's Next day).
export function dayKey(now = Date.now(), offset = 0) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' }).format(new Date(now + offset * DAY))
}

function dayNumber(key) {
  return Math.round(Date.parse(`${key}T00:00:00Z`) / DAY)
}

export function daysBetween(from, to) {
  return dayNumber(to) - dayNumber(from)
}

// Milliseconds until the next midnight in Singapore (UTC+8, no daylight saving).
export function untilReset(now = Date.now()) {
  const sg = now + 8 * 60 * 60 * 1000
  return DAY - (sg % DAY)
}

// friendHouse: the place id of a friend's house, or null when you have none
export function tasksFor(day, friendHouse = null) {
  const picks = friendHouse ? PICKS : PICKS.filter((pick) => !pick.friend)
  const pick = picks[((dayNumber(day) % picks.length) + picks.length) % picks.length]
  return [CHECK_IN, READING, pick.friend ? { ...pick, place: friendHouse } : pick]
}

// { coins, xp, chest } for day n of a streak (1 = the first day)
export function rewardFor(n) {
  const base = REWARDS[Math.min(n, REWARDS.length) - 1]
  return { ...base, chest: n % WEEK === 0 }
}

export function freshState(day) {
  return { day, done: [], streak: 0, lastClaim: null, freezes: MAX_FREEZES, notice: null, shown: null, offset: 0 }
}

// The state moved on to `today`: today's ticks cleared and, if whole days went by without a claim,
// a freeze used for each of them, or the streak lost if there aren't enough. `notice` says which,
// for the panel to tell the reader once.
export function settle(state, today) {
  if (state.day === today) return state
  const next = { ...state, day: today, done: [], notice: null }
  if (!state.lastClaim || state.streak === 0) return next
  const missed = daysBetween(state.lastClaim, today) - 1
  if (missed <= 0) return next
  if (missed <= state.freezes) {
    next.freezes = state.freezes - missed
    // as if they had claimed yesterday: the streak carries on
    next.lastClaim = dayKey(Date.parse(`${today}T12:00:00+08:00`), -1)
    next.notice = { kind: 'frozen', used: missed, streak: state.streak }
  } else {
    next.notice = { kind: 'lost', streak: state.streak }
    next.streak = 0
    next.lastClaim = null
  }
  return next
}

// The saved state for one reader, or a fresh one. Storage can be missing or blocked.
export function loadState(readerId, today) {
  try {
    const saved = JSON.parse(localStorage.getItem(`${STORAGE_KEY}:${readerId}`) ?? 'null')
    if (saved && typeof saved.day === 'string') return { ...freshState(today), ...saved }
  } catch {
    // fall through to a fresh start
  }
  return freshState(today)
}

export function saveState(readerId, state) {
  try {
    localStorage.setItem(`${STORAGE_KEY}:${readerId}`, JSON.stringify(state))
  } catch {
    // kept for this visit only
  }
}
