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
import { createAdminClient } from '@/lib/supabase/admin'

export type MilestoneResult = {
  days: 7 | 30 | 90
  medalName: string
  medalIcon: string
  xpBonus: number
} | null

export type MissionActionResult = {
  levelUp: boolean
  newLevel: number
  xpReward: number
  shieldGranted: boolean
  allMissionsCompleted: boolean
  daySummary?: DaySummary
  error?: boolean
  ts: number
  streak?: number
  milestone?: MilestoneResult
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

function computeStreakFromDates(sortedDescDates: string[]): number {
  if (sortedDescDates.length === 0) return 0
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)
  if (sortedDescDates[0] !== todayStr) return 0
  let streak = 1
  for (let i = 1; i < sortedDescDates.length; i++) {
    const a = new Date(sortedDescDates[i - 1] + 'T00:00:00Z')
    const b = new Date(sortedDescDates[i] + 'T00:00:00Z')
    if (Math.round((a.getTime() - b.getTime()) / 86_400_000) === 1) streak++
    else break
  }
  return streak
}

const MILESTONE_XP   = { 7: 50,             30: 150,       90: 300        } as const
const MILESTONE_NAME = { 7: 'Primera semana', 30: 'Un mes', 90: 'Tres meses' } as const
const MILESTONE_ICON = { 7: 'flame',          30: 'calendar', 90: 'trophy'  } as const

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

    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const todayStr = todayStart.toISOString().slice(0, 10)

    // Idempotency + mission details + previous completions — all in parallel
    const [existingRes, missionRes, prevCompletionsRes] = await Promise.all([
      supabase
        .from('custom_mission_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('custom_mission_id', customMissionId)
        .gte('completed_at', todayStart.toISOString())
        .maybeSingle(),
      supabase
        .from('custom_missions')
        .select('title, strict_mode, life_class')
        .eq('id', customMissionId)
        .single(),
      supabase
        .from('custom_mission_completions')
        .select('completed_at')
        .eq('user_id', user.id)
        .eq('custom_mission_id', customMissionId)
        .lt('completed_at', todayStart.toISOString())
        .order('completed_at', { ascending: false }),
    ])

    if (existingRes.data) return null

    const mData = missionRes.data as { title: string; strict_mode: boolean; life_class: string } | null
    const missionTitle     = mData?.title       ?? ''
    const missionLifeClass = mData?.life_class  ?? lifeClass

    // Insert today's completion
    await supabase.from('custom_mission_completions').insert({
      user_id: user.id,
      custom_mission_id: customMissionId,
    })

    // Compute consecutive streak including today
    const prevDates   = (prevCompletionsRes.data ?? []).map(
      c => (c as { completed_at: string }).completed_at.slice(0, 10)
    )
    const allDatesDesc  = [...new Set([todayStr, ...prevDates])].sort().reverse()
    const currentStreak = computeStreakFromDates(allDatesDesc)

    // Check milestones (7 / 30 / 90)
    let milestoneResult: MilestoneResult = null
    let bonusXp = 0

    for (const days of [7, 30, 90] as const) {
      if (currentStreak === days) {
        const { data: alreadyAchieved } = await supabase
          .from('custom_mission_milestones')
          .select('id')
          .eq('user_id', user.id)
          .eq('custom_mission_id', customMissionId)
          .eq('milestone_days', days)
          .maybeSingle()

        if (!alreadyAchieved) {
          bonusXp = MILESTONE_XP[days]
          const medalName = `${MILESTONE_NAME[days]} — ${missionTitle}`
          milestoneResult = { days, medalName, medalIcon: MILESTONE_ICON[days], xpBonus: bonusXp }

          await supabase.from('custom_mission_milestones').insert({
            user_id: user.id,
            custom_mission_id: customMissionId,
            milestone_days: days,
          })

          try {
            const admin = createAdminClient()
            const { data: mRecord } = await admin
              .from('missions')
              .insert({
                title:             medalName,
                description:       `Completaste tu misión personalizada durante ${days} días seguidos.`,
                life_class:        missionLifeClass,
                difficulty:        'hard',
                type:              'achievement',
                xp_reward:         bonusXp,
                verification:      'manual',
                verification_type: 'automatic',
                required_level:    1,
                sort_order:        null,
                pack:              null,
              })
              .select('id')
              .single()

            if (mRecord) {
              const mId = (mRecord as { id: string }).id
              await Promise.all([
                admin.from('medals').insert({
                  mission_id:        mId,
                  name:              medalName,
                  icon:              MILESTONE_ICON[days],
                  rarity:            'epic',
                  unlock_percentage: 0,
                }),
                supabase.from('completed_missions').insert({
                  user_id:    user.id,
                  mission_id: mId,
                }),
              ])
            }
          } catch {}
        }
        break
      }
    }

    // XP + class points + global streak shield — in parallel
    const [{ shieldGranted }, cpRes, profileRes] = await Promise.all([
      updateStreak(supabase, user.id),
      supabase.from('class_progress').select('points').eq('user_id', user.id).eq('life_class', lifeClass).maybeSingle(),
      supabase.from('profiles').select('current_xp, global_level').eq('id', user.id).single(),
    ])

    const difficultyPoints: Record<string, number> = { easy: 1, medium: 2, hard: 5 }
    const classPoints = difficultyPoints[difficulty] ?? 1
    const newPoints   = ((cpRes.data as { points: number } | null)?.points ?? 0) + classPoints
    const oldProfile  = profileRes.data as { current_xp: number; global_level: number } | null
    const newGlobal   = computeLevelUp(
      oldProfile?.global_level ?? 1,
      oldProfile?.current_xp   ?? 0,
      xpReward + bonusXp,
    )
    const didLevelUp = newGlobal.level > (oldProfile?.global_level ?? 1)

    await Promise.all([
      supabase.from('class_progress').upsert(
        { user_id: user.id, life_class: lifeClass, points: newPoints },
        { onConflict: 'user_id,life_class' },
      ),
      supabase.from('profiles').update({
        current_xp:       newGlobal.current_xp,
        global_level:     newGlobal.level,
        xp_to_next_level: newGlobal.xp_to_next_level,
      }).eq('id', user.id),
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
      xpReward: xpReward + bonusXp,
      shieldGranted,
      allMissionsCompleted: false,
      streak: currentStreak,
      milestone: milestoneResult,
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
  strict_mode: boolean
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
      user_id:     user.id,
      title:       input.title.trim().slice(0, 50),
      life_class:  input.life_class,
      difficulty:  input.difficulty,
      xp_reward,
      duration:    input.duration,
      starts_at,
      ends_at,
      active:      true,
      strict_mode: input.strict_mode,
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
