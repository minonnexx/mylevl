import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAutoAchievements } from '@/lib/achievements'
import { getISOWeekNumber } from '@/lib/challenges'
import { getChallengeByWeekNumber } from '@/lib/constants/challenges'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Yesterday in UTC (YYYY-MM-DD)
  const yesterday = new Date()
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  // Users with an active streak
  const { data: activeProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id')
    .gt('current_streak', 0)

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  if (!activeProfiles?.length) {
    return NextResponse.json({ reset: 0, shielded: 0 })
  }

  // Users who DID log a streak entry yesterday
  const { data: activeYesterday, error: streaksError } = await supabase
    .from('streaks')
    .select('user_id')
    .eq('date', yesterdayStr)

  if (streaksError) {
    return NextResponse.json({ error: streaksError.message }, { status: 500 })
  }

  const activeYesterdayIds = new Set((activeYesterday ?? []).map(r => r.user_id as string))

  // Users who had a streak but missed yesterday
  const toReset = activeProfiles
    .map(p => p.id as string)
    .filter(id => !activeYesterdayIds.has(id))

  if (toReset.length === 0) {
    return NextResponse.json({ reset: 0, shielded: 0 })
  }

  // Fetch shield inventory for all users who missed yesterday
  const { data: shieldData, error: shieldError } = await supabase
    .from('profiles')
    .select('id, shield_count')
    .in('id', toReset)

  if (shieldError) {
    return NextResponse.json({ error: shieldError.message }, { status: 500 })
  }

  const unshieldedIds: string[] = []
  const now = new Date().toISOString()
  const shieldUpdates: { id: string; shield_count: number; shield_used_at: string; shield_notification_shown: boolean }[] = []

  for (const p of shieldData ?? []) {
    if ((p.shield_count as number ?? 0) > 0) {
      shieldUpdates.push({
        id: p.id as string,
        shield_count: (p.shield_count as number) - 1,
        shield_used_at: now,
        shield_notification_shown: false,
      })
    } else {
      unshieldedIds.push(p.id as string)
    }
  }

  const [resetResult, shieldResult] = await Promise.all([
    unshieldedIds.length > 0
      ? supabase.from('profiles').update({ current_streak: 0 }).in('id', unshieldedIds)
      : Promise.resolve({ error: null }),
    shieldUpdates.length > 0
      ? supabase.from('profiles').upsert(shieldUpdates)
      : Promise.resolve({ error: null }),
  ])

  if (resetResult.error) {
    return NextResponse.json({ error: resetResult.error.message }, { status: 500 })
  }
  if (shieldResult.error) {
    return NextResponse.json({ error: shieldResult.error.message }, { status: 500 })
  }

  // Streak milestone feed events for users who are still active
  const STREAK_MILESTONES = new Set([7, 14, 30, 60, 100])
  if (activeYesterdayIds.size > 0) {
    try {
      const { data: activeMilestoneProfiles } = await supabase
        .from('profiles')
        .select('id, current_streak')
        .in('id', Array.from(activeYesterdayIds))

      const milestoneInserts = (activeMilestoneProfiles ?? [])
        .filter(p => STREAK_MILESTONES.has(p.current_streak as number))
        .map(p => ({
          user_id: p.id as string,
          event_type: 'streak_milestone',
          metadata: { streak_days: p.current_streak },
        }))

      if (milestoneInserts.length > 0) {
        await supabase.from('social_feed').insert(milestoneInserts)
      }
    } catch {}
  }

  // Auto-achievements for all users still active yesterday
  if (activeYesterdayIds.size > 0) {
    for (const uid of Array.from(activeYesterdayIds)) {
      try { await checkAutoAchievements(supabase, uid) } catch {}
    }
  }

  // Recalculate unlock_percentage for every medal
  try {
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('onboarding_completed', true)

    if (totalUsers && totalUsers > 0) {
      const { data: allMedals } = await supabase
        .from('medals')
        .select('id, mission_id')

      if (allMedals?.length) {
        const missionIds = allMedals.map(m => m.mission_id as string)

        const { data: completionCounts } = await supabase
          .from('completed_missions')
          .select('mission_id')
          .in('mission_id', missionIds)

        const countMap: Record<string, number> = {}
        for (const row of completionCounts ?? []) {
          const mid = row.mission_id as string
          // Count distinct users — deduplicate by fetching user counts per mission
          countMap[mid] = (countMap[mid] ?? 0) + 1
        }

        // For accuracy, count distinct users per mission
        const distinctCountMap: Record<string, number> = {}
        for (const missionId of missionIds) {
          const { count } = await supabase
            .from('completed_missions')
            .select('user_id', { count: 'exact', head: true })
            .eq('mission_id', missionId)
          distinctCountMap[missionId] = count ?? 0
        }

        const updates = allMedals.map(medal => ({
          id: medal.id as string,
          unlock_percentage: Math.round(
            ((distinctCountMap[medal.mission_id as string] ?? 0) / totalUsers) * 1000,
          ) / 10,
        }))

        for (const upd of updates) {
          await supabase
            .from('medals')
            .update({ unlock_percentage: upd.unlock_percentage })
            .eq('id', upd.id)
        }
      }
    }
  } catch {}

  // Weekly challenge seeding + league stats reset — runs only on Mondays UTC
  const todayUTCDay = new Date().getUTCDay()
  if (todayUTCDay === 1) {
    try {
      const now = new Date()

      // Seed the weekly challenge row for the new week
      const thisMonday = new Date(now)
      thisMonday.setUTCHours(0, 0, 0, 0)
      const thisWeekStr = thisMonday.toISOString().slice(0, 10)
      const weekNumber = getISOWeekNumber(thisMonday)
      const weekChallenge = getChallengeByWeekNumber(weekNumber)
      await supabase
        .from('weekly_challenges')
        .upsert({ week_start: thisWeekStr, challenge_key: weekChallenge.key }, { onConflict: 'week_start' })
    } catch {}

    try {
      const now = new Date()

      // Previous week started 7 days ago (last Monday)
      const prevWeekStart = new Date(now)
      prevWeekStart.setUTCDate(now.getUTCDate() - 7)
      prevWeekStart.setUTCHours(0, 0, 0, 0)

      // Current week starts today (this Monday)
      const currentWeekStart = new Date(now)
      currentWeekStart.setUTCHours(0, 0, 0, 0)

      const prevWeekStartStr = prevWeekStart.toISOString()
      const currentWeekStartStr = currentWeekStart.toISOString()

      // Get all leagues with at least one accepted member
      const { data: allLeagues } = await supabase
        .from('leagues')
        .select('id')

      for (const league of allLeagues ?? []) {
        const leagueId = league.id as string

        // Get accepted members
        const { data: members } = await supabase
          .from('league_members')
          .select('user_id')
          .eq('league_id', leagueId)
          .eq('status', 'accepted')

        const memberIds = (members ?? []).map(m => m.user_id as string)
        if (!memberIds.length) continue

        // 1. Save stats for the previous week
        const { data: completions } = await supabase
          .from('completed_missions')
          .select('user_id, mission_id')
          .in('user_id', memberIds)
          .gte('completed_at', prevWeekStartStr)
          .lt('completed_at', currentWeekStartStr)

        const missionIds = [...new Set((completions ?? []).map(c => c.mission_id as string))]
        let xpMap: Record<string, number> = {}
        if (missionIds.length > 0) {
          const { data: missionsData } = await supabase
            .from('missions')
            .select('id, xp_reward')
            .in('id', missionIds)
          xpMap = Object.fromEntries((missionsData ?? []).map(m => [m.id as string, m.xp_reward as number]))
        }

        const statsMap: Record<string, { xp: number; missions: number }> = {}
        for (const uid of memberIds) statsMap[uid] = { xp: 0, missions: 0 }
        for (const c of completions ?? []) {
          const uid = c.user_id as string
          if (statsMap[uid]) {
            statsMap[uid].missions++
            statsMap[uid].xp += xpMap[c.mission_id as string] ?? 0
          }
        }

        const prevWeekUpserts = memberIds.map(uid => ({
          league_id: leagueId,
          user_id: uid,
          week_start: prevWeekStart.toISOString().slice(0, 10),
          xp_earned: statsMap[uid]?.xp ?? 0,
          missions_completed: statsMap[uid]?.missions ?? 0,
        }))

        await supabase
          .from('league_weekly_stats')
          .upsert(prevWeekUpserts, { onConflict: 'league_id,user_id,week_start' })

        // 2. Create fresh rows for the new week
        const newWeekInserts = memberIds.map(uid => ({
          league_id: leagueId,
          user_id: uid,
          week_start: currentWeekStart.toISOString().slice(0, 10),
          xp_earned: 0,
          missions_completed: 0,
        }))

        await supabase
          .from('league_weekly_stats')
          .upsert(newWeekInserts, { onConflict: 'league_id,user_id,week_start' })
      }
    } catch {}
  }

  return NextResponse.json({
    reset: unshieldedIds.length,
    shielded: shieldUpdates.length,
    users: toReset,
  })
}
