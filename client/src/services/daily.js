// Scaffolded with AI assistance — see AI_USAGE.md
// The reader's daily tasks, through the Supabase functions in database/daily_tasks.sql. The database
// keeps the day, checks a claim and pays its reward; these only ask. Each gives { data, error }.
import { MISSING_KEYS, supabase } from '@/services/supabase.js'

function missing() {
  return { data: null, error: { message: MISSING_KEYS } }
}

// Today's state, moved on to today: { day, done, streak, last_claim, freezes, notice, shown }
export async function loadDaily() {
  if (!supabase) return missing()
  return supabase.rpc('daily_today')
}

// taskId: one of the ids in town/daily.js. The state, with it ticked off.
export async function markDailyDone(taskId) {
  if (!supabase) return missing()
  return supabase.rpc('daily_done', { p_task: taskId })
}

export async function markDailyShown() {
  if (!supabase) return missing()
  return supabase.rpc('daily_mark_shown')
}

export async function dismissDailyNotice() {
  if (!supabase) return missing()
  return supabase.rpc('daily_dismiss_notice')
}

// { state, n, coins, xp, chest, total_xp, balance, level_up }; an error when it can't be claimed
export async function claimDaily() {
  if (!supabase) return missing()
  return supabase.rpc('claim_daily')
}
