import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile, ClassProgress, LifeClass } from '@/types/supabase'
import { CLASS_META, getMilestoneProgress, getMilestoneTier } from '@/lib/constants/classes'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { ShareButton } from '@/components/profile/ShareButton'
import { ResetProfileButton } from '@/components/profile/ResetProfileButton'
import { ClassRadarChart } from '@/components/profile/ClassRadarChart'
import { AnimatedBar } from '@/components/ui/AnimatedBar'
import { ShieldIndicator } from '@/components/ui/ShieldIndicator'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'
import { Trophy, Calendar, CalendarCheck, ArrowRight } from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getInitials(username: string | null): string {
  return (username ?? 'JU').slice(0, 2).toUpperCase()
}

function formatJoinDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

function formatHours(completedCount: number): string {
  const h = completedCount * 0.5
  const formatted = h % 1 === 0 ? h.toString() : h.toFixed(1)
  return `${formatted} ${h === 1 ? 'hora' : 'horas'} jugadas en la vida real`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const missionDay    = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((todayMidnight.getTime() - missionDay.getTime()) / 86400000)

  if (diffDays === 0) return `Hoy · ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
  if (diffDays === 1) return 'Ayer'
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Section title (shared pattern with separator line) ──────────────────────
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

// ─── ClassBadge (standardized: px-2.5 py-1) ──────────────────────────────────
function ClassBadge({ lifeClass }: { lifeClass: LifeClass }) {
  const { label, badgeClasses } = CLASS_META[lifeClass]
  return (
    <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-pill ${badgeClasses}`}>
      {label}
    </span>
  )
}

// 1 ── Profile header
function ProfileHeader({ profile }: { profile: Profile }) {
  const initials = getInitials(profile.username)
  const streak   = profile.current_streak

  return (
    <section
      className="bg-surface rounded-card p-6 border border-border/60"
      aria-label="Perfil del jugador"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-accent font-bold text-xl select-none border-2 border-accent/35"
          style={{ background: 'linear-gradient(135deg, var(--color-accent-glow) 0%, transparent 100%)' }}
          aria-label={`Avatar de ${profile.username ?? 'jugador'}`}
        >
          {initials}
        </div>

        {/* Name + secondary line */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-text-primary tracking-tight truncate">
            {profile.username ?? 'Jugador'}
          </h2>
          <p className="text-[13px] text-text-secondary">
            LVL {profile.global_level} · {streak} {streak === 1 ? 'día' : 'días'} racha
          </p>
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
      <SectionTitle id="section-clases">Clases de vida</SectionTitle>

      <div className="bg-surface rounded-card border border-border/60 overflow-hidden">
        <div className="px-4 md:px-6 pt-5 pb-2">
          <ClassRadarChart
            fisico={getClass('fisico').points}
            mental={getClass('mental').points}
            disciplina={getClass('disciplina').points}
          />
        </div>

        {classes.map((lc, idx) => {
          const cp        = getClass(lc)
          const meta      = CLASS_META[lc]
          const { title, pct, nextAt } = getMilestoneProgress(cp.points)

          return (
            <div
              key={lc}
              className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-5 px-4 md:px-6 py-4 md:py-5 ${idx < 2 ? 'border-b border-border/40' : ''}`}
            >
              {/* Top row on mobile: dot + label + badge + pts */}
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

              {/* Progress bar — full width on mobile, flex-1 on desktop */}
              <div className="w-full md:flex-1 min-w-0">
                <AnimatedBar
                  value={pct / 100}
                  color={meta.color}
                  height="h-2"
                  delay={idx * 0.1}
                  role="progressbar"
                  aria-valuenow={cp.points}
                  aria-valuemin={0}
                  aria-valuemax={nextAt ?? cp.points}
                  aria-label={`Puntos de ${meta.label}`}
                />
              </div>

              {/* Points — desktop only (shown inline on mobile above) */}
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
  const hours = completedCount * 0.5
  const hoursValue = hours % 1 === 0 ? hours.toString() : hours.toFixed(1)

  const stats = [
    {
      label: 'XP total ganado', value: totalXp.toLocaleString(), sub: 'puntos de experiencia',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ),
    },
    {
      label: 'Racha máxima', value: profile.longest_streak.toString(),
      sub: profile.longest_streak === 1 ? 'día consecutivo' : 'días consecutivos',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      label: 'Misiones completadas', value: completedCount.toLocaleString(),
      sub: completedCount === 1 ? 'misión completada' : 'misiones completadas',
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
      sub: Number(hoursValue) === 1 ? 'hora jugada' : 'horas jugadas',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: 'Miembro desde', value: formatJoinDate(profile.created_at), sub: 'fecha de registro',
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
      <SectionTitle id="section-stats">Estadísticas</SectionTitle>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, sub, icon }) => (
          <div key={label} className="bg-surface rounded-card p-6 border border-border/60 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">{label}</span>
              <span className="text-text-muted">{icon}</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-text-primary tabular-nums leading-none">{value}</p>
              <p className="text-xs text-text-muted mt-1.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/recap"
        className="flex items-center justify-between p-4 bg-surface border border-border/60 rounded-component hover:border-border transition-colors mt-3"
      >
        <div className="flex items-center gap-3">
          <CalendarCheck size={18} className="text-text-muted flex-shrink-0" aria-hidden />
          <span className="text-sm font-medium text-text-primary">Ver recap de hoy</span>
        </div>
        <ArrowRight size={16} className="text-text-muted flex-shrink-0" aria-hidden />
      </Link>
    </section>
  )
}

// 4 ── Recent achievements
type RecentItem = {
  completed_at: string
  missions: { title: string; xp_reward: number; life_class: string } | null
}

function RecentAchievements({ recent }: { recent: RecentItem[] }) {
  return (
    <section aria-labelledby="section-recientes">
      <SectionTitle id="section-recientes">Logros recientes</SectionTitle>

      {recent.length === 0 ? (
        <div className="bg-surface rounded-card border border-border/60">
          <EmptyState
            icon={<Trophy size={40} strokeWidth={1.5} aria-hidden />}
            title="Aún sin logros"
            description="Completa misiones para ver tu progreso aquí"
            action={{ label: 'Ver misiones', href: '/missions' }}
          />
        </div>
      ) : (
        <div className="bg-surface rounded-card border border-border/60 overflow-hidden">
          {recent.map((item, idx) => {
            const mission = item.missions
            if (!mission) return null
            const lc   = mission.life_class as LifeClass
            const meta = CLASS_META[lc] ?? CLASS_META.fisico

            return (
              <div
                key={idx}
                className={`flex items-center gap-4 px-6 py-4 ${idx < recent.length - 1 ? 'border-b border-border/40' : ''}`}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} aria-hidden />
                <p className="flex-1 text-sm font-medium text-text-primary truncate min-w-0">
                  {mission.title}
                </p>
                <ClassBadge lifeClass={lc} />
                <span className="text-sm font-bold text-accent tabular-nums flex-shrink-0 text-right">
                  +{mission.xp_reward} XP
                </span>
                <span className="hidden md:block text-xs text-text-muted flex-shrink-0 w-28 text-right">
                  {formatDate(item.completed_at)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// 5 ── Class balance
function ClassBalance({ classProgress }: { classProgress: ClassProgress[] }) {
  const classes: LifeClass[] = ['fisico', 'mental', 'disciplina']

  const getClass = (lc: LifeClass): ClassProgress =>
    classProgress.find(cp => cp.life_class === lc) ?? { id: '', user_id: '', life_class: lc, points: 0 }

  const allPoints  = classes.map(lc => getClass(lc).points)
  const maxTier    = Math.max(...allPoints.map(getMilestoneTier))
  const isLagging  = (pts: number) => maxTier >= 2 && getMilestoneTier(pts) <= maxTier - 2
  const maxPoints  = Math.max(...allPoints)

  return (
    <section aria-labelledby="section-equilibrio">
      <SectionTitle id="section-equilibrio">Equilibrio de clases</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {classes.map((lc, idx) => {
          const cp      = getClass(lc)
          const meta    = CLASS_META[lc]
          const lagging = isLagging(cp.points)
          const isTop   = cp.points === maxPoints && maxPoints >= 100
          const { title, pct } = getMilestoneProgress(cp.points)

          return (
            <div
              key={lc}
              className={`
                rounded-card p-6 border flex flex-col gap-4 transition-all duration-200
                ${lagging ? 'bg-error/5 border-error/25' : 'bg-surface border-border/60'}
              `}
              aria-label={`Clase ${meta.label}, ${cp.points} puntos${lagging ? ', necesita equilibrio' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden />
                  <span className="text-sm font-semibold text-text-primary">{meta.label}</span>
                </div>
                {isTop && !lagging && (
                  <span className="text-[10px] font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-pill">
                    LÍDER
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
                <p className="text-2xl font-bold text-text-primary tabular-nums leading-none">
                  {cp.points.toLocaleString()}
                </p>
                <p className="text-xs text-text-muted mt-1">{title}</p>
              </div>

              <AnimatedBar
                value={pct / 100}
                color={lagging ? 'var(--color-error)' : meta.color}
                height="h-1.5"
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

  const [profileRes, classProgressRes, completedCountRes, recentRes, xpTotalRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('class_progress').select('*').eq('user_id', user.id),
    supabase.from('completed_missions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('completed_missions')
      .select('completed_at, missions(title, xp_reward, life_class)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(5),
    supabase.from('completed_missions').select('missions(xp_reward)').eq('user_id', user.id),
  ])

  const profile: Profile = (profileRes.data as Profile | null) ?? {
    id: user.id,
    username: null,
    onboarding_completed: false,
    global_level: 1, current_xp: 0, xp_to_next_level: 100,
    current_streak: 0, longest_streak: 0, total_days_active: 0,
    shield_count: 0, shield_used_at: null, shield_notification_shown: true,
    created_at: new Date().toISOString(),
  }

  const classProgress = (classProgressRes.data as ClassProgress[] | null) ?? []
  const completedCount = completedCountRes.count ?? 0

  type RecentRow = { completed_at: string; missions: { title: string; xp_reward: number; life_class: string } | null }
  const recent = (recentRes.data ?? []) as unknown as RecentRow[]

  type XpRow = { missions: { xp_reward: number } | null }
  const totalXp = ((xpTotalRes.data ?? []) as unknown as XpRow[]).reduce((sum, row) => {
    return sum + (row.missions?.xp_reward ?? 0)
  }, 0)

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
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted">{profile.username ?? 'jugador'}</span>
            <span className="text-xs font-bold text-accent bg-accent/12 border border-accent/20 px-3 py-1 rounded-pill tabular-nums">
              LVL {profile.global_level}
            </span>
          </div>
        </header>

        {/* ── Content ─────────────────────────────────────────────────── */}
        <main className="flex-1 py-6 px-4 md:py-8 md:px-8 pb-28 md:pb-8">
          <div className="max-w-[1100px] mx-auto flex flex-col gap-8">

            {/* Page title — h1, standardized: text-2xl font-semibold */}
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">Perfil</h1>
              <p className="text-sm text-text-muted mt-0.5">Tu progreso y estadísticas</p>
            </div>

            <ProfileHeader profile={profile} />

            <ShareButton className="w-full" />

            <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 items-start">
              <ClassProgressCard classProgress={classProgress} />
              <div className="flex flex-col gap-6">
                <div className="p-4 bg-surface rounded-card border border-border/60">
                  <ShieldIndicator
                    shieldCount={profile.shield_count}
                    streakProgress={profile.current_streak % 7}
                    size="lg"
                  />
                </div>
                <StatsGrid profile={profile} completedCount={completedCount} totalXp={totalXp} />
              </div>
            </div>

            <RecentAchievements recent={recent} />

            {profile.current_streak === 0 && (
              <section aria-labelledby="section-racha-historica">
                <SectionTitle id="section-racha-historica">Historial de racha</SectionTitle>
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
              <div className="flex justify-end pt-4">
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
