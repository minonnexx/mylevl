/**
 * XP required to advance from `level` to `level + 1`.
 * Level 1 → 100 XP, Level 2 → 241 XP, Level 3 → 415 XP …
 */
export function xpToNextLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.6))
}

export interface LevelState {
  level: number
  current_xp: number
  xp_to_next_level: number
}

/**
 * Applies `gainedXp` to the current state, handling any number of level-ups.
 * Returns the new level, remaining XP, and the new threshold.
 */
export function computeLevelUp(
  currentLevel: number,
  currentXp: number,
  gainedXp: number,
): LevelState {
  let level = currentLevel
  let xp    = currentXp + gainedXp

  while (true) {
    const threshold = xpToNextLevel(level)
    if (xp < threshold) {
      return { level, current_xp: xp, xp_to_next_level: threshold }
    }
    xp -= threshold
    level++
  }
}
