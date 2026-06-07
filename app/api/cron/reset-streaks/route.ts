import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  return NextResponse.json({
    reset: unshieldedIds.length,
    shielded: shieldUpdates.length,
    users: toReset,
  })
}
