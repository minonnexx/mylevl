import type { SupabaseClient } from '@supabase/supabase-js'
import { CHALLENGE_POOL, getChallengeByWeekNumber, type ChallengeDefinition } from './constants/challenges'

export function getCurrentWeekStart(): Date {
  const now = new Date()
  const day = now.getUTCDay() // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - diff)
  monday.setUTCHours(0, 0, 0, 0)
  return monday
}

export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export async function getOrCreateWeeklyChallenge(
  supabase: SupabaseClient,
  weekStart: Date,
): Promise<{ challenge: ChallengeDefinition; weekStartStr: string } | null> {
  const weekStartStr = weekStart.toISOString().slice(0, 10)

  const { data: existing } = await supabase
    .from('weekly_challenges')
    .select('challenge_key')
    .eq('week_start', weekStartStr)
    .maybeSingle()

  let challengeKey: string

  if (existing) {
    challengeKey = existing.challenge_key as string
  } else {
    const weekNumber = getISOWeekNumber(weekStart)
    challengeKey = getChallengeByWeekNumber(weekNumber).key

    await supabase
      .from('weekly_challenges')
      .upsert({ week_start: weekStartStr, challenge_key: challengeKey }, { onConflict: 'week_start' })
  }

  const challenge = CHALLENGE_POOL.find(c => c.key === challengeKey)
  if (!challenge) return null

  return { challenge, weekStartStr }
}

export async function getWeeklyChallengeProgress(
  supabase: SupabaseClient,
  userId: string,
  weekStartStr: string,
  challenge: ChallengeDefinition,
): Promise<number> {
  const { data: weekCompletions } = await supabase
    .from('completed_missions')
    .select('mission_id, completed_at')
    .eq('user_id', userId)
    .gte('completed_at', `${weekStartStr}T00:00:00.000Z`)

  const completions = weekCompletions ?? []

  if (challenge.type === 'count' && challenge.life_class) {
    const missionIds = completions.map(c => c.mission_id as string)
    if (missionIds.length === 0) return 0
    const { count } = await supabase
      .from('missions')
      .select('id', { count: 'exact', head: true })
      .in('id', missionIds)
      .eq('life_class', challenge.life_class)
    return count ?? 0
  }

  if (challenge.type === 'xp') {
    const missionIds = completions.map(c => c.mission_id as string)
    if (missionIds.length === 0) return 0
    const { data: missions } = await supabase
      .from('missions')
      .select('xp_reward')
      .in('id', missionIds)
    return (missions ?? []).reduce((sum, m) => sum + ((m.xp_reward as number) ?? 0), 0)
  }

  if (challenge.type === 'streak') {
    const activeDays = new Set(
      completions.map(c => (c.completed_at as string).slice(0, 10)),
    )
    const monday = new Date(`${weekStartStr}T00:00:00.000Z`)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    let streak = 0
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setUTCDate(monday.getUTCDate() + i)
      if (day > today) break
      const dayStr = day.toISOString().slice(0, 10)
      if (activeDays.has(dayStr)) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  return 0
}
