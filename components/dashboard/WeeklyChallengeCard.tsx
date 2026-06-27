'use client'

import { useEffect, useRef, useState } from 'react'
import { Swords } from 'lucide-react'
import { AnimatedBar } from '@/components/ui/AnimatedBar'
import { MedalUnlockOverlay } from '@/components/ui/MedalUnlockOverlay'
import { LevelUpOverlay } from '@/components/LevelUpOverlay'
import { toast } from 'sonner'
import { playLevelUp, playMissionComplete } from '@/lib/sounds'
import { completeWeeklyChallenge } from '@/app/dashboard/actions'
import type { AvatarConfig, Medal } from '@/types/supabase'
import type { ChallengeDefinition } from '@/lib/constants/challenges'

interface Props {
  challenge: ChallengeDefinition
  weekStart: string
  progress: number
  isCompleted: boolean
  avatarConfig: AvatarConfig | null
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 flex-shrink-0" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ color: 'var(--color-fisico)' }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function progressLabel(challenge: ChallengeDefinition, progress: number): string {
  if (challenge.type === 'xp') return `${progress}/${challenge.target} XP`
  if (challenge.type === 'streak') return `${progress}/${challenge.target} días`
  return `${progress}/${challenge.target}`
}

export function WeeklyChallengeCard({ challenge, weekStart, progress, isCompleted, avatarConfig }: Props) {
  const [optimisticDone, setOptimisticDone] = useState(false)
  const effectiveDone = isCompleted || optimisticDone
  const [medalUnlockData, setMedalUnlockData] = useState<Medal | null>(null)
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null)
  const hasAutoCompleted = useRef(false)

  const isReady = progress >= challenge.target

  useEffect(() => {
    if (!isReady || isCompleted || hasAutoCompleted.current) return
    hasAutoCompleted.current = true

    ;(async () => {
      const result = await completeWeeklyChallenge(weekStart, challenge.key)
      if (!result || result.error || !result.success) return

      setOptimisticDone(true)
      playMissionComplete()
      toast('Desafío semanal completado', { description: `+${result.xpReward} XP`, duration: 3000 })

      const medal: Medal = {
        id: 'weekly-challenge',
        mission_id: 'weekly-challenge',
        name: result.medalName,
        icon: result.medalIcon,
        rarity: 'epic',
        unlock_percentage: 0,
        created_at: new Date().toISOString(),
      }
      setMedalUnlockData(medal)

      if (result.levelUp) {
        setTimeout(() => setLevelUpData({ level: result.newLevel }), 800)
      }
    })()
  }, [isReady, isCompleted, weekStart, challenge.key])

  const pct = Math.min(progress / challenge.target, 1)

  return (
    <>
      {medalUnlockData && (
        <MedalUnlockOverlay
          medal={medalUnlockData}
          missionTitle={challenge.title}
          onClose={() => setMedalUnlockData(null)}
        />
      )}
      {!medalUnlockData && levelUpData && (
        <LevelUpOverlay
          level={levelUpData.level}
          avatarConfig={avatarConfig}
          onClose={() => setLevelUpData(null)}
        />
      )}

      <div className="flex flex-col gap-3">
        <div className="border-b border-border/40 pb-2 flex items-center gap-2">
          <Swords size={14} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} aria-hidden />
          <h2 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
            Desafío semanal
          </h2>
        </div>

        <div
          className="rounded-card rounded-l-none border border-l-0 p-4 flex flex-col gap-3"
          style={{
            borderLeft: '3px solid var(--color-accent)',
            borderColor: 'color-mix(in srgb, var(--color-border) 60%, transparent)',
            opacity: effectiveDone ? 0.4 : 1,
            transition: 'opacity 300ms ease',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary leading-snug">{challenge.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                {challenge.description}
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-lg font-black tabular-nums" style={{ color: 'var(--color-accent)' }}>
                +{challenge.xp_reward}
              </p>
              <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>XP</p>
            </div>
          </div>

          {effectiveDone ? (
            <div className="flex items-center gap-1.5 pt-1 border-t border-border/30">
              <IconCheck />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Completado esta semana
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 pt-1 border-t border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Progreso</span>
                <span className="text-xs tabular-nums font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {progressLabel(challenge, progress)}
                </span>
              </div>
              <AnimatedBar
                value={pct}
                color="var(--color-accent)"
                height="h-1.5"
                aria-label={`Progreso del desafío semanal: ${progressLabel(challenge, progress)}`}
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={challenge.target}
                role="progressbar"
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
