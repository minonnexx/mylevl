import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Mission, Profile } from '@/types/supabase'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { MissionAreaWrapper } from '@/components/dashboard/MissionAreaWrapper'
import { XpBar } from '@/components/dashboard/XpBar'
import { ShieldIndicator } from '@/components/ui/ShieldIndicator'
import { EmptyState } from '@/components/ui/EmptyState'
import { Sword, Flame } from 'lucide-react'
import { AppHeader } from '@/components/ui/AppHeader'
import AvatarDisplay from '@/components/avatar/AvatarDisplay'
import { WeeklyChallengeCard } from '@/components/dashboard/WeeklyChallengeCard'
import { getCurrentWeekStart, getOrCreateWeeklyChallenge, getWeeklyChallengeProgress } from '@/lib/challenges'
import { CustomMissionsDashboardSection } from '@/components/dashboard/CustomMissionsDashboardSection'
import type { CustomMission } from '@/types/supabase'

function StatRow({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub: string }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border/40 last:border-b-0">
      <div className="w-9 h-9 rounded-component bg-surface-elevated flex items-center justify-center text-text-muted flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-semibold text-text-primary tabular-nums">
          {value} <span className="font-normal text-text-muted">{sub}</span>
        </p>
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const todayUTC = new Date()
  todayUTC.setUTCHours(0, 0, 0, 0)

  const weekStart = getCurrentWeekStart()

  const [profileRes, completedRes, completedTodayRes, customMissionsRes, customCompletionsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('completed_missions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('completed_missions').select('mission_id').eq('user_id', user.id).gte('completed_at', todayUTC.toISOString()),
    supabase.from('custom_missions').select('*').eq('user_id', user.id).eq('active', true).order('created_at'),
    supabase.from('custom_mission_completions')
      .select('custom_mission_id, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false }),
  ])

  if (profileRes.data && !profileRes.data.onboarding_completed && !profileRes.data.username) {
    redirect('/onboarding')
  }

  const profile: Profile = (profileRes.data as Profile | null) ?? {
    id: user.id,
    username: null,
    onboarding_completed: false,
    global_level: 1,
    current_xp: 0,
    xp_to_next_level: 100,
    current_streak: 0,
    longest_streak: 0,
    total_days_active: 0,
    shield_count: 0,
    shield_used_at: null,
    shield_notification_shown: true,
    avatar_confirmation_shown: false,
    feed_public: true,
    date_of_birth: null,
    username_changed_at: null,
    active_pack: null,
    avatar_config: null,
    created_at: new Date().toISOString(),
  }

  type CompletionRow = { custom_mission_id: string; completed_at: string }
  const allCustomCompletions = (customCompletionsRes.data ?? []) as CompletionRow[]
  const todayStr = todayUTC.toISOString().slice(0, 10)

  function computeStreakFromDates(sortedDescDates: string[]): number {
    if (sortedDescDates.length === 0) return 0
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

  const completedCustomSet = new Set(
    allCustomCompletions
      .filter(c => c.completed_at >= todayUTC.toISOString())
      .map(c => c.custom_mission_id)
  )

  const completionsByMission = new Map<string, string[]>()
  for (const c of allCustomCompletions) {
    const dateStr = c.completed_at.slice(0, 10)
    const existing = completionsByMission.get(c.custom_mission_id) ?? []
    if (!existing.includes(dateStr)) {
      existing.push(dateStr)
      completionsByMission.set(c.custom_mission_id, existing)
    }
  }

  const customMissions = (customMissionsRes.data ?? []).map(m => {
    const mission = m as CustomMission
    const datesDesc = (completionsByMission.get(mission.id) ?? []).slice().sort().reverse()
    const completedToday = completedCustomSet.has(mission.id)
    const withToday = completedToday && !datesDesc.includes(todayStr)
      ? [todayStr, ...datesDesc]
      : datesDesc
    return { ...mission, completed_today: completedToday, streak: computeStreakFromDates(withToday) }
  })

  let dailyMissionsQuery = supabase
    .from('missions')
    .select('*')
    .eq('type', 'daily')
    .order('sort_order', { ascending: true, nullsFirst: false })

  if (profile.active_pack) {
    dailyMissionsQuery = dailyMissionsQuery.eq('pack', profile.active_pack)
  }

  const dailyMissionsRes = await dailyMissionsQuery

  const showShieldNotification = !!profile.shield_used_at && !profile.shield_notification_shown

  const completedCount = completedRes.count ?? 0
  const completedTodayIds = new Set((completedTodayRes.data ?? []).map(c => c.mission_id as string))

  const dailyMissions = (dailyMissionsRes.data as Mission[] | null) ?? []
  const pendingDaily  = dailyMissions.filter(m => !completedTodayIds.has(m.id))
  const allDailyDone  = dailyMissions.length > 0 && pendingDaily.length === 0

  // Weekly challenge data
  const weekChallengeData = await getOrCreateWeeklyChallenge(supabase, weekStart)
  const weekStartStr = weekStart.toISOString().slice(0, 10)

  let weeklyProgress = 0
  let weeklyIsCompleted = false

  if (weekChallengeData) {
    const [progress, completionRes] = await Promise.all([
      getWeeklyChallengeProgress(supabase, user.id, weekStartStr, weekChallengeData.challenge),
      supabase
        .from('challenge_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_start', weekStartStr)
        .maybeSingle(),
    ])
    weeklyProgress = progress
    weeklyIsCompleted = !!completionRes.data
  }

  return (
    <div className="flex min-h-screen bg-background">

      <Sidebar />

      <div className="md:ml-16 flex-1 min-w-0 flex flex-col min-h-screen">

        <AppHeader
          username={profile.username ?? 'jugador'}
          globalLevel={profile.global_level}
          profile={{
            username: profile.username,
            username_changed_at: profile.username_changed_at,
            active_pack: profile.active_pack,
            feed_public: profile.feed_public,
            avatar_config: profile.avatar_config,
          }}
        />

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <main className="flex-1 py-6 px-4 md:py-8 md:px-8 pb-28 md:pb-8">
          <div className="max-w-[1100px] mx-auto">

            {/* Page title — standardized: text-2xl font-semibold, Spanish */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-text-primary">Inicio</h1>
              <p className="text-sm text-text-muted mt-0.5">Bienvenido de vuelta, {profile.username ?? 'jugador'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 items-start">

              {/* ── LEFT: Daily mission queue ───────────────────────────── */}
              <div className="flex flex-col gap-5">

                {/* Section header with progress */}
                <div className="border-b border-border/40 pb-2 flex items-center justify-between">
                  <h2 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                    Misiones diarias
                  </h2>
                  {dailyMissions.length > 0 && (
                    <span className="text-xs text-text-muted tabular-nums">
                      <span className="text-text-primary font-semibold">
                        {dailyMissions.length - pendingDaily.length}
                      </span>
                      /{dailyMissions.length} completadas
                    </span>
                  )}
                </div>

                {/* All daily done → banner */}
                {allDailyDone && (
                  <div
                    className="flex items-center gap-3 rounded-card px-6 py-4 border"
                    style={{
                      background: 'color-mix(in srgb, var(--color-fisico) 8%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--color-fisico) 25%, transparent)',
                      animation: 'slide-down-in 300ms ease forwards',
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-fisico)' }} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-fisico)' }}>
                      Has completado todas las misiones de hoy.{' '}
                      <span className="font-normal opacity-80">Vuelve mañana.</span>
                    </p>
                  </div>
                )}

                {/* No daily missions seeded yet */}
                {dailyMissions.length === 0 && (
                  <EmptyState
                    icon={<Sword size={40} strokeWidth={1.5} aria-hidden />}
                    title="Sin misiones por hoy"
                    description="Completa tu primera misión para empezar a ganar XP"
                  />
                )}

                {/* All pending daily missions — completable in any order */}
                {dailyMissions.length > 0 && (
                  <MissionAreaWrapper
                    missions={pendingDaily}
                    showShieldNotification={showShieldNotification}
                    avatarConfig={profile.avatar_config}
                  />
                )}

                {/* Custom missions — only shown if the user has at least one active */}
                {customMissions.length > 0 && (
                  <CustomMissionsDashboardSection
                    customMissions={customMissions}
                    avatarConfig={profile.avatar_config}
                  />
                )}

                {weekChallengeData && (
                  <WeeklyChallengeCard
                    challenge={weekChallengeData.challenge}
                    weekStart={weekStartStr}
                    progress={weeklyProgress}
                    isCompleted={weeklyIsCompleted}
                    avatarConfig={profile.avatar_config}
                  />
                )}

                <Link href="/missions" className="text-xs text-text-muted hover:text-accent transition-colors">
                  Ver todas las misiones →
                </Link>

              </div>

              {/* ── RIGHT: Player + Stats ───────────────────────────────── */}
              <div className="flex flex-col gap-4">

                {/* Player card */}
                <div className="bg-surface rounded-card p-6 border border-border/60 flex flex-col gap-5">
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/u/${profile.username}`}
                      aria-label={`Ver perfil público de ${profile.username ?? 'jugador'}`}
                      className="flex-shrink-0 transition-opacity hover:opacity-75"
                    >
                      {profile.avatar_config ? (
                        <AvatarDisplay config={profile.avatar_config} size={64} />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center"
                          style={{
                            background: 'var(--color-surface)',
                            border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
                          }}
                        >
                          <span className="text-accent font-bold text-base leading-none select-none">
                            {(profile.username ?? 'JU').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-text-primary truncate">{profile.username ?? 'Jugador'}</p>
                      <p className="text-xs text-text-muted mt-0.5">Nivel {profile.global_level} · Jugador</p>
                    </div>
                    <ShieldIndicator
                      shieldCount={profile.shield_count}
                      streakProgress={profile.current_streak % 7}
                      size="sm"
                    />
                  </div>
                  <XpBar current={profile.current_xp} total={profile.xp_to_next_level} />
                </div>

                {/* Streak empty state — shown when user has no active streak */}
                {profile.current_streak === 0 && (
                  <div className="bg-surface rounded-card border border-border/60">
                    <EmptyState
                      icon={<Flame size={40} strokeWidth={1.5} aria-hidden />}
                      title="Empieza tu racha hoy"
                      description="Completa una misión cada día para mantenerla"
                    />
                  </div>
                )}

                {/* Stats card — p-6 standardized */}
                <div className="bg-surface rounded-card p-6 border border-border/60">
                  <div className="border-b border-border/40 pb-2 mb-4">
                    <h2 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                      Estadísticas
                    </h2>
                  </div>
                  <StatRow
                    label="Racha actual"
                    value={profile.current_streak}
                    sub={profile.current_streak === 1 ? 'día' : 'días'}
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M12 2C6 2 2 7 2 12c0 2.8 1.2 5.3 3.1 7 .5-2.6 1.9-5 4.9-6-1.2 2-1 4.5.5 6.3C11 20 11.5 20.7 12 21c.5-.3 1-.7 1.5-1.7 1.5-1.8 1.7-4.3.5-6.3 3 1 4.4 3.4 4.9 6C20.8 17.3 22 14.8 22 12c0-5-4-10-10-10z" />
                      </svg>
                    }
                  />
                  <StatRow
                    label="Misiones completadas"
                    value={completedCount}
                    sub="misiones"
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <circle cx="12" cy="8" r="6" />
                        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                      </svg>
                    }
                  />
                  <StatRow
                    label="Racha máxima"
                    value={profile.longest_streak}
                    sub="días"
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                    }
                  />
                  <StatRow
                    label="Días activos"
                    value={profile.total_days_active}
                    sub="en total"
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    }
                  />
                </div>

              </div>

            </div>
          </div>
        </main>

      </div>

      <BottomNav />
    </div>
  )
}
