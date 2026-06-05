import { SupabaseClient } from '@supabase/supabase-js'
import { computeLevelUp } from '@/lib/xp'

export async function updateStreak(supabase: SupabaseClient, userId: string) {
  const today = new Date().toISOString().slice(0, 10) // UTC YYYY-MM-DD

  const { data: existingStreak } = await supabase
    .from('streaks')
    .select('id, missions_completed')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()

  if (existingStreak) {
    await supabase
      .from('streaks')
      .update({ missions_completed: existingStreak.missions_completed + 1 })
      .eq('id', existingStreak.id)
    return
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_streak, longest_streak, total_days_active, current_xp, global_level, xp_to_next_level')
    .eq('id', userId)
    .single()

  const newStreak     = (profile?.current_streak   ?? 0) + 1
  const longestStreak =  profile?.longest_streak   ?? 0
  const totalDays     = (profile?.total_days_active ?? 0) + 1

  await Promise.all([
    supabase.from('streaks').insert({
      user_id:            userId,
      date:               today,
      missions_completed: 1,
      streak_day:         newStreak,
    }),
    supabase
      .from('profiles')
      .update({
        current_streak:    newStreak,
        longest_streak:    newStreak > longestStreak ? newStreak : longestStreak,
        total_days_active: totalDays,
      })
      .eq('id', userId),
  ])

  // Auto-complete boss mission when streak hits a multiple of 7 (7, 14, 21…)
  if (newStreak % 7 === 0) {
    await autoCompleteBossMission(supabase, userId, {
      current_xp:       profile?.current_xp       ?? 0,
      global_level:     profile?.global_level      ?? 1,
      xp_to_next_level: profile?.xp_to_next_level  ?? 100,
    })
  }
}

async function autoCompleteBossMission(
  supabase: SupabaseClient,
  userId: string,
  profileXp: { current_xp: number; global_level: number; xp_to_next_level: number },
) {
  const { data: bossMission } = await supabase
    .from('missions')
    .select('id, xp_reward, life_class, difficulty')
    .eq('type', 'boss')
    .limit(1)
    .maybeSingle()

  if (!bossMission) return

  // Idempotency: skip if already completed today
  const todayStart = new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z'
  const { data: alreadyDone } = await supabase
    .from('completed_missions')
    .select('id')
    .eq('user_id', userId)
    .eq('mission_id', bossMission.id)
    .gte('completed_at', todayStart)
    .maybeSingle()

  if (alreadyDone) return

  await supabase
    .from('completed_missions')
    .insert({ user_id: userId, mission_id: bossMission.id })

  const difficultyPoints: Record<string, number> = { easy: 1, medium: 2, hard: 5, boss: 10 }
  const classPoints = difficultyPoints[bossMission.difficulty as string] ?? 10

  const { data: cpRes } = await supabase
    .from('class_progress')
    .select('points')
    .eq('user_id', userId)
    .eq('life_class', bossMission.life_class)
    .maybeSingle()

  const newPoints = ((cpRes as { points: number } | null)?.points ?? 0) + classPoints
  const newGlobal = computeLevelUp(profileXp.global_level, profileXp.current_xp, bossMission.xp_reward)

  await Promise.all([
    supabase
      .from('class_progress')
      .upsert(
        { user_id: userId, life_class: bossMission.life_class, points: newPoints },
        { onConflict: 'user_id,life_class' },
      ),
    supabase
      .from('profiles')
      .update({
        current_xp:       newGlobal.current_xp,
        global_level:     newGlobal.level,
        xp_to_next_level: newGlobal.xp_to_next_level,
      })
      .eq('id', userId),
  ])
}
