'use client'

import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import { Flame, Shield, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { CLASS_META } from '@/lib/constants/classes'
import type { AvatarConfig, CustomMission, CustomMissionDifficulty, Medal } from '@/types/supabase'
import { completeCustomMissionAction, type MissionActionResult, type MilestoneResult } from '@/app/missions/actions'
import { CompleteButton } from '@/components/dashboard/CompleteButton'
import { LevelUpOverlay } from '@/components/LevelUpOverlay'
import { MedalUnlockOverlay } from '@/components/ui/MedalUnlockOverlay'
import { playLevelUp, playMissionComplete, playShieldGained } from '@/lib/sounds'

type CustomMissionWithCompletion = CustomMission & { completed_today: boolean; streak: number }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DIFF_LABEL: Record<CustomMissionDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Medio',
  hard: 'Difícil',
}

const DIFF_BADGE_CLASS: Record<CustomMissionDifficulty, string> = {
  easy: 'text-fisico bg-fisico/8 border-fisico/20',
  medium: 'text-disciplina bg-disciplina/8 border-disciplina/20',
  hard: 'text-error bg-error/8 border-error/20',
}

function getDaysLabel(endsAt: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(endsAt + 'T00:00:00')
  const days = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86_400_000))
  if (days === 0) return 'Último día'
  if (days === 1) return '1 día restante'
  return `${days} días restantes`
}

function makeMedal(m: NonNullable<MilestoneResult>): Medal {
  return { id: '', mission_id: '', name: m.medalName, icon: m.medalIcon, rarity: 'epic', unlock_percentage: 0, created_at: '' }
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 flex-shrink-0" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ color: 'var(--color-fisico)' }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function CustomMissionDashboardCard({
  mission,
  isProcessing,
  onProcessingChange,
  avatarConfig,
}: {
  mission: CustomMissionWithCompletion
  isProcessing: boolean
  onProcessingChange: (v: boolean) => void
  avatarConfig: AvatarConfig | null
}) {
  const [optimisticDone, setOptimisticDone] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null)
  const [milestoneData, setMilestoneData] = useState<MilestoneResult | null>(null)
  const [currentStreak, setCurrentStreak] = useState(mission.streak)
  const effectiveDone = mission.completed_today || optimisticDone
  const prevTsRef = useRef<number | null>(null)
  const xpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadingToastRef = useRef<string | number | null>(null)
  const pendingMilestoneRef = useRef<MilestoneResult | null>(null)
  const classMeta = CLASS_META[mission.life_class]

  const [result, formAction] = useActionState<MissionActionResult, FormData>(completeCustomMissionAction, null)

  useEffect(() => {
    if (!result || result.ts === prevTsRef.current) return
    prevTsRef.current = result.ts

    if (loadingToastRef.current !== null) {
      toast.dismiss(loadingToastRef.current)
      loadingToastRef.current = null
    }
    onProcessingChange(false)

    if (result.error) {
      setOptimisticDone(false)
      toast.error('No se pudo completar la misión', { description: 'Inténtalo de nuevo' })
      return
    }

    if (result.streak !== undefined) setCurrentStreak(result.streak)
    if (result.shieldGranted) playShieldGained()
    if (result.levelUp) setTimeout(() => playLevelUp(), 300)

    toast('Misión completada', { description: `+${result.xpReward} XP`, duration: 2500 })
    if (result.shieldGranted) {
      toast('Escudo ganado', {
        description: 'Racha de 7 días completada',
        icon: <ShieldCheck size={16} />,
        duration: 4000,
      })
    }
    if (result.milestone) {
      toast(`¡Hito desbloqueado!`, { description: result.milestone.medalName, duration: 3000 })
    }

    if (result.levelUp) {
      if (result.milestone) pendingMilestoneRef.current = result.milestone
      setTimeout(() => setLevelUpData({ level: result.newLevel }), 800)
    } else if (result.milestone) {
      setTimeout(() => setMilestoneData(result.milestone!), 500)
    }
  }, [result, onProcessingChange])

  useEffect(() => {
    return () => {
      if (xpTimerRef.current) clearTimeout(xpTimerRef.current)
      if (loadingToastRef.current !== null) toast.dismiss(loadingToastRef.current)
    }
  }, [])

  function handleSubmit() {
    setOptimisticDone(true)
    setShowXp(true)
    playMissionComplete()
    onProcessingChange(true)
    loadingToastRef.current = toast.loading('Calculando recompensa...')
    if (xpTimerRef.current) clearTimeout(xpTimerRef.current)
    xpTimerRef.current = setTimeout(() => setShowXp(false), 650)
  }

  return (
    <div className="h-full">
      {levelUpData && (
        <LevelUpOverlay
          level={levelUpData.level}
          avatarConfig={avatarConfig}
          onClose={() => {
            setLevelUpData(null)
            if (pendingMilestoneRef.current) {
              setMilestoneData(pendingMilestoneRef.current)
              pendingMilestoneRef.current = null
            }
          }}
        />
      )}
      {milestoneData && (
        <MedalUnlockOverlay
          medal={makeMedal(milestoneData)}
          missionTitle={milestoneData.medalName}
          onClose={() => setMilestoneData(null)}
        />
      )}
      <article
        className="bg-surface rounded-card rounded-l-none border border-l-0 border-border/60 p-4 flex flex-col gap-3 h-full"
        style={{
          borderLeft: `3px solid ${classMeta.borderColor}`,
          opacity: effectiveDone ? 0.4 : 1,
          transition: 'opacity 300ms ease',
        }}
        aria-label={mission.title}
      >
        {/* Top row */}
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-pill ${classMeta.badgeClasses}`}>
            {classMeta.label}
          </span>
          <span className={`inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-pill border ${DIFF_BADGE_CLASS[mission.difficulty]}`}>
            {DIFF_LABEL[mission.difficulty]}
          </span>
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-text-primary leading-snug flex-1">{mission.title}</p>

        {/* Streak + strict mode */}
        <div className="flex flex-col gap-1">
          {currentStreak > 0 && (
            <div className="flex items-center gap-1.5">
              <Flame size={12} style={{ color: 'var(--color-disciplina)' }} aria-hidden />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {currentStreak} {currentStreak === 1 ? 'día seguido' : 'días seguidos'}
              </span>
            </div>
          )}
          {mission.strict_mode && (
            <div className="flex items-center gap-1.5">
              <Shield size={12} style={{ color: 'var(--color-disciplina)' }} aria-hidden />
              <span className="text-xs font-medium" style={{ color: 'var(--color-disciplina)' }}>
                Modo estricto
              </span>
            </div>
          )}
        </div>

        {/* XP + days remaining */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--color-accent)' }}>
            +{mission.xp_reward} XP
          </span>
          {mission.ends_at && !effectiveDone && (
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {getDaysLabel(mission.ends_at)}
            </span>
          )}
        </div>

        {/* Action */}
        {effectiveDone ? (
          <div className="flex items-center gap-1.5">
            <IconCheck />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Completada hoy</span>
          </div>
        ) : (
          <form action={formAction} onSubmit={handleSubmit}>
            <input type="hidden" name="customMissionId" value={mission.id} />
            <input type="hidden" name="xpReward"        value={mission.xp_reward} />
            <input type="hidden" name="lifeClass"       value={mission.life_class} />
            <input type="hidden" name="difficulty"      value={mission.difficulty} />
            <div className="relative">
              <CompleteButton label="Completar" disabled={isProcessing} />
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
      </article>
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function CustomMissionsDashboardSection({
  customMissions,
  avatarConfig,
}: {
  customMissions: CustomMissionWithCompletion[]
  avatarConfig: AvatarConfig | null
}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const handleProcessingChange = useCallback((v: boolean) => setIsProcessing(v), [])

  if (customMissions.length === 0) return null

  return (
    <section aria-labelledby="dash-custom-missions-title" className="flex flex-col gap-4">
      <div className="border-b border-border/40 pb-2">
        <h2
          id="dash-custom-missions-title"
          className="text-[11px] font-medium uppercase tracking-wider"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Mis misiones
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
        {customMissions.map((mission, idx) => {
          const isLast = idx === customMissions.length - 1
          const isOdd  = customMissions.length % 2 !== 0
          const wrapperClass = isLast && isOdd ? 'col-span-2 md:col-span-1' : undefined
          return (
            <div key={mission.id} className={wrapperClass}>
              <CustomMissionDashboardCard
                mission={mission}
                isProcessing={isProcessing}
                onProcessingChange={handleProcessingChange}
                avatarConfig={avatarConfig}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
