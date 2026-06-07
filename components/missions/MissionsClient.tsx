'use client'

import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import type { Mission, MissionDifficulty, MissionType } from '@/types/supabase'
import { CLASS_META } from '@/lib/constants/classes'
import { completeMissionAction, type MissionActionResult } from '@/app/missions/actions'
import type { DaySummary } from '@/lib/recap'
import { toast } from 'sonner'
import { playLevelUp, playMissionComplete, playShieldGained, playDayComplete } from '@/lib/sounds'
import { CompleteButton } from '@/components/dashboard/CompleteButton'
import { LevelUpOverlay } from '@/components/LevelUpOverlay'
import { DailyRecapOverlay } from '@/components/dashboard/DailyRecapOverlay'
import { AnimatedBar } from '@/components/ui/AnimatedBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Filter, ShieldCheck } from 'lucide-react'

function getTodayKey(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

const DIFF_META: Record<MissionDifficulty, { label: string; text: string; bg: string; border: string }> = {
  easy:   { label: 'Fácil',  text: 'text-fisico',     bg: 'bg-fisico/8',     border: 'border-fisico/20'     },
  medium: { label: 'Medio',  text: 'text-disciplina', bg: 'bg-disciplina/8', border: 'border-disciplina/20' },
  hard:   { label: 'Difícil', text: 'text-error',     bg: 'bg-error/8',      border: 'border-error/20'      },
  boss:   { label: 'Jefe',   text: 'text-accent',     bg: 'bg-accent/8',     border: 'border-accent/20'     },
}

const SECTION_META: Partial<Record<MissionType, { title: string; isBoss: boolean }>> = {
  daily:       { title: 'Misiones diarias',  isBoss: false },
  streak:      { title: 'Misiones de racha', isBoss: false },
  achievement: { title: 'Logros únicos',     isBoss: false },
  boss:        { title: 'Jefe semanal',      isBoss: true  },
}

const TYPE_ORDER: MissionType[] = ['daily', 'streak', 'achievement', 'boss']

type FilterValue = 'all' | 'fisico' | 'mental' | 'disciplina' | 'easy' | 'medium' | 'hard' | 'boss'

const FILTER_PILLS: { value: FilterValue; label: string }[] = [
  { value: 'all',        label: 'Todas'     },
  { value: 'fisico',     label: 'Físico'    },
  { value: 'mental',     label: 'Mental'    },
  { value: 'disciplina', label: 'Disciplina'},
  { value: 'easy',       label: 'Fácil'     },
  { value: 'medium',     label: 'Medio'     },
  { value: 'hard',       label: 'Difícil'   },
  { value: 'boss',       label: 'Jefe'      },
]

// ─── Badge components ────────────────────────────────────────────────────────
function ClassBadge({ lifeClass }: { lifeClass: keyof typeof CLASS_META }) {
  const m = CLASS_META[lifeClass]
  return (
    <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-pill ${m.badgeClasses}`}>
      {m.label}
    </span>
  )
}

function DiffBadge({ difficulty }: { difficulty: MissionDifficulty }) {
  const m = DIFF_META[difficulty]
  if (!m) return null
  return (
    <span className={`inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-pill border ${m.text} ${m.bg} ${m.border}`}>
      {m.label}
    </span>
  )
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-fisico flex-shrink-0" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ─── Standard mission card ───────────────────────────────────────────────────
function MissionCard({
  mission,
  isCompleted,
  onAllCompleted,
}: {
  mission: Mission
  isCompleted: boolean
  onAllCompleted?: (summary: DaySummary) => void
}) {
  const classMeta = CLASS_META[mission.life_class]
  const [result, formAction] = useActionState<MissionActionResult, FormData>(completeMissionAction, null)
  const [showXp, setShowXp] = useState(false)
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null)
  const [completing, setCompleting] = useState(false)
  const prevTsRef = useRef<number | null>(null)
  const xpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Only use result for level-up/shield — animations fire optimistically from onSubmit
  useEffect(() => {
    if (!result || result.ts === prevTsRef.current) return
    prevTsRef.current = result.ts

    if (result.error) {
      toast.error('No se pudo completar la misión', { description: 'Inténtalo de nuevo' })
      return
    }

    // Sonidos — siempre se ejecutan, independientes de los overlays
    playMissionComplete()
    if (result.shieldGranted) playShieldGained()
    if (result.levelUp) setTimeout(() => playLevelUp(), 300)
    if (result.allMissionsCompleted) setTimeout(() => playDayComplete(), 400)

    // Toasts
    toast('Misión completada', { description: `+${result.xpReward} XP`, duration: 2500 })
    if (result.shieldGranted) {
      toast('Escudo ganado', {
        description: 'Racha de 7 días completada',
        icon: <ShieldCheck size={16} />,
        duration: 4000,
      })
    }

    // Overlays — independientes de los sonidos
    if (result.levelUp) setTimeout(() => setLevelUpData({ level: result.newLevel }), 800)

    if (result.allMissionsCompleted && result.daySummary) {
      const key = `recap-shown-${getTodayKey()}`
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        const summary = result.daySummary
        const delay = result.levelUp ? 500 : 0
        setTimeout(() => onAllCompleted?.(summary), delay)
      }
    }
  }, [result, onAllCompleted])

  useEffect(() => {
    return () => { if (xpTimerRef.current) clearTimeout(xpTimerRef.current) }
  }, [])

  function handleSubmit() {
    setCompleting(true)
    setShowXp(true)
    if (xpTimerRef.current) clearTimeout(xpTimerRef.current)
    xpTimerRef.current = setTimeout(() => setShowXp(false), 650)
  }

  return (
    <>
      {levelUpData && (
        <LevelUpOverlay
          level={levelUpData.level}
          onClose={() => setLevelUpData(null)}
        />
      )}

      <article
        className="bg-surface rounded-card overflow-hidden flex border border-border/60 min-w-0 group hover:border-border"
        style={{
          transition: 'opacity 300ms ease, transform 300ms ease',
          opacity: isCompleted || completing ? 0.5 : 1,
          transform: completing && !isCompleted ? 'scale(0.985)' : 'scale(1)',
        }}
        aria-label={mission.title}
      >
        <div className="w-1 flex-shrink-0" style={{ backgroundColor: classMeta.color }} aria-hidden />

        <div className="flex-1 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <ClassBadge lifeClass={mission.life_class} />
            <DiffBadge difficulty={mission.difficulty} />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-text-primary text-base leading-snug">{mission.title}</h3>
            {mission.description && (
              <p className="text-sm text-text-muted mt-1.5 leading-relaxed">{mission.description}</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 pt-1 border-t border-border/40">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-accent tabular-nums">+{mission.xp_reward}</span>
              <span className="text-xs text-text-muted">XP</span>
            </div>

            {isCompleted ? (
              <div className="flex items-center gap-1.5 text-sm text-text-muted">
                <IconCheck />
                Completada hoy
              </div>
            ) : (
              <form action={formAction} onSubmit={handleSubmit}>
                <input type="hidden" name="missionId"  value={mission.id} />
                <input type="hidden" name="xpReward"   value={mission.xp_reward} />
                <input type="hidden" name="lifeClass"  value={mission.life_class} />
                <input type="hidden" name="difficulty" value={mission.difficulty} />
                <div className="relative">
                  <CompleteButton label="Completar" />
                  {showXp && (
                    <span
                      className="absolute left-1/2 bottom-full mb-1 text-sm font-bold text-accent pointer-events-none whitespace-nowrap"
                      style={{ animation: 'xp-float 650ms ease forwards' }}
                      aria-hidden
                    >
                      +{mission.xp_reward} XP
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </article>
    </>
  )
}

// ─── Boss mission card ────────────────────────────────────────────────────────
function BossMissionCard({
  mission,
  isCompleted,
  currentStreak,
}: {
  mission: Mission
  isCompleted: boolean
  currentStreak: number
}) {
  const classMeta = CLASS_META[mission.life_class]
  // Days completed in the current 7-day cycle (0–7)
  const daysProgress = currentStreak % 7 === 0 && currentStreak > 0 ? 7 : currentStreak % 7
  const isWeekComplete = daysProgress === 7
  const barColor = isWeekComplete ? 'var(--color-fisico)' : 'var(--color-accent)'

  return (
    <article
      className="rounded-card overflow-hidden border border-border/60 relative bg-surface"
      style={{ opacity: isCompleted ? 0.5 : 1 }}
      aria-label={mission.title}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: classMeta.color }} aria-hidden />

      <div className="p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <ClassBadge lifeClass={mission.life_class} />
              <DiffBadge difficulty={mission.difficulty} />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-xl">{mission.title}</h3>
              {mission.description && (
                <p className="text-sm text-text-muted mt-2 leading-relaxed max-w-xl">{mission.description}</p>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-3xl font-bold text-accent tabular-nums">+{mission.xp_reward}</p>
            <p className="text-xs text-text-muted font-medium mt-0.5">XP</p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-1 border-t border-border/40">
          {isCompleted ? (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <IconCheck />
              Completada esta semana
            </div>
          ) : (
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Progreso semanal — se completa automáticamente</span>
                <span className="tabular-nums font-medium text-text-primary">{daysProgress}/7 días</span>
              </div>
              <AnimatedBar
                value={daysProgress / 7}
                color={barColor}
                height="h-1.5"
              />
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── Mission section ─────────────────────────────────────────────────────────
function MissionSection({
  title,
  missions,
  completedIds,
  isBoss,
  currentStreak,
  onAllCompleted,
}: {
  title: string
  missions: Mission[]
  completedIds: Set<string>
  isBoss: boolean
  currentStreak: number
  onAllCompleted?: (summary: DaySummary) => void
}) {
  if (missions.length === 0) return null

  const completedCount = missions.filter(m => completedIds.has(m.id)).length

  return (
    <section aria-labelledby={`section-${title}`} className="flex flex-col gap-4">
      <div className="border-b border-border/40 pb-2 flex items-center justify-between">
        <h2
          id={`section-${title}`}
          className="text-[11px] font-medium text-text-muted uppercase tracking-wider"
        >
          {title}
        </h2>
        <span className="text-xs text-text-muted tabular-nums">
          {completedCount}/{missions.length}
        </span>
      </div>

      {isBoss ? (
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none scrollbar-hide pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          {missions.map(m => (
            <div key={m.id} className="w-[calc(100vw-32px)] md:min-w-0 md:w-auto flex-shrink-0 snap-start">
              <BossMissionCard
                mission={m}
                isCompleted={completedIds.has(m.id)}
                currentStreak={currentStreak}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex md:grid md:grid-cols-2 gap-3 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none scrollbar-hide pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          {[...missions]
            .sort((a, b) => {
              const aDone = completedIds.has(a.id) ? 1 : 0
              const bDone = completedIds.has(b.id) ? 1 : 0
              if (aDone !== bDone) return aDone - bDone
              return (a.sort_order ?? 999) - (b.sort_order ?? 999)
            })
            .map(m => (
              <div key={m.id} className="w-[calc(100vw-32px)] md:min-w-0 md:w-auto flex-shrink-0 snap-start">
                <MissionCard mission={m} isCompleted={completedIds.has(m.id)} onAllCompleted={onAllCompleted} />
              </div>
            ))}
        </div>
      )}
    </section>
  )
}

// ─── All-daily-done banner ───────────────────────────────────────────────────
function AllDailyDoneBanner() {
  return (
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
  )
}

// ─── Main client component ───────────────────────────────────────────────────
export default function MissionsClient({
  missions,
  completedTodayIds,
  currentStreak,
}: {
  missions: Mission[]
  completedTodayIds: string[]
  currentStreak: number
}) {
  const [filter, setFilter] = useState<FilterValue>('all')
  const [recapData, setRecapData] = useState<DaySummary | null>(null)

  const handleAllCompleted = useCallback((summary: DaySummary) => {
    setRecapData(summary)
  }, [])

  const handleRecapClose = useCallback(() => {
    setRecapData(null)
  }, [])

  const completedSet = new Set(completedTodayIds)

  const filtered =
    filter === 'all'
      ? missions
      : missions.filter(
          m => (m.life_class as string) === filter || (m.difficulty as string) === filter
        )

  const byType = new Map<MissionType, Mission[]>()
  for (const type of TYPE_ORDER) byType.set(type, [])
  for (const m of filtered) {
    const arr = byType.get(m.type)
    if (arr) arr.push(m)
  }

  const totalFiltered = filtered.length
  const totalCompleted = filtered.filter(m => completedSet.has(m.id)).length

  const dailyMissions = missions.filter(m => m.type === 'daily')
  const allDailyDone = dailyMissions.length > 0 && dailyMissions.every(m => completedSet.has(m.id))

  return (
    <>
    {recapData && (
      <DailyRecapOverlay
        daySummary={recapData}
        onClose={handleRecapClose}
      />
    )}
    <div className="flex flex-col gap-8">

      {/* ── Page title ──────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Misiones</h1>
          <p className="text-sm text-text-muted mt-1">
            Completa misiones para ganar XP y subir de nivel
          </p>
        </div>
        {totalFiltered > 0 && (
          <p className="text-sm text-text-muted flex-shrink-0 tabular-nums">
            <span className="text-text-primary font-semibold">{totalCompleted}</span>
            /{totalFiltered} completadas hoy
          </p>
        )}
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 flex-wrap"
        role="group"
        aria-label="Filtrar misiones"
      >
        {FILTER_PILLS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`
              h-8 px-4 rounded-pill text-sm font-medium
              transition-all duration-150 cursor-pointer
              ${filter === value
                ? 'bg-accent text-white'
                : 'bg-surface border border-border text-text-muted hover:text-text-secondary hover:border-border/80'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── All-daily-done banner ───────────────────────────────────────── */}
      {allDailyDone && <AllDailyDoneBanner />}

      {/* ── Sections ────────────────────────────────────────────────────── */}
      {totalFiltered > 0 ? (
        <div className="flex flex-col gap-10">
          {TYPE_ORDER.map(type => {
            const sectionMeta = SECTION_META[type]
            if (!sectionMeta) return null
            const sectionMissions = byType.get(type) ?? []
            return (
              <MissionSection
                key={type}
                title={sectionMeta.title}
                missions={sectionMissions}
                completedIds={completedSet}
                isBoss={sectionMeta.isBoss}
                currentStreak={currentStreak}
                onAllCompleted={handleAllCompleted}
              />
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Filter size={40} strokeWidth={1.5} aria-hidden />}
          title="Sin misiones en esta categoría"
          description="Prueba con otro filtro"
        />
      )}

    </div>
    </>
  )
}
