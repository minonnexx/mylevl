import type { SupabaseClient } from '@supabase/supabase-js'

const DIFF_PTS: Record<string, number> = { easy: 1, medium: 2, hard: 5, boss: 10 }

export type DaySummary = {
  xpEarnedToday: number
  missionsCompleted: number
  missionsTotal: number
  classPoints: { fisico: number; mental: number; disciplina: number }
  currentStreak: number
  shieldCount: number
}

export async function getDaySummary(
  supabase: SupabaseClient,
  userId: string,
): Promise<DaySummary> {
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const [totalDailyRes, completedTodayRes, profileRes] = await Promise.all([
    supabase.from('missions').select('id').eq('type', 'daily'),
    supabase
      .from('completed_missions')
      .select('mission_id, missions(xp_reward, life_class, difficulty)')
      .eq('user_id', userId)
      .gte('completed_at', todayStart.toISOString()),
    supabase
      .from('profiles')
      .select('current_streak, shield_count')
      .eq('id', userId)
      .single(),
  ])

  type CompletedRow = {
    mission_id: string
    missions: { xp_reward: number; life_class: string; difficulty: string } | null
  }
  const rows = (completedTodayRes.data ?? []) as unknown as CompletedRow[]

  let xpEarnedToday = 0
  const classPoints = { fisico: 0, mental: 0, disciplina: 0 }

  for (const row of rows) {
    if (!row.missions) continue
    xpEarnedToday += row.missions.xp_reward
    const pts = DIFF_PTS[row.missions.difficulty] ?? 1
    const lc = row.missions.life_class as keyof typeof classPoints
    if (lc in classPoints) classPoints[lc] += pts
  }

  type ProfileSnap = { current_streak: number; shield_count: number }
  const snap = profileRes.data as ProfileSnap | null

  return {
    xpEarnedToday,
    missionsCompleted: rows.filter(r => r.missions !== null).length,
    missionsTotal: (totalDailyRes.data ?? []).length,
    classPoints,
    currentStreak: snap?.current_streak ?? 0,
    shieldCount: snap?.shield_count ?? 0,
  }
}
