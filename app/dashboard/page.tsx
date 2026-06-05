import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Mission, Profile } from '@/types/supabase'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { MissionAreaWrapper } from '@/components/dashboard/MissionAreaWrapper'

// ─── Sub-components ──────────────────────────────────────────────────────────
function XpBar({ current, total }: { current: number; total: number }) {
  const pct = Math.min(total > 0 ? (current / total) * 100 : 0, 100)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs text-text-muted">
        <span className="font-medium uppercase tracking-wider">XP</span>
        <span className="tabular-nums">{current.toLocaleString()} / {total.toLocaleString()}</span>
      </div>
      <div className="w-full bg-background rounded-pill h-2 overflow-hidden">
        <div
          className="h-full rounded-pill transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-light) 100%)',
          }}
        />
      </div>
      <p className="text-xs text-text-muted">{Math.round(pct)}% completado</p>
    </div>
  )
}

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

  const [profileRes, dailyMissionsRes, completedRes, completedTodayRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('missions').select('*').eq('type', 'daily').order('sort_order', { ascending: true, nullsFirst: false }),
    supabase.from('completed_missions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('completed_missions').select('mission_id').eq('user_id', user.id).gte('completed_at', todayUTC.toISOString()),
  ])

  const profile: Profile = (profileRes.data as Profile | null) ?? {
    id: user.id,
    username: user.email?.split('@')[0] ?? 'jugador',
    global_level: 1,
    current_xp: 0,
    xp_to_next_level: 100,
    current_streak: 0,
    longest_streak: 0,
    total_days_active: 0,
    created_at: new Date().toISOString(),
  }

  const completedCount = completedRes.count ?? 0
  const completedTodayIds = new Set((completedTodayRes.data ?? []).map(c => c.mission_id as string))

  const dailyMissions = (dailyMissionsRes.data as Mission[] | null) ?? []
  const pendingDaily  = dailyMissions.filter(m => !completedTodayIds.has(m.id))
  const allDailyDone  = dailyMissions.length > 0 && pendingDaily.length === 0

  return (
    <div className="flex min-h-screen bg-background">

      <Sidebar />

      <div className="md:ml-16 flex-1 flex flex-col min-h-screen">

        {/* ── Header ─────────────────────────────────────────────────────── */}
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
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted">{profile.username}</span>
            <span className="text-xs font-bold text-accent bg-accent/12 border border-accent/20 px-3 py-1 rounded-pill tabular-nums">
              LVL {profile.global_level}
            </span>
          </div>
        </header>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <main className="flex-1 py-6 px-4 md:py-8 md:px-8 pb-28 md:pb-8">
          <div className="max-w-[1100px] mx-auto">

            {/* Page title — standardized: text-2xl font-semibold, Spanish */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-text-primary">Inicio</h1>
              <p className="text-sm text-text-muted mt-0.5">Bienvenido de vuelta, {profile.username}</p>
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

                {/* All pending daily missions — completable in any order */}
                <MissionAreaWrapper missions={pendingDaily} />

                <Link href="/missions" className="text-xs text-text-muted hover:text-accent transition-colors">
                  Ver todas las misiones →
                </Link>

              </div>

              {/* ── RIGHT: Player + Stats ───────────────────────────────── */}
              <div className="flex flex-col gap-4">

                {/* Player card */}
                <div className="bg-surface rounded-card p-6 border border-border/60 flex flex-col gap-5">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex-shrink-0 p-[2px] rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-light) 50%, var(--color-accent) 100%)',
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
                        <span className="text-accent font-bold text-sm leading-none select-none">
                          {profile.username.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary truncate">{profile.username}</p>
                      <p className="text-xs text-text-muted mt-0.5">Nivel {profile.global_level} · Jugador</p>
                    </div>
                  </div>
                  <XpBar current={profile.current_xp} total={profile.xp_to_next_level} />
                </div>

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
                    label="Logros completados"
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
