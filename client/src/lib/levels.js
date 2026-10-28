// Scaffolded with AI assistance — see AI_USAGE.md
// Reader levels from XP: level 2 at 100 XP, and each level after costs 50 more than the one
// before (level 3 at 250, level 4 at 450, …). The same sum as xp_for_level() in
// database/xp_and_coins.sql, which awards 25 x the new level in coins at each level-up.

export const START_COINS = 480

export function xpForLevel(level) {
  const n = level - 1
  return 100 * n + 25 * n * (n - 1)
}

// { level, from, to, toNext, progress 0-1 } for a total of XP
export function levelFor(xp) {
  let level = 1
  while (xp >= xpForLevel(level + 1)) level += 1
  const from = xpForLevel(level)
  const to = xpForLevel(level + 1)
  return { level, from, to, toNext: to - xp, progress: (xp - from) / (to - from) }
}
