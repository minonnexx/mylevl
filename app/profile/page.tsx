import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile, ClassProgress, LifeClass, Medal } from '@/types/supabase'
import { CLASS_META, getMilestoneProgress, getMilestoneTier } from '@/lib/constants/classes'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { ShareButton } from '@/components/profile/ShareButton'
import { ResetProfileButton } from '@/components/profile/ResetProfileButton'
import { MedalsGrid } from '@/components/profile/MedalsGrid'
import { RecentAchievementsAnimated } from '@/components/profile/RecentAchievementsAnimated'
import { AppHeader } from '@/components/ui/AppHeader'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ClassRadarChart } from '@/components/profile/ClassRadarChart'
import { ActivityHeatmap } from '@/components/profile/ActivityHeatmap'
import { AnimatedBar } from '@/components/ui/AnimatedBar'
import { ShieldIndicator } from '@/components/ui/ShieldIndicator'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'
import { Trophy, Calendar, BarChart2, ChevronRight } from 'lucide-react'
import AvatarDisplay from '@/components/avatar/AvatarDisplay'

const CLASS_GLOW: Record<LifeClass, string> = {
  fisico:     'rgba(29,158,117,0.28)',
  mental:     'rgba(127,119,221,0.28)',
  disciplina: 'rgba(186,117,23,0.28)',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatJoinDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

function formatHoursFromBirth(dateOfBirth: string | null): string {
  if (!dateOfBirth) return '—'
  const hours = Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60))
  return hours.toLocaleString('es-ES')
}

function dominantClass(classProgress: ClassProgress[]): LifeClass | null {
  if (classProgress.length === 0) return null
  const best = classProgress.reduce((a, b) => b.points > a.points ? b : a)
  return best.points > 0 ? best.life_class as LifeClass : null
}

// 1 ── Profile header
function ProfileHeader({ profile, classProgress }: { profile: Profile; classProgress: ClassProgress[] }) {
  const initials = (profile.username ?? 'JU').slice(0, 2).toUpperCase()
  const dominant = dominantClass(classProgress)
  const showRing = profile.avatar_config?.style === 'adventurer'
  const ringColor = dominant ? CLASS_META[dominant].color : 'var(--color-accent)'
  const glowRgba = dominant ? CLASS_GLOW[dominant] : 'rgba(127,119,221,0.25)'

  return (
    <section
      className="bg-surface rounded-card p-6 border border-border/60"
      aria-label="Perfil del jugador"
    >
      <div className="flex items-start gap-3 sm:gap-4">

        {/* Avatar with dominant-class ring */}
        <Link
          href={`/u/${profile.username}`}
          aria-label={`Ver perfil público de ${profile.username ?? 'Jugador'}`}
          className="flex-shrink-0 transition-opacity hover:opacity-80"
        >
          <div className="relative">
            {profile.avatar_config ? (
              <AvatarDisplay config={profile.avatar_config} size={80} />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
                }}
              >
                <span className="text-accent font-bold text-xl leading-none select-none">
                  {initials}
                </span>
              </div>
            )}
            {/* Dominant-class ring — adventurer style only */}
            {showRing && (
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${ringColor} 45%, transparent), 0 0 16px ${glowRgba}`,
                }}
                aria-hidden
              />
            )}
          </div>
        </Link>

        {/* Name + level */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className="font-semibold text-text-primary leading-snug">
            {profile.username ?? 'Jugador'}
          </p>
          <p className="text-xs text-text-muted">
            Nivel {profile.global_level} · Aventurero
          </p>
        </div>

        {/* Shield — vertical (ring only) on mobile, horizontal on sm+ */}
        <div className="sm:hidden flex-shrink-0">
          <ShieldIndicator
            shieldCount={profile.shield_count}
            streakProgress={profile.current_streak % 7}
            size="sm"
            vertical
          />
        </div>
        <div className="hidden sm:block flex-shrink-0">
          <ShieldIndicator
            shieldCount={profile.shield_count}
            streakProgress={profile.current_streak % 7}
            size="sm"
          />
        </div>
      </div>
    </section>
  )
}

// 2 ── Classes of life
function ClassProgressCard({ classProgress }: { classProgress: ClassProgress[] }) {
  const getClass = (lc: LifeClass): ClassProgress =>
    classProgress.find(cp => cp.life_class === lc) ?? { id: '', user_id: '', life_class: lc, points: 0 }

  const classes: LifeClass[] = ['fisico', 'mental', 'disciplina']

  return (
    <section aria-labelledby="section-clases">
      <SectionHeader id="section-clases" title="Clases de vida" className="mb-4" />

      <div className="bg-surface rounded-card border border-border/60 overflow-hidden">
        <div className="px-4 md:px-6 pt-5 pb-2">
          <ClassRadarChart
            fisico={getClass('fisico').points}
            mental={getClass('mental').points}
            disciplina={getClass('disciplina').points}
          />
        </div>

        {classes.map((lc, idx) => {
          const cp   = getClass(lc)
          const meta = CLASS_META[lc]
          const { title, pct, nextAt } = getMilestoneProgress(cp.points)

          return (
            <div
              key={lc}
              className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-5 px-4 md:px-6 py-4 md:py-5 ${idx < 2 ? 'border-b border-border/40' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-3 md:w-32 flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} aria-hidden />
                  <span className="text-sm font-semibold text-text-primary">{meta.label}</span>
                </div>
                <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-pill ${meta.badgeClasses} flex-shrink-0`}>
                  {title}
                </span>
                <span className="ml-auto text-xs text-text-muted tabular-nums md:hidden">
                  {cp.points.toLocaleString()} pts
                  {nextAt && <span className="opacity-60"> / {nextAt.toLocaleString()}</span>}
                </span>
              </div>

              <div className="w-full md:flex-1 min-w-0">
                <AnimatedBar
                  value={pct / 100}
                  color={meta.color}
                  glowColor={CLASS_GLOW[lc]}
                  height="h-2.5"
                  delay={idx * 0.1}
                  role="progressbar"
                  aria-valuenow={cp.points}
                  aria-valuemin={0}
                  aria-valuemax={nextAt ?? cp.points}
                  aria-label={`Puntos de ${meta.label}`}
                />
              </div>

              <span className="hidden md:inline text-xs text-text-muted tabular-nums flex-shrink-0 w-28 text-right">
                {cp.points.toLocaleString()} pts
                {nextAt && <span className="opacity-60"> / {nextAt.toLocaleString()}</span>}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// 3 ── Stats grid
function StatsGrid({ profile, completedCount, totalXp }: {
  profile: Profile; completedCount: number; totalXp: number
}) {
  const hoursValue = formatHoursFromBirth(profile.date_of_birth)

  const stats = [
    {
      label: 'XP total ganado', value: totalXp.toLocaleString(), sub: 'puntos de experiencia',
      color: 'var(--color-accent)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ),
    },
    {
      label: 'Racha máxima', value: profile.longest_streak.toString(),
      sub: profile.longest_streak === 1 ? 'día consecutivo' : 'días consecutivos',
      color: 'var(--color-disciplina)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      label: 'Misiones completadas', value: completedCount.toLocaleString(),
      sub: completedCount === 1 ? 'misión completada' : 'misiones completadas',
      color: 'var(--color-fisico)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      ),
    },
    {
      label: 'Días activos', value: profile.total_days_active.toLocaleString(),
      sub: profile.total_days_active === 1 ? 'día en total' : 'días en total',
      color: 'var(--color-mental)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      label: 'Horas en la vida real', value: hoursValue,
      sub: hoursValue === '—' ? 'fecha de nacimiento no registrada' : 'horas jugadas',
      color: 'var(--color-disciplina)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: 'Miembro desde', value: formatJoinDate(profile.created_at), sub: 'fecha de registro',
      color: 'var(--color-accent)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ]

  return (
    <section aria-labelledby="section-stats">
      <SectionHeader id="section-stats" title="Estadísticas" className="mb-4" />

      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, sub, icon, color }) => (
          <div
            key={label}
            className="bg-surface rounded-card p-6 border border-border/60 flex flex-col gap-3 transition-all duration-200 hover:shadow-[0_0_18px_rgba(127,119,221,0.10)] hover:border-border/90"
            style={{
              borderTopWidth: 2,
              borderTopColor: `color-mix(in srgb, ${color} 35%, transparent)`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">{label}</span>
              <span style={{ color }}>{icon}</span>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-text-primary tabular-nums leading-none">{value}</p>
              <p className="text-xs text-text-muted mt-1.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// 4 ── Recent achievements (wraps client component)
type RecentItem = {
  completed_at: string
  missions: { title: string; xp_reward: number; life_class: string } | null
}

function RecentAchievements({ recent }: { recent: RecentItem[] }) {
  return (
    <section aria-labelledby="section-recientes">
      <SectionHeader id="section-recientes" title="Logros recientes" accentColor="var(--color-fisico)" className="mb-4" />
      <RecentAchievementsAnimated recent={recent} />
    </section>
  )
}

// 5 ── Medals earned
function MedalsSection({ medals }: { medals: Medal[] }) {
  return (
    <section aria-labelledby="section-medallas">
      <SectionHeader id="section-medallas" title="Medallas" accentColor="var(--color-disciplina)" className="mb-4" />

      {medals.length === 0 ? (
        <div className="bg-surface rounded-card border border-border/60">
          <EmptyState
            icon={<Trophy size={40} strokeWidth={1.5} aria-hidden />}
            title="Sin medallas aún"
            description="Completa logros para ganar medallas"
            action={{ label: 'Ver logros', href: '/achievements' }}
          />
        </div>
      ) : (
        <div className="bg-surface rounded-card border border-border/60 p-6">
          <MedalsGrid medals={medals} />
        </div>
      )}
    </section>
  )
}

// 6 ── Class balance
function ClassBalance({ classProgress }: { classProgress: ClassProgress[] }) {
  const classes: LifeClass[] = ['fisico', 'mental', 'disciplina']

  const getClass = (lc: LifeClass): ClassProgress =>
    classProgress.find(cp => cp.life_class === lc) ?? { id: '', user_id: '', life_class: lc, points: 0 }

  const allPoints = classes.map(lc => getClass(lc).points)
  const maxTier   = Math.max(...allPoints.map(getMilestoneTier))
  const isLagging = (pts: number) => maxTier >= 2 && getMilestoneTier(pts) <= maxTier - 2
  const maxPoints = Math.max(...allPoints)

  return (
    <section aria-labelledby="section-equilibrio">
      <SectionHeader id="section-equilibrio" title="Equilibrio de clases" className="mb-4" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {classes.map((lc, idx) => {
          const cp      = getClass(lc)
          const meta    = CLASS_META[lc]
          const lagging = isLagging(cp.points)
          const isTop   = cp.points === maxPoints && maxPoints >= 100
          const { title, pct } = getMilestoneProgress(cp.points)

          const borderLeftColor = lagging ? 'var(--color-error)' : meta.color
          const borderColor = lagging
            ? 'color-mix(in srgb, var(--color-error) 25%, transparent)'
            : 'color-mix(in srgb, var(--color-border) 60%, transparent)'

          return (
            <div
              key={lc}
              className="rounded-card rounded-l-none border border-l-0 p-6 flex flex-col gap-4 transition-all duration-200"
              style={{
                background: lagging
                  ? 'color-mix(in srgb, var(--color-error) 4%, var(--color-surface))'
                  : 'var(--color-surface)',
                borderColor,
                borderLeftWidth: 3,
                borderLeftStyle: 'solid',
                borderLeftColor,
              }}
              aria-label={`Clase ${meta.label}, ${cp.points} puntos${lagging ? ', necesita equilibrio' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden />
                  <span className="text-sm font-semibold text-text-primary">{meta.label}</span>
                </div>
                {isTop && !lagging && (
                  <span className="text-[10px] font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-pill">
                    Líder
                  </span>
                )}
                {lagging && (
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-error flex-shrink-0" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
              </div>

              <div>
                <p className="text-2xl font-black text-text-primary tabular-nums leading-none">
                  {cp.points.toLocaleString()}
                </p>
                <p className="text-xs text-text-muted mt-1">{title}</p>
              </div>

              <AnimatedBar
                value={pct / 100}
                color={lagging ? 'var(--color-error)' : meta.color}
                glowColor={lagging ? 'rgba(239,68,68,0.25)' : CLASS_GLOW[lc]}
                height="h-2"
                delay={idx * 0.1}
              />

              {lagging && (
                <p className="text-xs text-error font-medium leading-snug">
                  Necesitas equilibrar esta clase
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [profileRes, classProgressRes, completedCountRes, recentRes, xpTotalRes, completedMissionIdsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('class_progress').select('*').eq('user_id', user.id),
    supabase.from('completed_missions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('completed_missions')
      .select('completed_at, missions(title, xp_reward, life_class)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(5),
    supabase.from('completed_missions').select('missions(xp_reward)').eq('user_id', user.id),
    supabase.from('completed_missions').select('mission_id').eq('user_id', user.id),
  ])

  const profile: Profile = (profileRes.data as Profile | null) ?? {
    id: user.id,
    username: null,
    onboarding_completed: false,
    global_level: 1, current_xp: 0, xp_to_next_level: 100,
    current_streak: 0, longest_streak: 0, total_days_active: 0,
    shield_count: 0, shield_used_at: null, shield_notification_shown: true, avatar_confirmation_shown: false, feed_public: true,
    date_of_birth: null, username_changed_at: null, active_pack: null, avatar_config: null, created_at: new Date().toISOString(),
  }

  const classProgress = (classProgressRes.data as ClassProgress[] | null) ?? []
  const completedCount = completedCountRes.count ?? 0

  type RecentRow = { completed_at: string; missions: { title: string; xp_reward: number; life_class: string } | null }
  const recent = (recentRes.data ?? []) as unknown as RecentRow[]

  type XpRow = { missions: { xp_reward: number } | null }
  const totalXp = ((xpTotalRes.data ?? []) as unknown as XpRow[]).reduce((sum, row) => {
    return sum + (row.missions?.xp_reward ?? 0)
  }, 0)

  const createdAtStr = profile.created_at.slice(0, 10)
  const uniqueMissionIds = [...new Set((completedMissionIdsRes.data ?? []).map(r => r.mission_id as string))]

  const [heatmapRes, medalsRes] = await Promise.all([
    supabase
      .from('streaks')
      .select('date, missions_completed')
      .eq('user_id', user.id)
      .gte('date', createdAtStr)
      .order('date', { ascending: true }),
    uniqueMissionIds.length > 0
      ? supabase.from('medals').select('*').in('mission_id', uniqueMissionIds)
      : Promise.resolve({ data: [] as Medal[], error: null }),
  ])

  type HeatmapRow = { date: string; missions_completed: number }
  const heatmapData = (heatmapRes.data ?? []) as HeatmapRow[]
  const earnedMedals = (medalsRes.data ?? []) as Medal[]

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

        <main className="flex-1 py-6 px-4 md:py-8 md:px-8 pb-28 md:pb-8">
          <div className="max-w-[1100px] mx-auto flex flex-col gap-8">

            <div>
              <h1 className="text-2xl font-semibold text-text-primary">Perfil</h1>
              <p className="text-sm text-text-muted mt-0.5">Tu progreso y estadísticas</p>
            </div>

            <ProfileHeader profile={profile} classProgress={classProgress} />

            <ShareButton className="w-full" />

            <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 items-start">
              <ClassProgressCard classProgress={classProgress} />
              <div className="flex flex-col gap-6">
                <Link
                  href="/recap"
                  className="flex items-center gap-4 p-6 border border-border/60 rounded-card hover:border-border transition-colors"
                  style={{ background: 'var(--color-surface)' }}
                >
                  <BarChart2 size={32} style={{ color: 'var(--color-accent)', flexShrink: 0 }} aria-hidden />
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="text-base font-semibold text-text-primary">Tu recap</span>
                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      Revisa tu progreso diario, semanal y mensual
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-text-muted flex-shrink-0" aria-hidden />
                </Link>
                <StatsGrid profile={profile} completedCount={completedCount} totalXp={totalXp} />
              </div>
            </div>

            <ActivityHeatmap data={heatmapData} createdAt={profile.created_at} />

            <RecentAchievements recent={recent} />

            <MedalsSection medals={earnedMedals} />

            {heatmapData.length === 0 && (
              <section aria-labelledby="section-racha-historica">
                <SectionHeader id="section-racha-historica" title="Historial de racha" accentColor="var(--color-disciplina)" className="mb-4" />
                <div className="bg-surface rounded-card border border-border/60">
                  <EmptyState
                    icon={<Calendar size={40} strokeWidth={1.5} aria-hidden />}
                    title="Sin actividad registrada"
                    description="Tu historial de días activos aparecerá aquí"
                  />
                </div>
              </section>
            )}

            <ClassBalance classProgress={classProgress} />

            {process.env.NODE_ENV === 'development' && (
              <div className="flex justify-end pt-2">
                <ResetProfileButton />
              </div>
            )}

          </div>
        </main>

      </div>

      <BottomNav />
    </div>
  )
}
