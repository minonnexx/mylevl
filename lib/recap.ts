import type { SupabaseClient } from '@supabase/supabase-js'

const DIFF_PTS: Record<string, number> = { easy: 1, medium: 2, hard: 5, boss: 10 }

export type MissionSummaryItem = {
  mission_id: string
  title: string
  xp_reward: number
  life_class: string
  difficulty: string
  type: string
}

export type DaySummary = {
  xpEarnedToday: number
  missionsCompleted: number
  missionsTotal: number
  classPoints: { fisico: number; mental: number; disciplina: number }
  currentStreak: number
  shieldCount: number
  dailyMissions: MissionSummaryItem[]
  bossMission: MissionSummaryItem | null
  achievements: MissionSummaryItem[]
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
      .select('mission_id, missions(title, xp_reward, life_class, difficulty, type)')
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
    missions: {
      title: string
      xp_reward: number
      life_class: string
      difficulty: string
      type: string
    } | null
  }
  const rows = (completedTodayRes.data ?? []) as unknown as CompletedRow[]

  let xpEarnedToday = 0
  const classPoints = { fisico: 0, mental: 0, disciplina: 0 }
  const dailyMissions: MissionSummaryItem[] = []
  let bossMission: MissionSummaryItem | null = null
  const achievements: MissionSummaryItem[] = []

  for (const row of rows) {
    if (!row.missions) continue
    xpEarnedToday += row.missions.xp_reward
    const pts = DIFF_PTS[row.missions.difficulty] ?? 1
    const lc = row.missions.life_class as keyof typeof classPoints
    if (lc in classPoints) classPoints[lc] += pts

    const item: MissionSummaryItem = {
      mission_id: row.mission_id,
      title: row.missions.title,
      xp_reward: row.missions.xp_reward,
      life_class: row.missions.life_class,
      difficulty: row.missions.difficulty,
      type: row.missions.type,
    }

    if (row.missions.type === 'daily') {
      dailyMissions.push(item)
    } else if (row.missions.type === 'boss') {
      bossMission = item
    } else if (row.missions.type === 'achievement') {
      achievements.push(item)
    }
  }

  type ProfileSnap = { current_streak: number; shield_count: number }
  const snap = profileRes.data as ProfileSnap | null

  return {
    xpEarnedToday,
    missionsCompleted: dailyMissions.length,
    missionsTotal: (totalDailyRes.data ?? []).length,
    classPoints,
    currentStreak: snap?.current_streak ?? 0,
    shieldCount: snap?.shield_count ?? 0,
    dailyMissions,
    bossMission,
    achievements,
  }
}
