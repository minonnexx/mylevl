'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { Brain, Dumbbell, Flame, Home, ShieldCheck, Swords, Sword, Target, Trophy } from 'lucide-react'
import { CLASS_META } from '@/lib/constants/classes'
import { AvatarSpeechBubble } from '@/components/ui/AvatarSpeechBubble'
import type { DaySummary, MissionSummaryItem } from '@/lib/recap'
import type { AvatarConfig, LifeClass, Profile } from '@/types/supabase'

// ─── Shared data types ────────────────────────────────────────────────────────

export type DayActivity = { date: string; count: number }

export type WeekData = {
  activeDays: number
  xpEarned: number
  missionsCompleted: number
  topClass: { lc: LifeClass; points: number } | null
  currentStreak: number
  heatmap: DayActivity[]
}

export type MonthData = {
  activeDays: number
  xpEarned: number
  missionsCompleted: number
  classPoints: { fisico: number; mental: number; disciplina: number }
  bestStreak: number
  heatmap: DayActivity[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Period = 'today' | 'week' | 'month'

const DIFF_LABEL: Record<string, string> = {
  easy: 'Fácil', medium: 'Medio', hard: 'Difícil', boss: 'Jefe',
}

function getClassIcon(lc: LifeClass, size: number, style?: React.CSSProperties) {
  if (lc === 'fisico') return <Dumbbell size={size} style={style} aria-hidden />
  if (lc === 'mental') return <Brain size={size} style={style} aria-hidden />
  return <Target size={size} style={style} aria-hidden />
}

function getHeatLevel(count: number): 0 | 1 | 2 | 3 {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  return 3
}

function heatCellStyle(level: 0 | 1 | 2 | 3): React.CSSProperties {
  const base: React.CSSProperties = { borderRadius: '3px' }
  if (level === 0) return {
    ...base,
    backgroundColor: 'color-mix(in srgb, var(--color-text-muted) 12%, var(--color-background))',
    border: '1px solid color-mix(in srgb, var(--color-text-muted) 25%, transparent)',
  }
  const pct = level === 1 ? 30 : level === 2 ? 60 : 100
  return {
    ...base,
    backgroundColor: `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`,
    border: '1px solid transparent',
  }
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-border/40 pb-2 mb-4">
      <h2 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
        {children}
      </h2>
    </div>
  )
}

function StatCard({ label, value, sub, icon, valueColor, borderColor }: {
  label: string
  value: string | number
  sub: string
  icon: React.ReactNode
  valueColor?: string
  borderColor?: string
}) {
  return (
    <div
      className="bg-surface rounded-card p-6 border border-border/60 flex flex-col gap-3"
      style={borderColor ? { borderLeft: `3px solid ${borderColor}` } : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        <span style={{ color: borderColor ?? 'var(--color-text-muted)' }}>{icon}</span>
      </div>
      <div>
        <p
          className="text-3xl font-black tabular-nums leading-none"
          style={{ color: valueColor ?? 'var(--color-text-primary)' }}
        >
          {value}
        </p>
        <p className="text-xs text-text-muted mt-1.5">{sub}</p>
      </div>
    </div>
  )
}

function MissionRow({ item }: { item: MissionSummaryItem }) {
  const lc = item.life_class as LifeClass
  const meta = CLASS_META[lc] ?? CLASS_META.fisico
  return (
    <div className="flex items-center gap-3 px-6 py-4">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: meta.color }}
        aria-hidden
      />
      <p className="flex-1 text-sm font-medium text-text-primary min-w-0 truncate">
        {item.title}
      </p>
      <span className="text-xs font-medium text-text-muted flex-shrink-0">
        {DIFF_LABEL[item.difficulty] ?? item.difficulty}
      </span>
      <span className="text-sm font-black tabular-nums flex-shrink-0" style={{ color: 'var(--color-accent)' }}>
        +{item.xp_reward} XP
      </span>
    </div>
  )
}

function MissionCard({
  icon,
  title,
  missions,
}: {
  icon?: React.ReactNode
  title: string
  missions: MissionSummaryItem[]
}) {
  return (
    <div className="bg-surface rounded-card border border-border/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 pt-4 pb-2">
        {icon}
        <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{title}</p>
      </div>
      {missions.map((item, idx) => (
        <div key={item.mission_id} className={idx < missions.length - 1 ? 'border-b border-border/40' : ''}>
          <MissionRow item={item} />
        </div>
      ))}
    </div>
  )
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────

function MiniHeatmap({ data, cols }: { data: DayActivity[]; cols: number }) {
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {data.map(day => (
        <div
          key={day.date}
          style={{ aspectRatio: '1', ...heatCellStyle(getHeatLevel(day.count)) }}
          title={`${day.date}: ${day.count} misiones`}
        />
      ))}
    </div>
  )
}

// ─── RPG call to action ───────────────────────────────────────────────────────

function RPGCallToAction({ message }: { message: string }) {
  return (
    <div
      className="rounded-card border border-border/60 p-6 flex flex-col gap-4"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-accent) 5%, var(--color-surface))',
        borderLeft: '3px solid var(--color-accent)',
      }}
    >
      <div className="flex items-start gap-3">
        <Swords size={18} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 1 }} aria-hidden />
        <p className="text-sm font-medium text-text-primary">{message}</p>
      </div>
      <Link
        href="/dashboard"
        className="w-full flex items-center justify-center gap-2 rounded-component py-2.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 active:scale-[0.98]"
        style={{
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-background)',
        }}
      >
        <Home size={14} aria-hidden />
        Volver al dashboard
      </Link>
    </div>
  )
}

// ─── Daily view ───────────────────────────────────────────────────────────────

function DailyView({ daySummary, profile, avatarConfig, skipAvatarAnimation }: {
  daySummary: DaySummary
  profile: Profile
  avatarConfig: AvatarConfig | null
  skipAvatarAnimation: boolean
}) {
  const allDone = daySummary.missionsTotal > 0 && daySummary.missionsCompleted >= daySummary.missionsTotal
  const { dailyMissions, bossMission, achievements } = daySummary

  const avatarMessage = allDone
    ? 'Día perfecto. Así se forjan las leyendas.'
    : daySummary.missionsCompleted > 0
    ? 'Cada misión completada es un paso. Mañana, más.'
    : 'Hoy no fue tu día. Mañana empieza de nuevo.'

  const ctaMessage = allDone
    ? 'Perfecto. Vuelve mañana y repítelo.'
    : daySummary.missionsCompleted > 0
    ? 'Todavía puedes completar tus misiones de hoy.'
    : 'Mañana es otra oportunidad. No la desperdicies.'

  return (
    <div className="flex flex-col gap-8">
      {/* Avatar narrador */}
      <AvatarSpeechBubble
        message={avatarMessage}
        avatarConfig={avatarConfig}
        size={48}
        skipAnimation={skipAvatarAnimation}
      />

      {/* Stats */}
      <section>
        <SectionTitle>Resumen del día</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="XP ganada hoy"
            value={`+${daySummary.xpEarnedToday}`}
            sub="puntos de experiencia"
            borderColor="var(--color-accent)"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            }
          />
          <StatCard
            label="Misiones diarias"
            value={`${daySummary.missionsCompleted}/${daySummary.missionsTotal}`}
            sub={allDone ? 'todas completadas' : 'completadas hoy'}
            borderColor="var(--color-fisico)"
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
            borderColor="var(--color-disciplina)"
            valueColor={profile.current_streak > 0 ? 'var(--color-disciplina)' : 'var(--color-text-primary)'}
            icon={<Flame size={16} aria-hidden />}
          />
          <StatCard
            label="Escudos disponibles"
            value={profile.shield_count}
            sub={profile.shield_count === 1 ? 'escudo de racha' : 'escudos de racha'}
            borderColor="var(--color-accent)"
            icon={<ShieldCheck size={16} aria-hidden />}
          />
        </div>
      </section>

      {/* Daily missions */}
      <section>
        <SectionTitle>
          Misiones diarias · {daySummary.missionsCompleted}/{daySummary.missionsTotal} completadas
        </SectionTitle>
        {dailyMissions.length === 0 ? (
          <div className="bg-surface rounded-card border border-border/60 flex flex-col items-center gap-3 p-8 text-center">
            <Sword size={40} strokeWidth={1.5} className="text-text-muted" aria-hidden />
            <p className="text-sm text-text-muted">Aún no has completado misiones diarias hoy</p>
          </div>
        ) : (
          <div className="bg-surface rounded-card border border-border/60 overflow-hidden">
            {dailyMissions.map((item, idx) => (
              <div key={item.mission_id} className={idx < dailyMissions.length - 1 ? 'border-b border-border/40' : ''}>
                <MissionRow item={item} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Boss mission */}
      {bossMission && (
        <section>
          <SectionTitle>Misión jefe</SectionTitle>
          <MissionCard
            icon={<Swords size={12} style={{ color: 'var(--color-accent)' }} aria-hidden />}
            title=""
            missions={[bossMission]}
          />
        </section>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <section>
          <SectionTitle>Logros</SectionTitle>
          <MissionCard
            icon={<Trophy size={12} style={{ color: 'var(--color-disciplina)' }} aria-hidden />}
            title=""
            missions={achievements}
          />
        </section>
      )}

      <RPGCallToAction message={ctaMessage} />
    </div>
  )
}

// ─── Weekly view ──────────────────────────────────────────────────────────────

function WeeklyView({ weekData, avatarConfig, skipAvatarAnimation }: {
  weekData: WeekData
  avatarConfig: AvatarConfig | null
  skipAvatarAnimation: boolean
}) {
  const avatarMessage = weekData.currentStreak >= 7
    ? 'Siete días sin rendirte. Eso no es suerte, eres tú.'
    : weekData.missionsCompleted > 0
    ? 'Esta semana dejaste huella. Sigue construyendo.'
    : 'La semana se fue. La próxima es tuya.'

  const ctaMessage = weekData.currentStreak > 0
    ? `No rompas la racha. Sigue hoy.`
    : 'Esta semana aún puedes cambiar el marcador.'

  return (
    <div className="flex flex-col gap-8">
      {/* Avatar narrador */}
      <AvatarSpeechBubble
        message={avatarMessage}
        avatarConfig={avatarConfig}
        size={48}
        skipAnimation={skipAvatarAnimation}
      />

      {/* Stats */}
      <section>
        <SectionTitle>Esta semana</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Días activos"
            value={`${weekData.activeDays}/7`}
            sub="de 7 días"
            borderColor="var(--color-accent)"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
          />
          <StatCard
            label="XP ganada"
            value={`+${weekData.xpEarned}`}
            sub="puntos de XP"
            borderColor="var(--color-accent)"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            }
          />
          <StatCard
            label="Misiones"
            value={weekData.missionsCompleted}
            sub="completadas"
            borderColor="var(--color-fisico)"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Top class */}
      {weekData.topClass !== null && (() => {
        const { lc, points } = weekData.topClass!
        const meta = CLASS_META[lc]
        return (
          <section>
            <SectionTitle>Clase más trabajada</SectionTitle>
            <div
              className="rounded-card border border-border/60 p-6 flex items-center gap-4"
              style={{ borderLeft: `3px solid ${meta.color}` }}
            >
              {getClassIcon(lc, 18, { color: meta.color })}
              <span className="text-base font-black flex-1" style={{ color: meta.color }}>
                {meta.label}
              </span>
              <span className="text-sm font-black tabular-nums" style={{ color: 'var(--color-accent)' }}>
                {points} pts
              </span>
            </div>
          </section>
        )
      })()}

      {/* Streak */}
      <section>
        <SectionTitle>Racha al cierre</SectionTitle>
        <div
          className="rounded-card border border-border/60 p-6 flex items-center gap-3"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-disciplina) 5%, var(--color-surface))',
            borderLeft: '3px solid var(--color-disciplina)',
          }}
        >
          <Flame size={24} style={{ color: 'var(--color-disciplina)' }} aria-hidden />
          <span
            className="text-4xl font-black tabular-nums"
            style={{ color: weekData.currentStreak > 0 ? 'var(--color-disciplina)' : 'var(--color-text-primary)' }}
          >
            {weekData.currentStreak}
          </span>
          <span className="text-sm text-text-muted">
            {weekData.currentStreak === 1 ? 'día' : 'días'} de racha
          </span>
        </div>
      </section>

      {/* Heatmap */}
      <section>
        <SectionTitle>Actividad de la semana</SectionTitle>
        <div className="bg-surface rounded-card border border-border/60 p-6">
          {/* Day labels — above grid */}
          <div className="flex justify-between mb-1.5">
            {weekData.heatmap.map(day => {
              const d = new Date(day.date + 'T00:00:00')
              return (
                <span
                  key={day.date}
                  className="flex-1 text-center text-[10px]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {['D', 'L', 'M', 'X', 'J', 'V', 'S'][d.getDay()]}
                </span>
              )
            })}
          </div>
          <MiniHeatmap data={weekData.heatmap} cols={7} />
        </div>
      </section>

      <RPGCallToAction message={ctaMessage} />
    </div>
  )
}

// ─── Monthly view ─────────────────────────────────────────────────────────────

function MonthlyView({ monthData, avatarConfig, skipAvatarAnimation }: {
  monthData: MonthData
  avatarConfig: AvatarConfig | null
  skipAvatarAnimation: boolean
}) {
  const reduced = useReducedMotion()
  const maxPts = Math.max(monthData.classPoints.fisico, monthData.classPoints.mental, monthData.classPoints.disciplina, 1)

  const topClassEntry = (['fisico', 'mental', 'disciplina'] as LifeClass[])
    .map(lc => ({ lc, points: monthData.classPoints[lc] }))
    .filter(e => e.points > 0)
    .sort((a, b) => b.points - a.points)[0] ?? null

  const avatarMessage = topClassEntry
    ? `Tu clase ${CLASS_META[topClassEntry.lc].label} está dominando. El camino se ve.`
    : 'Un mes más de progreso real. No pares.'

  return (
    <div className="flex flex-col gap-8">
      {/* Avatar narrador */}
      <AvatarSpeechBubble
        message={avatarMessage}
        avatarConfig={avatarConfig}
        size={48}
        skipAnimation={skipAvatarAnimation}
      />

      {/* Stats */}
      <section>
        <SectionTitle>Este mes</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Días activos"
            value={`${monthData.activeDays}/30`}
            sub="de 30 días"
            borderColor="var(--color-accent)"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
          />
          <StatCard
            label="XP ganada"
            value={`+${monthData.xpEarned}`}
            sub="puntos de XP"
            borderColor="var(--color-accent)"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            }
          />
          <StatCard
            label="Misiones"
            value={monthData.missionsCompleted}
            sub="completadas"
            borderColor="var(--color-fisico)"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Class progress bars */}
      <section>
        <SectionTitle>Puntos por clase</SectionTitle>
        <div className="bg-surface rounded-card border border-border/60 p-6 flex flex-col gap-5">
          {(['fisico', 'mental', 'disciplina'] as LifeClass[]).map(lc => {
            const pts = monthData.classPoints[lc]
            const pct = Math.round((pts / maxPts) * 100)
            const meta = CLASS_META[lc]
            const target = `${pct}%`
            return (
              <div key={lc} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getClassIcon(lc, 14, { color: meta.color })}
                    <span className="text-sm text-text-muted">{meta.label}</span>
                  </div>
                  <span className="text-sm font-black tabular-nums" style={{ color: meta.color }}>
                    {pts} {pts === 1 ? 'punto' : 'puntos'}
                  </span>
                </div>
                <div
                  className="h-3 rounded-full overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    boxShadow: `0 4px 14px color-mix(in srgb, ${meta.color} 20%, transparent)`,
                  }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: meta.color }}
                    initial={{ width: reduced ? target : '0%' }}
                    animate={{ width: target }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Best streak */}
      <section>
        <SectionTitle>Mejor racha del mes</SectionTitle>
        <div
          className="rounded-card border border-border/60 p-6 flex items-center gap-3"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-disciplina) 5%, var(--color-surface))',
            borderLeft: '3px solid var(--color-disciplina)',
          }}
        >
          <Flame size={24} style={{ color: 'var(--color-disciplina)' }} aria-hidden />
          <span
            className="text-4xl font-black tabular-nums"
            style={{ color: monthData.bestStreak > 0 ? 'var(--color-disciplina)' : 'var(--color-text-primary)' }}
          >
            {monthData.bestStreak}
          </span>
          <span className="text-sm text-text-muted">
            {monthData.bestStreak === 1 ? 'día' : 'días'} consecutivos
          </span>
        </div>
      </section>

      {/* Heatmap */}
      <section>
        <SectionTitle>Actividad del mes</SectionTitle>
        <div className="bg-surface rounded-card border border-border/60 p-6">
          <MiniHeatmap data={monthData.heatmap} cols={10} />
          <p className="text-xs text-text-muted mt-3">
            {monthData.activeDays} {monthData.activeDays === 1 ? 'día activo' : 'días activos'} en los últimos 30 días
          </p>
        </div>
      </section>

      <RPGCallToAction message={avatarMessage} />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface RecapClientProps {
  daySummary: DaySummary
  weekData: WeekData
  monthData: MonthData
  profile: Profile
}

export function RecapClient({ daySummary, weekData, monthData, profile }: RecapClientProps) {
  const [period, setPeriod] = useState<Period>('today')
  const [seenTabs, setSeenTabs] = useState<Set<Period>>(new Set())
  const avatarConfig = profile.avatar_config as AvatarConfig | null

  // Marca la tab actual como vista una vez montada — las siguientes visitas
  // a esa misma tab no repetirán la animación del avatar
  useEffect(() => {
    setSeenTabs(prev => (prev.has(period) ? prev : new Set(prev).add(period)))
  }, [period])

  const tabs: { id: Period; label: string }[] = [
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: 'Esta semana' },
    { id: 'month', label: 'Este mes' },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Period selector */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setPeriod(tab.id)}
            className="relative px-4 py-1.5 rounded-pill text-sm font-medium"
            style={{
              color: period === tab.id ? 'var(--color-background)' : 'var(--color-text-muted)',
              border: period === tab.id ? '1px solid transparent' : '1px solid var(--color-border)',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {period === tab.id && (
              <motion.span
                layoutId="recap-tab-indicator"
                className="absolute inset-0 rounded-pill"
                style={{ backgroundColor: 'var(--color-accent)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                aria-hidden
              />
            )}
            <span className="relative" style={{ zIndex: 1 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content — fade in on tab change */}
      {period === 'today' && (
        <motion.div
          key="today"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <DailyView daySummary={daySummary} profile={profile} avatarConfig={avatarConfig} skipAvatarAnimation={seenTabs.has('today')} />
        </motion.div>
      )}
      {period === 'week' && (
        <motion.div
          key="week"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <WeeklyView weekData={weekData} avatarConfig={avatarConfig} skipAvatarAnimation={seenTabs.has('week')} />
        </motion.div>
      )}
      {period === 'month' && (
        <motion.div
          key="month"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <MonthlyView monthData={monthData} avatarConfig={avatarConfig} skipAvatarAnimation={seenTabs.has('month')} />
        </motion.div>
      )}
    </div>
  )
}
