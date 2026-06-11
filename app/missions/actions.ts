'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { computeLevelUp } from '@/lib/xp'
import { updateStreak } from '@/lib/streaks'
import { getDaySummary } from '@/lib/recap'
import type { DaySummary } from '@/lib/recap'
import type { LifeClass, CustomMissionDifficulty, CustomMissionDuration } from '@/types/supabase'
import { checkAutoAchievements } from '@/lib/achievements'

export type MissionActionResult = {
  levelUp: boolean
  newLevel: number
  xpReward: number
  shieldGranted: boolean
  allMissionsCompleted: boolean
  daySummary?: DaySummary
  error?: boolean
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

  try {
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

    // Fetch current class points, global profile state, and mission title in parallel
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

    // Feed events — fire and forget, never block main flow
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

// ─── Complete custom mission ──────────────────────────────────────────────────

export async function completeCustomMissionAction(
  _prev: MissionActionResult,
  formData: FormData,
): Promise<MissionActionResult> {
  const customMissionId = formData.get('customMissionId') as string
  const xpReward        = Number(formData.get('xpReward'))
  const lifeClass       = formData.get('lifeClass') as string
  const difficulty      = formData.get('difficulty') as string

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth')

    // Idempotency — one completion per custom mission per UTC day
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const { data: existing } = await supabase
      .from('custom_mission_completions')
      .select('id')
      .eq('user_id', user.id)
      .eq('custom_mission_id', customMissionId)
      .gte('completed_at', todayStart.toISOString())
      .maybeSingle()
    if (existing) return null

    await supabase.from('custom_mission_completions').insert({
      user_id: user.id,
      custom_mission_id: customMissionId,
    })
    const { shieldGranted } = await updateStreak(supabase, user.id)

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

    const difficultyPoints: Record<string, number> = { easy: 1, medium: 2, hard: 5 }
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

    revalidatePath('/missions')
    revalidatePath('/dashboard')
    revalidatePath('/recap')

    try {
      await supabase.from('social_feed').insert({
        user_id: user.id,
        event_type: 'mission_completed',
        metadata: { life_class: lifeClass, xp_reward: xpReward },
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

    try { await checkAutoAchievements(supabase, user.id) } catch {}

    return {
      levelUp: didLevelUp,
      newLevel: newGlobal.level,
      xpReward,
      shieldGranted,
      allMissionsCompleted: false,
      ts: Date.now(),
    }
  } catch {
    return { error: true, levelUp: false, newLevel: 0, xpReward: 0, shieldGranted: false, allMissionsCompleted: false, ts: Date.now() }
  }
}

// ─── Custom missions ─────────────────────────────────────────────────────────

export async function createCustomMissionAction(input: {
  title: string
  life_class: LifeClass
  difficulty: CustomMissionDifficulty
  duration: CustomMissionDuration
}): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    // Free plan: max 1 active custom mission
    const { count } = await supabase
      .from('custom_missions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('active', true)

    if ((count ?? 0) >= 1) return { error: 'Límite del plan gratuito' }

    const XP_MAP: Record<CustomMissionDifficulty, number> = { easy: 10, medium: 20, hard: 40 }
    const xp_reward = XP_MAP[input.difficulty]

    const starts_at = new Date().toISOString().split('T')[0]
    let ends_at: string | null = null
    if (input.duration !== 'indefinido') {
      const end = new Date()
      end.setDate(end.getDate() + parseInt(input.duration))
      ends_at = end.toISOString().split('T')[0]
    }

    const { error } = await supabase.from('custom_missions').insert({
      user_id: user.id,
      title: input.title.trim().slice(0, 50),
      life_class: input.life_class,
      difficulty: input.difficulty,
      xp_reward,
      duration: input.duration,
      starts_at,
      ends_at,
      active: true,
    })

    if (error) return { error: 'No se pudo crear la misión' }

    revalidatePath('/missions')
    return {}
  } catch {
    return { error: 'Error al crear la misión' }
  }
}

export async function deleteCustomMissionAction(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error } = await supabase
      .from('custom_missions')
      .update({ active: false })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: 'No se pudo eliminar la misión' }

    revalidatePath('/missions')
    return {}
  } catch {
    return { error: 'Error al eliminar la misión' }
  }
}
