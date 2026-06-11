'use client'

import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AvatarConfig, Medal, Mission, MissionDifficulty, LifeClass } from '@/types/supabase'
import { CLASS_META } from '@/lib/constants/classes'
import { RARITY_META } from '@/lib/constants/medals'
import { HexMedal } from '@/components/ui/HexMedal'
import { completeAchievementAction, markAvatarConfirmationShown, type AchievementActionResult } from '@/app/achievements/actions'
import { toast } from 'sonner'
import { playLevelUp, playMissionComplete, playShieldGained } from '@/lib/sounds'
import { CompleteButton } from '@/components/dashboard/CompleteButton'
import { LevelUpOverlay } from '@/components/LevelUpOverlay'
import { AvatarConfirmModal } from '@/components/achievements/AvatarConfirmModal'
import { AnimatedBar } from '@/components/ui/AnimatedBar'
import { Trophy, Swords, Lock, ShieldCheck, ChevronRight } from 'lucide-react'
import { AUTO_ACHIEVEMENT_TITLES } from '@/lib/constants/achievements'
import { MedalUnlockOverlay } from '@/components/ui/MedalUnlockOverlay'
import { MedalDetailModal } from '@/components/ui/MedalDetailModal'
import { WeeklyChallengeSection } from '@/components/achievements/WeeklyChallengeSection'
import type { ChallengeDefinition } from '@/lib/constants/challenges'

const DIFF_META: Record<MissionDifficulty, { label: string; text: string; bg: string; border: string }> = {
  easy:   { label: 'Fácil',   text: 'text-fisico',     bg: 'bg-fisico/8',     border: 'border-fisico/20'     },
  medium: { label: 'Medio',   text: 'text-disciplina', bg: 'bg-disciplina/8', border: 'border-disciplina/20' },
  hard:   { label: 'Difícil', text: 'text-error',      bg: 'bg-error/8',      border: 'border-error/20'      },
  boss:   { label: 'Jefe',    text: 'text-accent',     bg: 'bg-accent/8',     border: 'border-accent/20'     },
}

type ClassFilter = 'all' | LifeClass

const CLASS_FILTER_PILLS: { value: ClassFilter; label: string }[] = [
  { value: 'all',        label: 'Todos'      },
  { value: 'fisico',     label: 'Físico'     },
  { value: 'mental',     label: 'Mental'     },
  { value: 'disciplina', label: 'Disciplina' },
]

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
  if (t.includes(AUTO_ACHIEVEMENT_TITLES.THIRTY_ACTIVE_DAYS.toLowerCase()))
    return `Progreso: ${totalDaysActive}/30 días activos`
  if (t.includes(AUTO_ACHIEVEMENT_TITLES.THREE_SIXTY_FIVE_ACTIVE_DAYS.toLowerCase()))
    return `Progreso: ${totalDaysActive}/365 días activos`
  if (t.includes(AUTO_ACHIEVEMENT_TITLES.ONE_HUNDRED_MISSIONS.toLowerCase()))
    return `Progreso: ${totalMissionsCount}/100 misiones`
  return 'Se desbloquea automáticamente'
}

// ─── Compact achievement card ─────────────────────────────────────────────────
function AchievementCard({ mission, completedAt, medal, totalDaysActive, totalMissionsCount, wrapperClass, username, avatarConfig, activePack, avatarConfirmationShown, isProcessing, onProcessingChange }: {
  mission: Mission
  completedAt: string | null
  medal: Medal | null
  totalDaysActive: number
  totalMissionsCount: number
  wrapperClass?: string
  username: string
  avatarConfig: AvatarConfig | null
  activePack: string | null
  avatarConfirmationShown: boolean
  isProcessing?: boolean
  onProcessingChange?: (v: boolean) => void
}) {
  const isCompleted = completedAt !== null
  const isAuto = mission.verification_type === 'automatic'
  const isManualOrExternal = mission.verification_type === 'manual' || mission.verification_type === 'external'
  const classMeta = CLASS_META[mission.life_class]

  const router = useRouter()
  const [result, formAction] = useActionState<AchievementActionResult, FormData>(completeAchievementAction, null)
  const [showXp, setShowXp] = useState(false)
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null)
  const [medalUnlockData, setMedalUnlockData] = useState<Medal | null>(null)
  const [selectedMedal, setSelectedMedal] = useState<Medal | null>(null)
  const [optimisticDone, setOptimisticDone] = useState(false)
  const effectiveDone = isCompleted || optimisticDone
  const [showConfirm, setShowConfirm] = useState(false)
  const [hovered, setHovered] = useState(false)
  const prevTsRef = useRef<number | null>(null)
  const xpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadingToastRef = useRef<string | number | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const confirmedRef = useRef(false)

  useEffect(() => {
    if (!result || result.ts === prevTsRef.current) return
    prevTsRef.current = result.ts

    if (loadingToastRef.current !== null) {
      toast.dismiss(loadingToastRef.current)
      loadingToastRef.current = null
    }

    onProcessingChange?.(false)

    if (result.error) {
      setOptimisticDone(false)
      toast.error('No se pudo completar el logro')
      return
    }
    if (result.shieldGranted) playShieldGained()
    if (result.levelUp) setTimeout(() => playLevelUp(), 300)
    toast('Logro completado', { description: `+${result.xpReward} XP`, duration: 2500 })
    if (result.shieldGranted) toast('Escudo ganado', { description: 'Racha de 7 días completada', icon: <ShieldCheck size={16} />, duration: 4000 })
    if (medal) setMedalUnlockData(medal)
    if (result.levelUp) setTimeout(() => setLevelUpData({ level: result.newLevel }), 800)
    router.refresh()
  }, [result, router, medal, onProcessingChange])

  useEffect(() => () => {
    if (xpTimerRef.current) clearTimeout(xpTimerRef.current)
    if (loadingToastRef.current !== null) toast.dismiss(loadingToastRef.current)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    if (confirmedRef.current) {
      confirmedRef.current = false
      return
    }
    if (isManualOrExternal) {
      e.preventDefault()
      setShowConfirm(true)
    } else {
      setOptimisticDone(true)
      setShowXp(true)
      playMissionComplete()
      onProcessingChange?.(true)
      loadingToastRef.current = toast.loading('Calculando recompensa...')
      if (xpTimerRef.current) clearTimeout(xpTimerRef.current)
      xpTimerRef.current = setTimeout(() => setShowXp(false), 650)
    }
  }

  function handleConfirm() {
    setShowConfirm(false)
    if (!avatarConfirmationShown) markAvatarConfirmationShown()
    setOptimisticDone(true)
    setShowXp(true)
    playMissionComplete()
    onProcessingChange?.(true)
    loadingToastRef.current = toast.loading('Calculando recompensa...')
    confirmedRef.current = true
    if (xpTimerRef.current) clearTimeout(xpTimerRef.current)
    xpTimerRef.current = setTimeout(() => setShowXp(false), 650)
    formRef.current?.requestSubmit()
  }

  function handleCardClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button, [type="submit"], form')) return
    window.location.href = `/achievements/${mission.id}`
  }

  const sideBorderColor = hovered
    ? 'color-mix(in srgb, var(--color-text-muted) 40%, transparent)'
    : 'color-mix(in srgb, var(--color-border) 60%, transparent)'

  return (
    <div className={wrapperClass}>
      {medalUnlockData && (
        <MedalUnlockOverlay
          medal={medalUnlockData}
          missionTitle={mission.title}
          onClose={() => setMedalUnlockData(null)}
        />
      )}
      {!medalUnlockData && levelUpData && <LevelUpOverlay level={levelUpData.level} avatarConfig={avatarConfig} onClose={() => setLevelUpData(null)} />}
      {selectedMedal && <MedalDetailModal medal={selectedMedal} onClose={() => setSelectedMedal(null)} />}
      {showConfirm && (
        <AvatarConfirmModal
          username={username}
          avatarConfig={avatarConfig}
          activePack={activePack}
          alreadyShown={avatarConfirmationShown}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <article
        className="bg-surface rounded-card rounded-l-none border border-l-0 p-4 flex flex-col gap-3 cursor-pointer h-full relative"
        style={{
          borderColor: sideBorderColor,
          borderLeft: `3px solid ${classMeta.borderColor}`,
          opacity: effectiveDone ? 0.4 : 1,
          transition: 'opacity 300ms ease, border-color 150ms ease',
        }}
        aria-label={mission.title}
        onClick={handleCardClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = `/achievements/${mission.id}` }}
      >
        {/* Top row: class badge + rarity/diff badge */}
        <div className="flex items-center justify-between gap-2">
          <ClassBadge lifeClass={mission.life_class} />
          {medal ? (
            <span className="text-[10px] font-semibold" style={{ color: RARITY_META[medal.rarity].color }}>
              {RARITY_META[medal.rarity].label}
            </span>
          ) : (
            <DiffBadge difficulty={mission.difficulty} />
          )}
        </div>

        {/* Medal */}
        <button
          type="button"
          onClick={effectiveDone && medal ? (e) => { e.stopPropagation(); setSelectedMedal(medal) } : undefined}
          style={{ cursor: effectiveDone && medal ? 'pointer' : 'default', background: 'none', border: 'none', padding: 0, alignSelf: 'flex-start' }}
          aria-label={effectiveDone && medal ? `Ver detalle de medalla: ${medal.name}` : undefined}
        >
          <HexMedal locked={!effectiveDone} icon={medal?.icon} rarity={medal?.rarity} size={40} />
        </button>

        <p className="text-sm font-semibold text-text-primary leading-snug">{mission.title}</p>

        <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--color-accent)' }}>
          +{mission.xp_reward} XP
        </span>

        {effectiveDone ? (
          <div className="flex items-center gap-1.5">
            <IconCheck />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {completedAt ? formatDate(completedAt) : 'Completado'}
            </span>
          </div>
        ) : isAuto ? (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {autoProgressText(mission.title, totalDaysActive, totalMissionsCount)}
          </p>
        ) : (
          <form ref={formRef} action={formAction} onSubmit={handleSubmit}>
            <input type="hidden" name="missionId"   value={mission.id} />
            <input type="hidden" name="xpReward"    value={mission.xp_reward} />
            <input type="hidden" name="lifeClass"   value={mission.life_class} />
            <input type="hidden" name="difficulty"  value={mission.difficulty} />
            <input type="hidden" name="missionType" value="achievement" />
            <div className="relative">
              <CompleteButton label="Completar" disabled={isProcessing} />
              {showXp && (
                <span className="absolute left-1/2 bottom-full mb-1 text-sm font-bold pointer-events-none whitespace-nowrap" style={{ animation: 'xp-float 650ms ease forwards', color: 'var(--color-accent)' }} aria-hidden>
                  +{mission.xp_reward} XP
                </span>
              )}
            </div>
          </form>
        )}

        <ChevronRight
          size={14}
          strokeWidth={1.75}
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            color: 'var(--color-text-muted)',
            pointerEvents: 'none',
          }}
        />
      </article>
    </div>
  )
}

function bossThreshold(title: string): number {
  const t = title.toLowerCase()
  if (t.includes('imparable'))    return 30
  if (t.includes('gran desafío')) return 14
  return 7
}

// ─── Boss card — full width, prominent ────────────────────────────────────────
function BossCard({ mission, completedAt, currentStreak, medal, avatarConfig, isProcessing, onProcessingChange }: {
  mission: Mission
  completedAt: string | null
  currentStreak: number
  medal: Medal | null
  avatarConfig: AvatarConfig | null
  isProcessing?: boolean
  onProcessingChange?: (v: boolean) => void
}) {
  const classMeta = CLASS_META[mission.life_class]
  const threshold = bossThreshold(mission.title)
  const isUnlocked = currentStreak >= threshold
  const completedThisWeek = completedAt !== null && isWithinLastWeek(completedAt)
  const isLocked = !isUnlocked && !completedThisWeek
  const isActive = isUnlocked && !completedThisWeek

  const [result, formAction] = useActionState<AchievementActionResult, FormData>(completeAchievementAction, null)
  const [showXp, setShowXp] = useState(false)
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null)
  const [optimisticDone, setOptimisticDone] = useState(false)
  const effectiveDone = completedThisWeek || optimisticDone
  const prevTsRef = useRef<number | null>(null)
  const xpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadingToastRef = useRef<string | number | null>(null)

  useEffect(() => {
    if (!result || result.ts === prevTsRef.current) return
    prevTsRef.current = result.ts

    if (loadingToastRef.current !== null) {
      toast.dismiss(loadingToastRef.current)
      loadingToastRef.current = null
    }

    onProcessingChange?.(false)

    if (result.error) {
      setOptimisticDone(false)
      toast.error('No se pudo completar el jefe')
      return
    }
    // Sound already played on click
    if (result.shieldGranted) playShieldGained()
    if (result.levelUp) setTimeout(() => playLevelUp(), 300)
    toast('Jefe derrotado', { description: `+${result.xpReward} XP`, duration: 2500 })
    if (result.shieldGranted) toast('Escudo ganado', { description: 'Racha de 7 días completada', icon: <ShieldCheck size={16} />, duration: 4000 })
    if (result.levelUp) setTimeout(() => setLevelUpData({ level: result.newLevel }), 800)
  }, [result, onProcessingChange])

  useEffect(() => () => {
    if (xpTimerRef.current) clearTimeout(xpTimerRef.current)
    if (loadingToastRef.current !== null) toast.dismiss(loadingToastRef.current)
  }, [])

  function handleSubmit() {
    setOptimisticDone(true)
    setShowXp(true)
    playMissionComplete()
    onProcessingChange?.(true)
    loadingToastRef.current = toast.loading('Calculando recompensa...')
    if (xpTimerRef.current) clearTimeout(xpTimerRef.current)
    xpTimerRef.current = setTimeout(() => setShowXp(false), 650)
  }

  const daysProgress = Math.min(currentStreak, threshold)

  return (
    <>
      {levelUpData && <LevelUpOverlay level={levelUpData.level} avatarConfig={avatarConfig} onClose={() => setLevelUpData(null)} />}
      <article
        className={`rounded-card rounded-l-none overflow-hidden border border-l-0 bg-surface ${isActive && !effectiveDone ? 'boss-border-pulse' : ''}`}
        style={{
          borderColor: isActive && !effectiveDone
            ? 'var(--color-accent)'
            : 'color-mix(in srgb, var(--color-border) 60%, transparent)',
          borderLeft: `3px solid ${classMeta.borderColor}`,
          opacity: effectiveDone ? 0.4 : 1,
        }}
        aria-label={mission.title}
      >
        <div className="h-[2px] w-full" style={{ backgroundColor: classMeta.color }} aria-hidden />

        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-start gap-5">
            <HexMedal locked={isLocked} icon={medal?.icon} rarity={medal?.rarity} size={64} />

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

          <div className="pt-1 border-t border-border/40">
            {effectiveDone ? (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <IconCheck />
                {completedAt ? `Completada — ${formatDate(completedAt)}` : 'Completada'}
              </div>
            ) : isLocked ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Lock size={11} strokeWidth={1.75} aria-hidden />
                    Completa {threshold} días consecutivos para desbloquear
                  </span>
                  <span className="tabular-nums font-medium text-text-primary">{daysProgress}/{threshold} días</span>
                </div>
                <AnimatedBar value={daysProgress / threshold} color="var(--color-accent)" height="h-1.5" />
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>Racha completada — lista para reclamar</span>
                    <span className="tabular-nums font-medium text-text-primary">{threshold}/{threshold} días</span>
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
                    <CompleteButton label="Reclamar recompensa" disabled={isProcessing} />
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
  username,
  avatarConfig,
  activePack,
  avatarConfirmationShown,
  weeklyChallenge,
  weekStart,
  weeklyProgress,
  weeklyIsCompleted,
  weeklyCompletersCount,
}: {
  achievements: Mission[]
  bossMissions: Mission[]
  completedMap: Record<string, string>
  currentStreak: number
  medalsMap: Record<string, Medal>
  totalDaysActive: number
  totalMissionsCount: number
  username: string
  avatarConfig: AvatarConfig | null
  activePack: string | null
  avatarConfirmationShown: boolean
  weeklyChallenge: ChallengeDefinition | null
  weekStart: string
  weeklyProgress: number
  weeklyIsCompleted: boolean
  weeklyCompletersCount: number
}) {
  const [classFilter, setClassFilter] = useState<ClassFilter>('all')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleProcessingChange = useCallback((v: boolean) => setIsProcessing(v), [])

  const sorted = [...achievements]
    .sort((a, b) => {
      const aDone = completedMap[a.id] ? 1 : 0
      const bDone = completedMap[b.id] ? 1 : 0
      if (aDone !== bDone) return aDone - bDone
      return (a.sort_order ?? 999) - (b.sort_order ?? 999)
    })
    .filter(m => classFilter === 'all' || m.life_class === classFilter)

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

          {/* Class filters */}
          <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filtrar por clase">
            {CLASS_FILTER_PILLS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setClassFilter(value)}
                aria-pressed={classFilter === value}
                className="h-8 px-4 rounded-pill text-sm font-medium transition-all duration-150 cursor-pointer"
                style={{
                  backgroundColor: classFilter === value ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: classFilter === value ? 'var(--color-background)' : 'var(--color-text-muted)',
                  border: classFilter === value ? '1px solid transparent' : '1px solid color-mix(in srgb, var(--color-border) 80%, transparent)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
            {sorted.map((m, idx) => {
              const isLast = idx === sorted.length - 1
              const isOdd  = sorted.length % 2 !== 0
              const wrapperClass = isLast && isOdd ? 'col-span-2 md:col-span-1' : undefined
              return (
                <AchievementCard
                  key={m.id}
                  mission={m}
                  completedAt={completedMap[m.id] ?? null}
                  medal={medalsMap[m.id] ?? null}
                  totalDaysActive={totalDaysActive}
                  totalMissionsCount={totalMissionsCount}
                  wrapperClass={wrapperClass}
                  username={username}
                  avatarConfig={avatarConfig}
                  activePack={activePack}
                  avatarConfirmationShown={avatarConfirmationShown}
                  isProcessing={isProcessing}
                  onProcessingChange={handleProcessingChange}
                />
              )
            })}
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
                avatarConfig={avatarConfig}
                isProcessing={isProcessing}
                onProcessingChange={handleProcessingChange}
              />
            ))}
          </div>
        </section>
      )}

      {weeklyChallenge && (
        <WeeklyChallengeSection
          challenge={weeklyChallenge}
          weekStart={weekStart}
          progress={weeklyProgress}
          isCompleted={weeklyIsCompleted}
          completersCount={weeklyCompletersCount}
          avatarConfig={avatarConfig}
        />
      )}

    </div>
  )
}
