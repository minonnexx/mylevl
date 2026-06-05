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
    return NextResponse.json({ reset: 0 })
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

  // Users who had a streak but missed yesterday → reset
  const toReset = activeProfiles
    .map(p => p.id as string)
    .filter(id => !activeYesterdayIds.has(id))

  if (toReset.length === 0) {
    return NextResponse.json({ reset: 0 })
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ current_streak: 0 })
    .in('id', toReset)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ reset: toReset.length, users: toReset })
}
