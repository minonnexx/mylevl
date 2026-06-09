'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import type { Medal, Mission, MissionDifficulty } from '@/types/supabase'
import { CLASS_META } from '@/lib/constants/classes'
import { RARITY_META } from '@/lib/constants/medals'
import { HexMedal } from '@/components/ui/HexMedal'
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
    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 flex-shrink-0" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ color: 'var(--color-fisico)' }}>
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

function autoProgressText(title: string, totalDaysActive: number, totalMissionsCount: number): string {
  const t = title.toLowerCase()
  if (t.includes('30 días activos'))  return `Progreso: ${totalDaysActive}/30 días activos`
  if (t.includes('365 días activos')) return `Progreso: ${totalDaysActive}/365 días activos`
  if (t.includes('100 misiones'))     return `Progreso: ${totalMissionsCount}/100 misiones`
  return 'Se desbloquea automáticamente'
}

// ─── Compact achievement card (grid 2/3 cols) ─────────────────────────────────
function AchievementCard({ mission, completedAt, medal, totalDaysActive, totalMissionsCount }: {
  mission: Mission
  completedAt: string | null
  medal: Medal | null
  totalDaysActive: number
  totalMissionsCount: number
}) {
  const isCompleted = completedAt !== null
  const isAuto = mission.verification_type === 'automatic'
  const classMeta = CLASS_META[mission.life_class]
  const hexColor: string = medal ? RARITY_META[medal.rarity].color : classMeta.color

  const [result, formAction] = useActionState<AchievementActionResult, FormData>(completeAchievementAction, null)
  const [showXp, setShowXp] = useState(false)
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null)
  const [completing, setCompleting] = useState(false)
  const prevTsRef = useRef<number | null>(null)
  const xpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!result || result.ts === prevTsRef.current) return
    prevTsRef.current = result.ts
    if (result.error) { toast.error('No se pudo completar el logro'); return }
    playMissionComplete()
    if (result.shieldGranted) playShieldGained()
    if (result.levelUp) setTimeout(() => playLevelUp(), 300)
    toast('Logro completado', { description: `+${result.xpReward} XP`, duration: 2500 })
    if (result.shieldGranted) toast('Escudo ganado', { description: 'Racha de 7 días completada', icon: <ShieldCheck size={16} />, duration: 4000 })
    if (result.levelUp) setTimeout(() => setLevelUpData({ level: result.newLevel }), 800)
  }, [result])

  useEffect(() => () => { if (xpTimerRef.current) clearTimeout(xpTimerRef.current) }, [])

  function handleSubmit() {
    setCompleting(true)
    setShowXp(true)
    if (xpTimerRef.current) clearTimeout(xpTimerRef.current)
    xpTimerRef.current = setTimeout(() => setShowXp(false), 650)
  }

  return (
    <>
      {levelUpData && <LevelUpOverlay level={levelUpData.level} onClose={() => setLevelUpData(null)} />}
      <article
        className="bg-surface rounded-card border border-border/60 p-4 flex flex-col gap-3"
        style={{ opacity: isCompleted || completing ? 1 : 0.5, transition: 'opacity 300ms ease' }}
        aria-label={mission.title}
      >
        <div className="flex items-start justify-between gap-2">
          <div style={{ color: hexColor }}>
            <HexMedal locked={!isCompleted} icon={medal?.icon} size={40} />
          </div>
          {medal ? (
            <span className="text-[10px] font-semibold" style={{ color: RARITY_META[medal.rarity].color }}>
              {RARITY_META[medal.rarity].label}
            </span>
          ) : (
            <DiffBadge difficulty={mission.difficulty} />
          )}
        </div>

        <p className="text-sm font-semibold text-text-primary leading-snug">{mission.title}</p>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--color-accent)' }}>
            +{mission.xp_reward} XP
          </span>
          <ClassBadge lifeClass={mission.life_class} />
        </div>

        {isCompleted ? (
          <div className="flex items-center gap-1.5">
            <IconCheck />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatDate(completedAt)}</span>
          </div>
        ) : isAuto ? (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {autoProgressText(mission.title, totalDaysActive, totalMissionsCount)}
          </p>
        ) : (
          <form action={formAction} onSubmit={handleSubmit}>
            <input type="hidden" name="missionId"   value={mission.id} />
            <input type="hidden" name="xpReward"    value={mission.xp_reward} />
            <input type="hidden" name="lifeClass"   value={mission.life_class} />
            <input type="hidden" name="difficulty"  value={mission.difficulty} />
            <input type="hidden" name="missionType" value="achievement" />
            <div className="relative">
              <CompleteButton label="Completar" />
              {showXp && (
                <span className="absolute left-1/2 bottom-full mb-1 text-sm font-bold pointer-events-none whitespace-nowrap" style={{ animation: 'xp-float 650ms ease forwards', color: 'var(--color-accent)' }} aria-hidden>
                  +{mission.xp_reward} XP
                </span>
              )}
            </div>
          </form>
        )}
      </article>
    </>
  )
}

// ─── Boss card — full width, prominent ────────────────────────────────────────
function BossCard({ mission, completedAt, currentStreak, medal }: {
  mission: Mission
  completedAt: string | null
  currentStreak: number
  medal: Medal | null
}) {
  const classMeta = CLASS_META[mission.life_class]
  const isUnlocked = currentStreak >= 7
  const completedThisWeek = completedAt !== null && isWithinLastWeek(completedAt)
  const isLocked = !isUnlocked && !completedThisWeek
  const isActive = isUnlocked && !completedThisWeek

  const hexColor: string = medal ? RARITY_META[medal.rarity].color : classMeta.color

  const [result, formAction] = useActionState<AchievementActionResult, FormData>(completeAchievementAction, null)
  const [showXp, setShowXp] = useState(false)
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null)
  const [completing, setCompleting] = useState(false)
  const prevTsRef = useRef<number | null>(null)
  const xpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!result || result.ts === prevTsRef.current) return
    prevTsRef.current = result.ts
    if (result.error) { toast.error('No se pudo completar el jefe'); return }
    playMissionComplete()
    if (result.shieldGranted) playShieldGained()
    if (result.levelUp) setTimeout(() => playLevelUp(), 300)
    toast('Jefe derrotado', { description: `+${result.xpReward} XP`, duration: 2500 })
    if (result.shieldGranted) toast('Escudo ganado', { description: 'Racha de 7 días completada', icon: <ShieldCheck size={16} />, duration: 4000 })
    if (result.levelUp) setTimeout(() => setLevelUpData({ level: result.newLevel }), 800)
  }, [result])

  useEffect(() => () => { if (xpTimerRef.current) clearTimeout(xpTimerRef.current) }, [])

  function handleSubmit() {
    setCompleting(true)
    setShowXp(true)
    if (xpTimerRef.current) clearTimeout(xpTimerRef.current)
    xpTimerRef.current = setTimeout(() => setShowXp(false), 650)
  }

  const daysProgress = Math.min(currentStreak, 7)

  return (
    <>
      {levelUpData && <LevelUpOverlay level={levelUpData.level} onClose={() => setLevelUpData(null)} />}
      <article
        className={`rounded-card overflow-hidden border bg-surface ${isActive ? 'boss-border-pulse' : ''}`}
        style={{
          borderColor: isActive
            ? 'var(--color-accent)'
            : 'color-mix(in srgb, var(--color-border) 60%, transparent)',
          opacity: isLocked ? 0.55 : 1,
        }}
        aria-label={mission.title}
      >
        {/* Top accent line */}
        <div className="h-[2px] w-full" style={{ backgroundColor: classMeta.color }} aria-hidden />

        <div className="p-6 flex flex-col gap-5">
          {/* Header: hex medal + title + XP */}
          <div className="flex items-start gap-5">
            <div style={{ color: hexColor }}>
              <HexMedal locked={isLocked} icon={medal?.icon} size={64} />
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <ClassBadge lifeClass={mission.life_class} />
                <DiffBadge difficulty={mission.difficulty} />
                {medal && (
                  <span className="text-[10px] font-semibold" style={{ color: RARITY_META[medal.rarity].color }}>
                    {RARITY_META[medal.rarity].label}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-text-primary leading-snug">{mission.title}</h3>
              {mission.description && (
                <p className="text-sm text-text-muted leading-relaxed">{mission.description}</p>
              )}
            </div>

            <div className="flex-shrink-0 text-right">
              <p className="text-3xl font-bold tabular-nums" style={{ color: 'var(--color-accent)' }}>
                +{mission.xp_reward}
              </p>
              <p className="text-xs text-text-muted font-medium mt-0.5">XP</p>
            </div>
          </div>

          {/* Footer: progress / status */}
          <div className="pt-1 border-t border-border/40">
            {completedThisWeek ? (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <IconCheck />
                Completada — {formatDate(completedAt!)}
              </div>
            ) : isLocked ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Lock size={11} strokeWidth={1.75} aria-hidden />
                    Completa 7 días consecutivos para desbloquear
                  </span>
                  <span className="tabular-nums font-medium text-text-primary">{daysProgress}/7 días</span>
                </div>
                <AnimatedBar value={daysProgress / 7} color="var(--color-accent)" height="h-1.5" />
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
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
                    <CompleteButton label="Reclamar recompensa" />
                    {showXp && (
                      <span className="absolute left-1/2 bottom-full mb-1 text-sm font-bold pointer-events-none whitespace-nowrap" style={{ animation: 'xp-float 650ms ease forwards', color: 'var(--color-accent)' }} aria-hidden>
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
  icon: React.ReactNode; title: string; count: number; total: number
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
  medalsMap,
  totalDaysActive,
  totalMissionsCount,
}: {
  achievements: Mission[]
  bossMissions: Mission[]
  completedMap: Record<string, string>
  currentStreak: number
  medalsMap: Record<string, Medal>
  totalDaysActive: number
  totalMissionsCount: number
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

      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Logros</h1>
        <p className="text-sm text-text-muted mt-1">Hitos únicos y desafíos semanales que demuestran tu progreso</p>
      </div>

      {achievements.length > 0 && (
        <section aria-labelledby="section-achievements" className="flex flex-col gap-4">
          <SectionHeader
            icon={<Trophy size={15} strokeWidth={1.75} />}
            title="Logros únicos"
            count={completedAchievementsCount}
            total={achievements.length}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {sortedAchievements.map(m => (
              <AchievementCard
                key={m.id}
                mission={m}
                completedAt={completedMap[m.id] ?? null}
                medal={medalsMap[m.id] ?? null}
                totalDaysActive={totalDaysActive}
                totalMissionsCount={totalMissionsCount}
              />
            ))}
          </div>
        </section>
      )}

      {bossMissions.length > 0 && (
        <section aria-labelledby="section-boss" className="flex flex-col gap-4">
          <SectionHeader
            icon={<Swords size={15} strokeWidth={1.75} />}
            title="Jefe semanal"
            count={completedBossCount}
            total={bossMissions.length}
          />
          <div className="flex flex-col gap-4">
            {bossMissions.map(m => (
              <BossCard
                key={m.id}
                mission={m}
                completedAt={completedMap[m.id] ?? null}
                currentStreak={currentStreak}
                medal={medalsMap[m.id] ?? null}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
