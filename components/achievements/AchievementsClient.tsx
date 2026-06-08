'use client'

import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import type { Mission, MissionDifficulty } from '@/types/supabase'
import { CLASS_META } from '@/lib/constants/classes'
import { completeAchievementAction, type AchievementActionResult } from '@/app/achievements/actions'
import { toast } from 'sonner'
import { playLevelUp, playMissionComplete, playShieldGained } from '@/lib/sounds'
import { CompleteButton } from '@/components/dashboard/CompleteButton'
import { LevelUpOverlay } from '@/components/LevelUpOverlay'
import { AnimatedBar } from '@/components/ui/AnimatedBar'
import { Trophy, Swords, Lock, ShieldCheck } from 'lucide-react'

const DIFF_META: Record<MissionDifficulty, { label: string; text: string; bg: string; border: string }> = {
  easy:   { label: 'Fácil',   text: 'text-fisico',     bg: 'bg-fisico/8',     border: 'border-fisico/20'     },
  medium: { label: 'Medio',   text: 'text-disciplina', bg: 'bg-disciplina/8', border: 'border-disciplina/20' },
  hard:   { label: 'Difícil', text: 'text-error',      bg: 'bg-error/8',      border: 'border-error/20'      },
  boss:   { label: 'Jefe',    text: 'text-accent',     bg: 'bg-accent/8',     border: 'border-accent/20'     },
}

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isWithinLastWeek(iso: string): boolean {
  const completed = new Date(iso)
  const weekAgo = new Date()
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 6)
  weekAgo.setUTCHours(0, 0, 0, 0)
  return completed >= weekAgo
}

// ─── Achievement card ─────────────────────────────────────────────────────────
function AchievementCard({ mission, completedAt }: {
  mission: Mission
  completedAt: string | null
}) {
  const isCompleted = completedAt !== null
  const classMeta = CLASS_META[mission.life_class]
  const [result, formAction] = useActionState<AchievementActionResult, FormData>(completeAchievementAction, null)
  const [showXp, setShowXp] = useState(false)
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null)
  const [completing, setCompleting] = useState(false)
  const prevTsRef = useRef<number | null>(null)
  const xpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!result || result.ts === prevTsRef.current) return
    prevTsRef.current = result.ts

    if (result.error) {
      toast.error('No se pudo completar el logro', { description: 'Inténtalo de nuevo' })
      return
    }

    playMissionComplete()
    if (result.shieldGranted) playShieldGained()
    if (result.levelUp) setTimeout(() => playLevelUp(), 300)

    toast('Logro completado', { description: `+${result.xpReward} XP`, duration: 2500 })
    if (result.shieldGranted) {
      toast('Escudo ganado', {
        description: 'Racha de 7 días completada',
        icon: <ShieldCheck size={16} />,
        duration: 4000,
      })
    }

    if (result.levelUp) setTimeout(() => setLevelUpData({ level: result.newLevel }), 800)
  }, [result])

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
        <LevelUpOverlay level={levelUpData.level} onClose={() => setLevelUpData(null)} />
      )}
      <article
        className="bg-surface rounded-card overflow-hidden flex border border-border/60 min-w-0 relative"
        style={{
          opacity: isCompleted ? 1 : completing ? 1 : 0.4,
          transition: 'opacity 300ms ease',
        }}
        aria-label={mission.title}
      >
        {/* Colored left border */}
        <div className="w-1 flex-shrink-0" style={{ backgroundColor: classMeta.color }} aria-hidden />

        {/* Lock overlay for uncompleted */}
        {!isCompleted && (
          <div
            className="absolute top-3 right-3"
            style={{ color: 'var(--color-text-muted)' }}
            aria-hidden
          >
            <Lock size={14} strokeWidth={1.75} />
          </div>
        )}

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
                {formatDate(completedAt)}
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap justify-end">
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                  <Lock size={11} strokeWidth={1.75} aria-hidden />
                  Pendiente de verificación
                </span>
                <form action={formAction} onSubmit={handleSubmit}>
                  <input type="hidden" name="missionId"   value={mission.id} />
                  <input type="hidden" name="xpReward"    value={mission.xp_reward} />
                  <input type="hidden" name="lifeClass"   value={mission.life_class} />
                  <input type="hidden" name="difficulty"  value={mission.difficulty} />
                  <input type="hidden" name="missionType" value="achievement" />
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
              </div>
            )}
          </div>
        </div>
      </article>
    </>
  )
}

// ─── Boss card ────────────────────────────────────────────────────────────────
function BossCard({ mission, completedAt, currentStreak }: {
  mission: Mission
  completedAt: string | null
  currentStreak: number
}) {
  const classMeta = CLASS_META[mission.life_class]
  const isUnlocked = currentStreak >= 7
  const completedThisWeek = completedAt !== null && isWithinLastWeek(completedAt)
  const isLocked = !isUnlocked && !completedThisWeek

  const [result, formAction] = useActionState<AchievementActionResult, FormData>(completeAchievementAction, null)
  const [showXp, setShowXp] = useState(false)
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null)
  const [completing, setCompleting] = useState(false)
  const prevTsRef = useRef<number | null>(null)
  const xpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!result || result.ts === prevTsRef.current) return
    prevTsRef.current = result.ts

    if (result.error) {
      toast.error('No se pudo completar el jefe', { description: 'Inténtalo de nuevo' })
      return
    }

    playMissionComplete()
    if (result.shieldGranted) playShieldGained()
    if (result.levelUp) setTimeout(() => playLevelUp(), 300)

    toast('Jefe derrotado', { description: `+${result.xpReward} XP`, duration: 2500 })
    if (result.shieldGranted) {
      toast('Escudo ganado', {
        description: 'Racha de 7 días completada',
        icon: <ShieldCheck size={16} />,
        duration: 4000,
      })
    }
    if (result.levelUp) setTimeout(() => setLevelUpData({ level: result.newLevel }), 800)
  }, [result])

  useEffect(() => {
    return () => { if (xpTimerRef.current) clearTimeout(xpTimerRef.current) }
  }, [])

  function handleSubmit() {
    setCompleting(true)
    setShowXp(true)
    if (xpTimerRef.current) clearTimeout(xpTimerRef.current)
    xpTimerRef.current = setTimeout(() => setShowXp(false), 650)
  }

  const daysProgress = Math.min(currentStreak, 7)

  return (
    <>
      {levelUpData && (
        <LevelUpOverlay level={levelUpData.level} onClose={() => setLevelUpData(null)} />
      )}
      <article
        className="rounded-card overflow-hidden border border-border/60 relative bg-surface"
        style={{ opacity: isLocked || (completedThisWeek && !completing) ? (isLocked ? 0.4 : 1) : 1 }}
        aria-label={mission.title}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: classMeta.color }} aria-hidden />

        {/* Lock overlay when locked */}
        {isLocked && (
          <div
            className="absolute top-3 right-3"
            style={{ color: 'var(--color-text-muted)' }}
            aria-hidden
          >
            <Lock size={14} strokeWidth={1.75} />
          </div>
        )}

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
            {completedThisWeek ? (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <IconCheck />
                Completada — {formatDate(completedAt!)}
              </div>
            ) : isLocked ? (
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Lock size={11} strokeWidth={1.75} aria-hidden />
                    Completa 7 días consecutivos para desbloquear
                  </span>
                  <span className="tabular-nums font-medium text-text-primary">{daysProgress}/7 días</span>
                </div>
                <AnimatedBar
                  value={daysProgress / 7}
                  color="var(--color-accent)"
                  height="h-1.5"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 flex-1">
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>Racha completada — lista para reclamar</span>
                    <span className="tabular-nums font-medium text-text-primary">7/7 días</span>
                  </div>
                  <AnimatedBar value={1} color="var(--color-fisico)" height="h-1.5" />
                </div>
                <form action={formAction} onSubmit={handleSubmit} className="flex-shrink-0">
                  <input type="hidden" name="missionId"   value={mission.id} />
                  <input type="hidden" name="xpReward"    value={mission.xp_reward} />
                  <input type="hidden" name="lifeClass"   value={mission.life_class} />
                  <input type="hidden" name="difficulty"  value={mission.difficulty} />
                  <input type="hidden" name="missionType" value="boss" />
                  <div className="relative">
                    <CompleteButton label="Reclamar" />
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
              </div>
            )}
          </div>
        </div>
      </article>
    </>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, count, total }: {
  icon: React.ReactNode
  title: string
  count: number
  total: number
}) {
  return (
    <div className="border-b border-border/40 pb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--color-text-muted)' }}>{icon}</span>
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      <span className="text-xs text-text-muted tabular-nums">{count}/{total}</span>
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────
export default function AchievementsClient({
  achievements,
  bossMissions,
  completedMap,
  currentStreak,
}: {
  achievements: Mission[]
  bossMissions: Mission[]
  completedMap: Record<string, string>
  currentStreak: number
}) {
  const sortedAchievements = [...achievements].sort((a, b) => {
    const aDone = completedMap[a.id] ? 1 : 0
    const bDone = completedMap[b.id] ? 1 : 0
    if (aDone !== bDone) return aDone - bDone
    return (a.sort_order ?? 999) - (b.sort_order ?? 999)
  })

  const completedAchievementsCount = achievements.filter(m => completedMap[m.id]).length

  const completedBossCount = bossMissions.filter(m => {
    const at = completedMap[m.id]
    return at && isWithinLastWeek(at)
  }).length

  return (
    <div className="flex flex-col gap-8">

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Logros</h1>
        <p className="text-sm text-text-muted mt-1">
          Hitos únicos y desafíos semanales que demuestran tu progreso
        </p>
      </div>

      {/* Logros únicos */}
      {achievements.length > 0 && (
        <section aria-labelledby="section-achievements" className="flex flex-col gap-4">
          <SectionHeader
            icon={<Trophy size={15} strokeWidth={1.75} />}
            title="Logros únicos"
            count={completedAchievementsCount}
            total={achievements.length}
          />
          <div className="flex md:grid md:grid-cols-2 gap-3 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none scrollbar-hide pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
            {sortedAchievements.map(m => (
              <div key={m.id} className="w-[calc(100vw-32px)] md:min-w-0 md:w-auto flex-shrink-0 snap-start">
                <AchievementCard
                  mission={m}
                  completedAt={completedMap[m.id] ?? null}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Jefe semanal */}
      {bossMissions.length > 0 && (
        <section aria-labelledby="section-boss" className="flex flex-col gap-4">
          <SectionHeader
            icon={<Swords size={15} strokeWidth={1.75} />}
            title="Jefe semanal"
            count={completedBossCount}
            total={bossMissions.length}
          />
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none scrollbar-hide pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
            {bossMissions.map(m => (
              <div key={m.id} className="w-[calc(100vw-32px)] md:min-w-0 md:w-auto flex-shrink-0 snap-start">
                <BossCard
                  mission={m}
                  completedAt={completedMap[m.id] ?? null}
                  currentStreak={currentStreak}
                />
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
