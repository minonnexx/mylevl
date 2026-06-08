import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile, LifeClass } from '@/types/supabase'
import { getDaySummary } from '@/lib/recap'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { RecapClient, type WeekData, type MonthData } from '@/components/recap/RecapClient'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFF_PTS: Record<string, number> = { easy: 1, medium: 2, hard: 5, boss: 10 }

function buildHeatmap(
  rows: Array<{ completed_at: string }>,
  days: number,
): { date: string; count: number }[] {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const countByDate: Record<string, number> = {}
  for (const row of rows) {
    const dateStr = row.completed_at.split('T')[0]
    countByDate[dateStr] = (countByDate[dateStr] ?? 0) + 1
  }
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (days - 1 - i))
    const dateStr = d.toISOString().split('T')[0]
    return { date: dateStr, count: countByDate[dateStr] ?? 0 }
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RecapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const monthStart = new Date()
  monthStart.setDate(monthStart.getDate() - 29)
  monthStart.setUTCHours(0, 0, 0, 0)

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 6)
  weekStart.setUTCHours(0, 0, 0, 0)

  const [profileRes, completedMonthRes, streaksMonthRes, summary] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('completed_missions')
      .select('completed_at, missions(xp_reward, life_class, difficulty)')
      .eq('user_id', user.id)
      .gte('completed_at', monthStart.toISOString())
      .order('completed_at', { ascending: true }),
    supabase
      .from('streaks')
      .select('date, streak_day')
      .eq('user_id', user.id)
      .gte('date', monthStart.toISOString().split('T')[0]),
    getDaySummary(supabase, user.id),
  ])

  const profile = (profileRes.data as Profile | null) ?? {
    id: user.id,
    username: null,
    onboarding_completed: false,
    global_level: 1, current_xp: 0, xp_to_next_level: 100,
    current_streak: 0, longest_streak: 0, total_days_active: 0,
    shield_count: 0, shield_active: false, shield_used_at: null,
    shield_notification_shown: false, feed_public: true,
    date_of_birth: null, username_changed_at: null, active_pack: null, created_at: new Date().toISOString(),
  }

  type MonthRow = {
    completed_at: string
    missions: { xp_reward: number; life_class: string; difficulty: string } | null
  }
  const monthRows = (completedMonthRes.data ?? []) as unknown as MonthRow[]

  // ── Weekly data ────────────────────────────────────────────────────────────
  const weekStartIso = weekStart.toISOString()
  const weekRows = monthRows.filter(r => r.completed_at >= weekStartIso)

  const weekClassPts = { fisico: 0, mental: 0, disciplina: 0 }
  let weekXp = 0
  let weekMissions = 0
  const weekActiveDates = new Set<string>()

  for (const row of weekRows) {
    if (!row.missions) continue
    weekXp += row.missions.xp_reward
    weekMissions++
    weekActiveDates.add(row.completed_at.split('T')[0])
    const pts = DIFF_PTS[row.missions.difficulty] ?? 1
    const lc = row.missions.life_class as keyof typeof weekClassPts
    if (lc in weekClassPts) weekClassPts[lc] += pts
  }

  const topClassEntry = (['fisico', 'mental', 'disciplina'] as LifeClass[])
    .map(lc => ({ lc, points: weekClassPts[lc] }))
    .filter(e => e.points > 0)
    .sort((a, b) => b.points - a.points)[0] ?? null

  const weekData: WeekData = {
    activeDays: weekActiveDates.size,
    xpEarned: weekXp,
    missionsCompleted: weekMissions,
    topClass: topClassEntry,
    currentStreak: profile.current_streak,
    heatmap: buildHeatmap(weekRows, 7),
  }

  // ── Monthly data ───────────────────────────────────────────────────────────
  const monthClassPts = { fisico: 0, mental: 0, disciplina: 0 }
  let monthXp = 0
  let monthMissions = 0
  const monthActiveDates = new Set<string>()

  for (const row of monthRows) {
    if (!row.missions) continue
    monthXp += row.missions.xp_reward
    monthMissions++
    monthActiveDates.add(row.completed_at.split('T')[0])
    const pts = DIFF_PTS[row.missions.difficulty] ?? 1
    const lc = row.missions.life_class as keyof typeof monthClassPts
    if (lc in monthClassPts) monthClassPts[lc] += pts
  }

  type StreakRow = { date: string; streak_day: number }
  const streakRows = (streaksMonthRes.data ?? []) as StreakRow[]
  const bestStreak = streakRows.reduce((max, r) => Math.max(max, r.streak_day ?? 0), 0)

  const monthData: MonthData = {
    activeDays: monthActiveDates.size,
    xpEarned: monthXp,
    missionsCompleted: monthMissions,
    classPoints: monthClassPts,
    bestStreak,
    heatmap: buildHeatmap(monthRows, 30),
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="md:ml-16 flex-1 min-w-0 flex flex-col min-h-screen">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-20 h-14 px-4 md:px-8 flex items-center justify-between"
          style={{
            background: 'rgba(14,14,16,0.9)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-accent" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
            <span className="font-semibold text-text-primary tracking-tight">mylevl</span>
          </div>
          <Link
            href="/profile"
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            {profile.username ?? 'Jugador'}
          </Link>
        </header>

        {/* ── Content ─────────────────────────────────────────────────── */}
        <main className="flex-1 py-6 px-4 md:py-8 md:px-8 pb-28 md:pb-8">
          <div className="max-w-[720px] mx-auto flex flex-col gap-8">

            {/* Page header */}
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">Recap</h1>
              <p className="text-[13px] mt-0.5 text-text-muted">
                Tu progreso en el tiempo
              </p>
            </div>

            {/* Client component with tabs */}
            <RecapClient
              daySummary={summary}
              weekData={weekData}
              monthData={monthData}
              profile={profile}
            />

          </div>
        </main>

      </div>

      <BottomNav />
    </div>
  )
}
