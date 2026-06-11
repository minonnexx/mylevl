'use client'

import { useEffect, useRef, useState } from 'react'
import { Swords } from 'lucide-react'
import { HexMedal } from '@/components/ui/HexMedal'
import { AnimatedBar } from '@/components/ui/AnimatedBar'
import { MedalUnlockOverlay } from '@/components/ui/MedalUnlockOverlay'
import { LevelUpOverlay } from '@/components/LevelUpOverlay'
import { RARITY_META } from '@/lib/constants/medals'
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
  completersCount: number
  avatarConfig: AvatarConfig | null
}

function progressLabel(challenge: ChallengeDefinition, progress: number): string {
  if (challenge.type === 'xp') return `${progress}/${challenge.target} XP`
  if (challenge.type === 'streak') return `${progress}/${challenge.target} días`
  return `${progress}/${challenge.target}`
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 flex-shrink-0" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ color: 'var(--color-fisico)' }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function WeeklyChallengeCard({ challenge, weekStart, progress, isCompleted, completersCount, avatarConfig }: Props) {
  const [optimisticDone, setOptimisticDone] = useState(false)
  const effectiveDone = isCompleted || optimisticDone
  const [completersCountState, setCompletersCountState] = useState(completersCount)
  const [medalUnlockData, setMedalUnlockData] = useState<Medal | null>(null)
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null)
  const hasAutoCompleted = useRef(false)

  const isReady = progress >= challenge.target
  const pct = Math.min(progress / challenge.target, 1)
  const epicMeta = RARITY_META['epic']

  useEffect(() => {
    if (!isReady || isCompleted || hasAutoCompleted.current) return
    hasAutoCompleted.current = true

    ;(async () => {
      const result = await completeWeeklyChallenge(weekStart, challenge.key)
      if (!result || result.error || !result.success) return

      setOptimisticDone(true)
      setCompletersCountState(c => c + 1)
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

      <article
        className="rounded-card rounded-l-none overflow-hidden border border-l-0 bg-surface"
        style={{
          borderColor: effectiveDone
            ? 'color-mix(in srgb, var(--color-border) 60%, transparent)'
            : 'var(--color-accent)',
          borderLeft: '3px solid var(--color-accent)',
          opacity: effectiveDone ? 0.4 : 1,
          transition: 'opacity 300ms ease, border-color 300ms ease',
        }}
        aria-label={challenge.title}
      >
        <div className="h-[2px] w-full" style={{ backgroundColor: 'var(--color-accent)' }} aria-hidden />

        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-start gap-5">
            <HexMedal
              locked={!effectiveDone}
              icon={challenge.medal_icon}
              rarity="epic"
              size={64}
            />

            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex text-xs font-semibold px-2.5 py-1 rounded-pill border"
                  style={{
                    color: epicMeta.color,
                    backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--color-accent) 25%, transparent)',
                  }}
                >
                  Desafío semanal
                </span>
                <span className="text-[10px] font-semibold" style={{ color: epicMeta.color }}>
                  {epicMeta.label}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-text-primary leading-snug">{challenge.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                {challenge.description}
              </p>
            </div>

            <div className="flex-shrink-0 text-right">
              <p className="text-3xl font-bold tabular-nums" style={{ color: 'var(--color-accent)' }}>
                +{challenge.xp_reward}
              </p>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>XP</p>
            </div>
          </div>

          <div className="pt-1 border-t border-border/40">
            {effectiveDone ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <IconCheck />
                  Completado esta semana
                </div>
                {completersCountState > 0 && (
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {completersCountState} {completersCountState === 1 ? 'jugador lo completó' : 'jugadores lo completaron'} esta semana
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <span>Progreso</span>
                  <span className="tabular-nums font-medium" style={{ color: 'var(--color-text-primary)' }}>
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
      </article>
    </>
  )
}

export function WeeklyChallengeSection({ challenge, weekStart, progress, isCompleted, completersCount, avatarConfig }: Props) {
  return (
    <section aria-labelledby="section-weekly-challenge" className="flex flex-col gap-4">
      <div className="border-b border-border/40 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--color-text-muted)' }}>
            <Swords size={15} strokeWidth={1.75} aria-hidden />
          </span>
          <h2 className="text-sm font-semibold text-text-primary" id="section-weekly-challenge">
            Desafío semanal
          </h2>
        </div>
        <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
          {isCompleted ? '1/1' : '0/1'}
        </span>
      </div>
      <WeeklyChallengeCard
        challenge={challenge}
        weekStart={weekStart}
        progress={progress}
        isCompleted={isCompleted}
        completersCount={completersCount}
        avatarConfig={avatarConfig}
      />
    </section>
  )
}
