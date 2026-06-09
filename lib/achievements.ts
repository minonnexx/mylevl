import type { SupabaseClient } from '@supabase/supabase-js'

interface UnlockedAchievement {
  id: string
  title: string
}

export async function checkAutoAchievements(
  supabase: SupabaseClient,
  userId: string,
): Promise<UnlockedAchievement[]> {
  // 1. Load profile, completed_missions count, and pending auto achievements in parallel
  const [profileRes, countRes, pendingRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('total_days_active, current_streak')
      .eq('id', userId)
      .single(),
    supabase
      .from('completed_missions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('missions')
      .select('id, title')
      .eq('type', 'achievement')
      .eq('verification_type', 'automatic'),
  ])

  if (profileRes.error || !profileRes.data || pendingRes.error || !pendingRes.data) return []

  const profile = profileRes.data as { total_days_active: number; current_streak: number }
  const totalCompleted = countRes.count ?? 0
  const candidates = pendingRes.data as { id: string; title: string }[]

  if (candidates.length === 0) return []

  // Filter out achievements already completed by this user
  const { data: alreadyDone } = await supabase
    .from('completed_missions')
    .select('mission_id')
    .eq('user_id', userId)
    .in('mission_id', candidates.map(c => c.id))

  const doneIds = new Set((alreadyDone ?? []).map(r => r.mission_id as string))
  const remaining = candidates.filter(c => !doneIds.has(c.id))
  if (remaining.length === 0) return []

  // 2. Fetch per-mission completed dates for streak-based checks (only missions we might need)
  const MEDITACION_TITLE   = 'Medita 10 minutos'
  const EJERCICIO_TITLE    = 'Entrena 30 minutos'
  const REDES_TITLE        = 'No redes sociales por 2 horas'
  const LIBRO_TITLE        = 'Terminar un libro'

  const [meditacionRes, ejercicioRes, redesRes, libroRes] = await Promise.all([
    supabase
      .from('completed_missions')
      .select('completed_at, missions!inner(title)')
      .eq('user_id', userId)
      .eq('missions.title', MEDITACION_TITLE),
    supabase
      .from('completed_missions')
      .select('completed_at, missions!inner(title)')
      .eq('user_id', userId)
      .eq('missions.title', EJERCICIO_TITLE),
    supabase
      .from('completed_missions')
      .select('completed_at, missions!inner(title)')
      .eq('user_id', userId)
      .eq('missions.title', REDES_TITLE),
    supabase
      .from('completed_missions')
      .select('completed_at, missions!inner(title)')
      .eq('user_id', userId)
      .eq('missions.title', LIBRO_TITLE),
  ])

  // Helper: extract unique UTC date strings from completed_at rows
  const toDates = (rows: { completed_at: string }[] | null): string[] =>
    [...new Set((rows ?? []).map(r => r.completed_at.slice(0, 10)))].sort()

  const meditacionDates = toDates(meditacionRes.data as { completed_at: string }[] | null)
  const ejercicioDates  = toDates(ejercicioRes.data  as { completed_at: string }[] | null)
  const redesDates      = toDates(redesRes.data      as { completed_at: string }[] | null)
  const booksRead       = (libroRes.data ?? []).length

  // Helper: check N consecutive dates exist in a sorted array
  function hasConsecutiveDays(dates: string[], n: number): boolean {
    if (dates.length < n) return false
    let streak = 1
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1])
      const curr = new Date(dates[i])
      const diff = (curr.getTime() - prev.getTime()) / 86_400_000
      if (diff === 1) {
        streak++
        if (streak >= n) return true
      } else {
        streak = 1
      }
    }
    return false
  }

  // 3. Evaluate conditions for each remaining achievement
  const unlocked: UnlockedAchievement[] = []

  for (const mission of remaining) {
    const t = mission.title.toLowerCase()
    let met = false

    if (t.includes('30 días activos')) {
      met = profile.total_days_active >= 30
    } else if (t.includes('365 días activos')) {
      met = profile.total_days_active >= 365
    } else if (t.includes('100 misiones')) {
      met = totalCompleted >= 100
    } else if (t.includes('meditar') || t.includes('medita')) {
      met = hasConsecutiveDays(meditacionDates, 7)
    } else if (t.includes('ejercicio') || t.includes('entrena')) {
      met = ejercicioDates.length >= 30
    } else if (t.includes('redes')) {
      met = hasConsecutiveDays(redesDates, 7)
    } else if (t.includes('5 libros') || t.includes('leer 5')) {
      met = booksRead >= 5
    }

    if (met) unlocked.push(mission)
  }

  if (unlocked.length === 0) return []

  // 4. Insert completions + feed events
  const now = new Date().toISOString()

  await Promise.all(
    unlocked.map(m =>
      supabase.from('completed_missions').insert({
        user_id: userId,
        mission_id: m.id,
        completed_at: now,
      }),
    ),
  )

  try {
    await supabase.from('social_feed').insert(
      unlocked.map(m => ({
        user_id: userId,
        event_type: 'achievement_unlocked',
        metadata: { mission_title: m.title, mission_id: m.id },
      })),
    )
  } catch {}

  return unlocked
}
