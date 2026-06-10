'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { computeLevelUp } from '@/lib/xp'
import { updateStreak } from '@/lib/streaks'
import { getDaySummary } from '@/lib/recap'
import type { DaySummary } from '@/lib/recap'

export type AchievementActionResult = {
  levelUp: boolean
  newLevel: number
  xpReward: number
  shieldGranted: boolean
  allMissionsCompleted: boolean
  daySummary?: DaySummary
  error?: boolean
  ts: number
} | null

export async function markAvatarConfirmationShown(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('profiles')
    .update({ avatar_confirmation_shown: true })
    .eq('id', user.id)
}

export async function completeAchievementAction(
  _prev: AchievementActionResult,
  formData: FormData,
): Promise<AchievementActionResult> {
  const missionId   = formData.get('missionId') as string
  const xpReward    = Number(formData.get('xpReward'))
  const lifeClass   = formData.get('lifeClass') as string
  const difficulty  = formData.get('difficulty') as string
  const missionType = formData.get('missionType') as string

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth')

    // Boss: once per rolling 7-day window. Achievement: once ever.
    let alreadyDone = false
    if (missionType === 'boss') {
      const weekStart = new Date()
      weekStart.setUTCDate(weekStart.getUTCDate() - 6)
      weekStart.setUTCHours(0, 0, 0, 0)
      const { data: existing } = await supabase
        .from('completed_missions')
        .select('id')
        .eq('user_id', user.id)
        .eq('mission_id', missionId)
        .gte('completed_at', weekStart.toISOString())
        .maybeSingle()
      alreadyDone = !!existing
    } else {
      const { data: existing } = await supabase
        .from('completed_missions')
        .select('id')
        .eq('user_id', user.id)
        .eq('mission_id', missionId)
        .maybeSingle()
      alreadyDone = !!existing
    }
    if (alreadyDone) return null

    await supabase.from('completed_missions').insert({ user_id: user.id, mission_id: missionId })
    const { shieldGranted } = await updateStreak(supabase, user.id)

    const [cpRes, profileRes, missionRes] = await Promise.all([
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
      supabase
        .from('missions')
        .select('title')
        .eq('id', missionId)
        .maybeSingle(),
    ])

    const difficultyPoints: Record<string, number> = { easy: 1, medium: 2, hard: 5, boss: 10 }
    const classPoints = difficultyPoints[difficulty] ?? 1
    const newPoints   = ((cpRes.data as { points: number } | null)?.points ?? 0) + classPoints
    const oldProfile  = profileRes.data as { current_xp: number; global_level: number } | null
    const newGlobal   = computeLevelUp(
      oldProfile?.global_level ?? 1,
      oldProfile?.current_xp   ?? 0,
      xpReward,
    )
    const didLevelUp = newGlobal.level > (oldProfile?.global_level ?? 1)

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

    revalidatePath('/achievements')
    revalidatePath('/dashboard')
    revalidatePath('/recap')

    try {
      await supabase.from('social_feed').insert({
        user_id: user.id,
        event_type: 'mission_completed',
        metadata: {
          mission_title: (missionRes.data as { title: string } | null)?.title,
          life_class: lifeClass,
          xp_reward: xpReward,
        },
      })
    } catch {}
    if (didLevelUp) {
      try {
        await supabase.from('social_feed').insert({
          user_id: user.id,
          event_type: 'level_up',
          metadata: { new_level: newGlobal.level },
        })
      } catch {}
    }

    const summary = await getDaySummary(supabase, user.id)
    const allMissionsCompleted =
      summary.missionsTotal > 0 && summary.missionsCompleted >= summary.missionsTotal

    return {
      levelUp: didLevelUp,
      newLevel: newGlobal.level,
      xpReward,
      shieldGranted,
      allMissionsCompleted,
      daySummary: allMissionsCompleted ? summary : undefined,
      ts: Date.now(),
    }
  } catch {
    return { error: true, levelUp: false, newLevel: 0, xpReward: 0, shieldGranted: false, allMissionsCompleted: false, ts: Date.now() }
  }
}
