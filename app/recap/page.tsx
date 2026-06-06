import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile, LifeClass } from '@/types/supabase'
import { CLASS_META } from '@/lib/constants/classes'
import { getDaySummary } from '@/lib/recap'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { EmptyState } from '@/components/ui/EmptyState'
import { Sword, Dumbbell } from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTodayDate(): string {
  return new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
}

const DIFF_LABEL: Record<string, string> = {
  easy: 'Fácil', medium: 'Medio', hard: 'Difícil', boss: 'Jefe',
}

const DIFF_CLASSES: Record<string, string> = {
  easy:   'text-fisico bg-fisico/8 border-fisico/20',
  medium: 'text-disciplina bg-disciplina/8 border-disciplina/20',
  hard:   'text-error bg-error/8 border-error/20',
  boss:   'text-accent bg-accent/8 border-accent/20',
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon }: {
  label: string
  value: string | number
  sub: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-surface rounded-card p-6 border border-border/60 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        <span className="text-text-muted">{icon}</span>
      </div>
      <div>
        <p className="text-3xl font-bold text-text-primary tabular-nums leading-none">{value}</p>
        <p className="text-xs text-text-muted mt-1.5">{sub}</p>
      </div>
    </div>
  )
}

function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border/40 pb-2 mb-4">
      <h2
        id={id}
        className="text-[11px] font-medium text-text-muted uppercase tracking-wider"
      >
        {children}
      </h2>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function RecapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const [profileRes, completedTodayRes, summary] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('completed_missions')
      .select('completed_at, missions(id, title, xp_reward, life_class, difficulty)')
      .eq('user_id', user.id)
      .gte('completed_at', todayStart.toISOString())
      .order('completed_at', { ascending: true }),
    getDaySummary(supabase, user.id),
  ])

  const profile = (profileRes.data as Profile | null) ?? {
    id: user.id,
    username: user.email?.split('@')[0] ?? 'jugador',
    global_level: 1, current_xp: 0, xp_to_next_level: 100,
    current_streak: 0, longest_streak: 0, total_days_active: 0,
    shield_count: 0, shield_used_at: null,
    created_at: new Date().toISOString(),
  }

  type CompletedRow = {
    completed_at: string
    missions: {
      id: string
      title: string
      xp_reward: number
      life_class: string
      difficulty: string
    } | null
  }
  const completedToday = (completedTodayRes.data ?? []) as unknown as CompletedRow[]

  const { xpEarnedToday: xpToday, classPoints: classPointsToday, missionsCompleted: missionsCompletedToday, missionsTotal: totalDailyCount } = summary
  const allDone = summary.missionsTotal > 0 && summary.missionsCompleted >= summary.missionsTotal

  let footerText: string
  if (profile.current_streak === 0) {
    footerText = 'Hoy es un buen día para empezar.'
  } else if (allDone) {
    footerText = 'Día perfecto. Sigue así mañana.'
  } else {
    footerText = 'Tienes misiones pendientes para hoy.'
  }

  const dateStr = formatTodayDate()
  const classesWithPoints = (['fisico', 'mental', 'disciplina'] as LifeClass[]).filter(
    lc => (classPointsToday[lc] ?? 0) > 0,
  )

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
            {profile.username}
          </Link>
        </header>

        {/* ── Content ─────────────────────────────────────────────────── */}
        <main className="flex-1 py-6 px-4 md:py-8 md:px-8 pb-28 md:pb-8">
          <div className="max-w-[720px] mx-auto flex flex-col gap-8">

            {/* ── Page header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-semibold text-text-primary">Hoy</h1>
                <p
                  className="text-[13px] mt-0.5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {dateStr}
                </p>
              </div>
              {allDone ? (
                <span
                  className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-pill border"
                  style={{
                    color: 'var(--color-fisico)',
                    background: 'color-mix(in srgb, var(--color-fisico) 12%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--color-fisico) 25%, transparent)',
                  }}
                >
                  Día completado
                </span>
              ) : (
                <span
                  className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-pill border"
                  style={{
                    color: 'var(--color-disciplina)',
                    background: 'color-mix(in srgb, var(--color-disciplina) 12%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--color-disciplina) 25%, transparent)',
                  }}
                >
                  En progreso
                </span>
              )}
            </div>

            {/* ── Stats 2×2 ───────────────────────────────────────────── */}
            <section aria-labelledby="section-resumen">
              <SectionTitle id="section-resumen">Resumen del día</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="XP ganados hoy"
                  value={`+${xpToday}`}
                  sub="puntos de experiencia"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                  }
                />
                <StatCard
                  label="Misiones completadas"
                  value={`${missionsCompletedToday}/${totalDailyCount}`}
                  sub={missionsCompletedToday === 1 ? 'misión de hoy' : 'misiones de hoy'}
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  }
                />
                <StatCard
                  label="Racha actual"
                  value={profile.current_streak}
                  sub={profile.current_streak === 1 ? 'día consecutivo' : 'días consecutivos'}
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
                    </svg>
                  }
                />
                <StatCard
                  label="Escudos disponibles"
                  value={profile.shield_count}
                  sub={profile.shield_count === 1 ? 'escudo de racha' : 'escudos de racha'}
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  }
                />
              </div>
            </section>

            {/* ── Class points today ──────────────────────────────────── */}
            <section aria-labelledby="section-clases">
              <SectionTitle id="section-clases">Puntos de clase ganados hoy</SectionTitle>

              {classesWithPoints.length === 0 ? (
                <div className="bg-surface rounded-card border border-border/60">
                  <EmptyState
                    icon={<Dumbbell size={40} strokeWidth={1.5} aria-hidden />}
                    title="Sin puntos de clase aún"
                    description="Completa misiones para ganar puntos de clase"
                  />
                </div>
              ) : (
                <div className="bg-surface rounded-card border border-border/60 overflow-hidden">
                  {classesWithPoints.map((lc, idx) => {
                    const meta = CLASS_META[lc]
                    const pts = classPointsToday[lc]
                    return (
                      <div
                        key={lc}
                        className={`flex items-center gap-4 px-6 py-4 ${idx < classesWithPoints.length - 1 ? 'border-b border-border/40' : ''}`}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: meta.color }}
                          aria-hidden
                        />
                        <span className="text-sm font-semibold text-text-primary flex-1">
                          {meta.label}
                        </span>
                        <span
                          className="text-sm font-bold tabular-nums"
                          style={{ color: meta.color }}
                        >
                          +{pts} {pts === 1 ? 'punto' : 'puntos'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* ── Missions list ────────────────────────────────────────── */}
            <section aria-labelledby="section-misiones">
              <SectionTitle id="section-misiones">Misiones de hoy</SectionTitle>

              {missionsCompletedToday === 0 ? (
                <div className="bg-surface rounded-card border border-border/60">
                  <EmptyState
                    icon={<Sword size={40} strokeWidth={1.5} aria-hidden />}
                    title="Aún no has completado misiones hoy"
                    action={{ label: 'Ir a misiones', href: '/missions' }}
                  />
                </div>
              ) : (
                <div className="bg-surface rounded-card border border-border/60 overflow-hidden">
                  {completedToday
                    .filter(r => r.missions !== null)
                    .map((row, idx, arr) => {
                      const m = row.missions!
                      const lc = m.life_class as LifeClass
                      const meta = CLASS_META[lc] ?? CLASS_META.fisico
                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 px-6 py-4 ${idx < arr.length - 1 ? 'border-b border-border/40' : ''}`}
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: meta.color }}
                            aria-hidden
                          />
                          <p className="flex-1 text-sm font-medium text-text-primary min-w-0 truncate">
                            {m.title}
                          </p>
                          <span
                            className={`inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-pill border flex-shrink-0 ${DIFF_CLASSES[m.difficulty] ?? ''}`}
                          >
                            {DIFF_LABEL[m.difficulty] ?? m.difficulty}
                          </span>
                          <span className="text-sm font-bold text-accent tabular-nums flex-shrink-0">
                            +{m.xp_reward} XP
                          </span>
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: 'var(--color-fisico)' }}
                            stroke="currentColor"
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )
                    })}
                </div>
              )}
            </section>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <p
              className="text-center text-[13px]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {footerText}
            </p>

          </div>
        </main>

      </div>

      <BottomNav />
    </div>
  )
}
