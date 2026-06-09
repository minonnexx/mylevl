'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Star, ShieldCheck } from 'lucide-react'
import { HexMedal } from '@/components/ui/HexMedal'
import { AnimatedBar } from '@/components/ui/AnimatedBar'
import { CompleteButton } from '@/components/dashboard/CompleteButton'
import { LevelUpOverlay } from '@/components/LevelUpOverlay'
import { AvatarConfirmModal } from '@/components/achievements/AvatarConfirmModal'
import { RARITY_META } from '@/lib/constants/medals'
import { toast } from 'sonner'
import { playLevelUp, playMissionComplete, playShieldGained } from '@/lib/sounds'
import { completeAchievementAction, type AchievementActionResult } from '@/app/achievements/actions'
import type { AvatarConfig, Medal, Mission, Rarity } from '@/types/supabase'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function bossThreshold(title: string): number {
  const t = title.toLowerCase()
  if (t.includes('imparable'))    return 30
  if (t.includes('gran desafío')) return 14
  return 7
}

function progressForAchievement(
  title: string,
  totalDaysActive: number,
  totalMissionsCount: number,
): { value: number; max: number; label: string } | null {
  const t = title.toLowerCase()
  if (t.includes('30 días activos'))  return { value: totalDaysActive, max: 30, label: 'días activos' }
  if (t.includes('365 días activos')) return { value: totalDaysActive, max: 365, label: 'días activos' }
  if (t.includes('100 misiones'))     return { value: totalMissionsCount, max: 100, label: 'misiones completadas' }
  return null
}

export default function AchievementDetailView({
  mission,
  medal,
  completedAt,
  totalDaysActive,
  totalMissionsCount,
  currentStreak,
  username,
  avatarConfig,
}: {
  mission: Mission
  medal: Medal | null
  completedAt: string | null
  totalDaysActive: number
  totalMissionsCount: number
  currentStreak: number
  username: string
  avatarConfig: AvatarConfig | null
}) {
  const isCompleted = completedAt !== null
  const isBoss = mission.type === 'boss'
  const rarity = medal?.rarity as Rarity | undefined

  const [result, formAction] = useActionState<AchievementActionResult, FormData>(completeAchievementAction, null)
  const [showXp, setShowXp] = useState(false)
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null)
  const [completing, setCompleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const prevTsRef = useRef<number | null>(null)
  const xpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!result || result.ts === prevTsRef.current) return
    prevTsRef.current = result.ts
    if (result.error) { toast.error('No se pudo completar'); return }
    playMissionComplete()
    if (result.shieldGranted) playShieldGained()
    if (result.levelUp) setTimeout(() => playLevelUp(), 300)
    toast(isBoss ? 'Jefe derrotado' : 'Logro completado', { description: `+${result.xpReward} XP`, duration: 2500 })
    if (result.shieldGranted) toast('Escudo ganado', { description: 'Racha de 7 días completada', icon: <ShieldCheck size={16} />, duration: 4000 })
    if (result.levelUp) setTimeout(() => setLevelUpData({ level: result.newLevel }), 800)
  }, [result, isBoss])

  useEffect(() => () => { if (xpTimerRef.current) clearTimeout(xpTimerRef.current) }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setShowConfirm(true)
  }

  function handleConfirm() {
    setShowConfirm(false)
    setCompleting(true)
    setShowXp(true)
    if (xpTimerRef.current) clearTimeout(xpTimerRef.current)
    xpTimerRef.current = setTimeout(() => setShowXp(false), 650)
    formRef.current?.requestSubmit()
  }

  const progressAchievement = !isBoss
    ? progressForAchievement(mission.title, totalDaysActive, totalMissionsCount)
    : null

  const threshold = isBoss ? bossThreshold(mission.title) : 0
  const bossProgress = isBoss
    ? { value: Math.min(currentStreak, threshold), max: threshold, label: 'días de racha' }
    : null

  const showCompleteButton = !isCompleted && !completing && (
    mission.verification_type === 'manual' || mission.verification_type === 'external'
  )

  return (
    <>
      {levelUpData && <LevelUpOverlay level={levelUpData.level} onClose={() => setLevelUpData(null)} />}
      {showConfirm && (
        <AvatarConfirmModal
          username={username}
          avatarConfig={avatarConfig}
          activePack={null}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="max-w-lg mx-auto flex flex-col gap-8">

        {/* Back button */}
        <div>
          <Link
            href="/achievements"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={16} strokeWidth={2} />
            Logros
          </Link>
        </div>

        {/* Medal + name */}
        <div className="flex flex-col items-center gap-4 text-center">
          <HexMedal
            locked={!isCompleted && !completing}
            icon={medal?.icon}
            rarity={rarity}
            size={96}
          />
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-semibold text-text-primary">{mission.title}</h1>
            {rarity && (
              <span className="text-sm font-semibold" style={{ color: RARITY_META[rarity].color }}>
                {RARITY_META[rarity].label}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <Star size={14} strokeWidth={1.75} style={{ color: 'var(--color-accent)' }} aria-hidden />
              <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-accent)' }}>
                +{mission.xp_reward} XP
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div
          className="rounded-card border p-6 flex flex-col gap-5"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'color-mix(in srgb, var(--color-border) 60%, transparent)' }}
        >

          {/* Completed state */}
          {(isCompleted || completing) ? (
            <div className="flex flex-col items-center gap-2 text-center py-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-fisico)' }}>
                ¡Ya tienes esta medalla!
              </p>
              {completedAt && (
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Conseguida el {formatDate(completedAt)}
                </p>
              )}
            </div>
          ) : null}

          {/* How to unlock */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-text-primary">Cómo desbloquearla</h2>

            {mission.description && (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                {mission.description}
              </p>
            )}

            {mission.verification_type === 'automatic' && (
              <>
                {progressAchievement && !isCompleted && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <span>Progreso actual</span>
                      <span className="font-medium tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                        {progressAchievement.value}/{progressAchievement.max} {progressAchievement.label}
                      </span>
                    </div>
                    <AnimatedBar value={progressAchievement.value / progressAchievement.max} color="var(--color-accent)" height="h-2" />
                  </div>
                )}
                {bossProgress && !isCompleted && !completing && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <span>Racha actual</span>
                      <span className="font-medium tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                        {bossProgress.value}/{bossProgress.max} {bossProgress.label}
                      </span>
                    </div>
                    <AnimatedBar value={bossProgress.value / bossProgress.max} color="var(--color-accent)" height="h-2" />
                  </div>
                )}
                {!progressAchievement && !bossProgress && (
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Se desbloquea automáticamente al cumplir la condición.
                  </p>
                )}
              </>
            )}

            {mission.verification_type === 'manual' && !isCompleted && (
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Completa esta misión cuando la hayas logrado en la vida real y márcala como completada.
              </p>
            )}

            {mission.verification_type === 'external' && !isCompleted && (
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Este logro requiere verificación externa. Complétalo cuando puedas demostrarlo.
              </p>
            )}
          </div>

          {/* Complete button */}
          {showCompleteButton && (
            <form ref={formRef} action={formAction} onSubmit={handleSubmit}>
              <input type="hidden" name="missionId"   value={mission.id} />
              <input type="hidden" name="xpReward"    value={mission.xp_reward} />
              <input type="hidden" name="lifeClass"   value={mission.life_class} />
              <input type="hidden" name="difficulty"  value={mission.difficulty} />
              <input type="hidden" name="missionType" value={mission.type} />
              <div className="relative">
                <CompleteButton label="Marcar como completado" />
                {showXp && (
                  <span
                    className="absolute left-1/2 bottom-full mb-1 text-sm font-bold pointer-events-none whitespace-nowrap"
                    style={{ animation: 'xp-float 650ms ease forwards', color: 'var(--color-accent)' }}
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
    </>
  )
}
