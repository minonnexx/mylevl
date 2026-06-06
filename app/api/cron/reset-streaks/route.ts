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
  const shieldUpdates: { id: string; shield_count: number; shield_used_at: string }[] = []

  for (const p of shieldData ?? []) {
    if ((p.shield_count as number ?? 0) > 0) {
      shieldUpdates.push({
        id: p.id as string,
        shield_count: (p.shield_count as number) - 1,
        shield_used_at: now,
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

  return NextResponse.json({
    reset: unshieldedIds.length,
    shielded: shieldUpdates.length,
    users: toReset,
  })
}
