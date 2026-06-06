'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { computeLevelUp } from '@/lib/xp'
import { updateStreak } from '@/lib/streaks'

export type DaySummary = {
  xpToday: number
  classPointsToday: Record<string, number>
  currentStreak: number
  shieldCount: number
}

export type MissionActionResult = {
  levelUp: boolean
  newLevel: number
  xpReward: number
  shieldGranted: boolean
  allMissionsCompleted: boolean
  daySummary?: DaySummary
  ts: number
} | null

export async function completeMissionAction(
  _prev: MissionActionResult,
  formData: FormData,
): Promise<MissionActionResult> {
  const missionId  = formData.get('missionId') as string
  const xpReward   = Number(formData.get('xpReward'))
  const lifeClass  = formData.get('lifeClass') as string
  const difficulty = formData.get('difficulty') as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Idempotency — one completion per mission per UTC day
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)
  const { data: existing } = await supabase
    .from('completed_missions')
    .select('id')
    .eq('user_id', user.id)
    .eq('mission_id', missionId)
    .gte('completed_at', todayStart.toISOString())
    .maybeSingle()
  if (existing) return null

  await supabase.from('completed_missions').insert({ user_id: user.id, mission_id: missionId })
  const { shieldGranted } = await updateStreak(supabase, user.id)

  // Fetch current class points and global profile state in parallel
  const [cpRes, profileRes] = await Promise.all([
    supabase
      .from('class_progress')
      .select('points')
      .eq('user_id', user.id)
      .eq('life_class', lifeClass)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('current_xp, global_level')
      .eq('id', user.id)
      .single(),
  ])

  const difficultyPoints: Record<string, number> = { easy: 1, medium: 2, hard: 5, boss: 10 }
  const classPoints = difficultyPoints[difficulty] ?? 1
  const newPoints   = ((cpRes.data as { points: number } | null)?.points ?? 0) + classPoints
  const oldProfile = profileRes.data as { current_xp: number; global_level: number } | null
  const newGlobal  = computeLevelUp(
    oldProfile?.global_level ?? 1,
    oldProfile?.current_xp   ?? 0,
    xpReward,
  )
  const didLevelUp = newGlobal.level > (oldProfile?.global_level ?? 1)

  // Persist both updates in parallel
  await Promise.all([
    supabase
      .from('class_progress')
      .upsert(
        { user_id: user.id, life_class: lifeClass, points: newPoints },
        { onConflict: 'user_id,life_class' },
      ),
    supabase
      .from('profiles')
      .update({
        current_xp:       newGlobal.current_xp,
        global_level:     newGlobal.level,
        xp_to_next_level: newGlobal.xp_to_next_level,
      })
      .eq('id', user.id),
  ])

  revalidatePath('/missions')
  revalidatePath('/dashboard')
  revalidatePath('/recap')

  // Check if all daily missions are now complete
  const [dailyRes, completedTodayRes] = await Promise.all([
    supabase.from('missions').select('id').eq('type', 'daily'),
    supabase
      .from('completed_missions')
      .select('mission_id, missions(xp_reward, life_class, difficulty)')
      .eq('user_id', user.id)
      .gte('completed_at', todayStart.toISOString()),
  ])

  const dailyIds = new Set((dailyRes.data ?? []).map((m: { id: string }) => m.id))

  type CompletedRow = {
    mission_id: string
    missions: { xp_reward: number; life_class: string; difficulty: string } | null
  }
  const completedTodayRows = (completedTodayRes.data ?? []) as unknown as CompletedRow[]
  const completedTodayIds = new Set(completedTodayRows.map(c => c.mission_id))

  const allMissionsCompleted =
    dailyIds.size > 0 && [...dailyIds].every(id => completedTodayIds.has(id))

  let daySummary: DaySummary | undefined
  if (allMissionsCompleted) {
    const diffPts: Record<string, number> = { easy: 1, medium: 2, hard: 5, boss: 10 }
    let xpToday = 0
    const classPointsToday: Record<string, number> = {}
    for (const row of completedTodayRows) {
      if (!row.missions) continue
      xpToday += row.missions.xp_reward
      const pts = diffPts[row.missions.difficulty] ?? 1
      classPointsToday[row.missions.life_class] =
        (classPointsToday[row.missions.life_class] ?? 0) + pts
    }
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('current_streak, shield_count')
      .eq('id', user.id)
      .single()
    type ProfileSnap = { current_streak: number; shield_count: number }
    const snap = updatedProfile as ProfileSnap | null
    daySummary = {
      xpToday,
      classPointsToday,
      currentStreak: snap?.current_streak ?? 0,
      shieldCount: snap?.shield_count ?? 0,
    }
  }

  return {
    levelUp: didLevelUp,
    newLevel: newGlobal.level,
    xpReward,
    shieldGranted,
    allMissionsCompleted,
    daySummary,
    ts: Date.now(),
  }
}
