// Scaffolded with AI assistance — see AI_USAGE.md
// The reader's XP and coins, through the Supabase functions in database/xp_and_coins.sql.
// The database checks every limit; these only ask.
import { MISSING_KEYS, supabase } from '@/services/supabase.js'

function missing() {
  return { data: null, error: { message: MISSING_KEYS } }
}

// { xp, coins }
export async function loadProgress() {
  if (!supabase) return missing()
  return supabase.rpc('my_progress')
}

// action: add_book | start_book | finish_book | write_review | visit_room | leave_note |
// send_message. target: the book or reader it was about.
// { xp, gained, level, level_up, coins, coins_gained }, or null before Welcome is finished.
export async function earnXp(action, target = '') {
  if (!supabase) return missing()
  return supabase.rpc('earn_xp', { p_action: action, p_target: String(target) })
}

// the new balance; an error when there aren't enough coins
export async function spendCoins(amount) {
  if (!supabase) return missing()
  return supabase.rpc('spend_coins', { p_amount: amount })
}
