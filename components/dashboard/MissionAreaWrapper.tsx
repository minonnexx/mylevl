'use client'

import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'
import type { AvatarConfig, Mission } from '@/types/supabase'
import type { DaySummary } from '@/lib/recap'
import { FeaturedMissionCard } from './FeaturedMissionCard'
import { LevelUpOverlay } from '@/components/LevelUpOverlay'
import { DailyRecapOverlay } from '@/components/dashboard/DailyRecapOverlay'
import { ShieldUsedBanner } from '@/components/dashboard/ShieldUsedBanner'
import { Confetti } from '@/components/ui/Confetti'
import { completeMission, markShieldNotificationSeen, type MissionActionResult } from '@/app/dashboard/actions'
import { playLevelUp, playMissionComplete, playShieldGained, playDayComplete } from '@/lib/sounds'

function getTodayKey(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

export function MissionAreaWrapper({
  missions,
  showShieldNotification,
  avatarConfig,
}: {
  missions: Mission[]
  showShieldNotification: boolean
  avatarConfig: AvatarConfig | null
}) {
  const [result, formAction] = useActionState<MissionActionResult, FormData>(completeMission, null)
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null)
  const [recapData, setRecapData] = useState<DaySummary | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showShieldBanner, setShowShieldBanner] = useState(showShieldNotification)
  const [optimisticCompletedIds, setOptimisticCompletedIds] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const prevTsRef = useRef<number>(-1)
  const pendingRecapRef = useRef<DaySummary | null>(null)
  const loadingToastRef = useRef<string | number | null>(null)
  const pendingMissionIdRef = useRef<string | null>(null)

  const handleShieldDismiss = useCallback(async () => {
    setShowShieldBanner(false)
    playShieldGained()
    await markShieldNotificationSeen()
  }, [])

  const handleRecapClose = useCallback(() => setRecapData(null), [])

  const handleLevelUpClose = useCallback(() => {
    setLevelUpData(null)
    if (pendingRecapRef.current) {
      setRecapData(pendingRecapRef.current)
      pendingRecapRef.current = null
    }
  }, [])

  const handleOptimisticComplete = useCallback((missionId: string) => {
    playMissionComplete()
    setOptimisticCompletedIds(prev => new Set(prev).add(missionId))
    pendingMissionIdRef.current = missionId
    loadingToastRef.current = toast.loading('Calculando recompensa...')
    setIsProcessing(true)
  }, [])

  useEffect(() => {
    return () => {
      if (loadingToastRef.current !== null) toast.dismiss(loadingToastRef.current)
    }
  }, [])

  useEffect(() => {
    if (!result || result.ts === prevTsRef.current) return
    prevTsRef.current = result.ts

    if (loadingToastRef.current !== null) {
      toast.dismiss(loadingToastRef.current)
      loadingToastRef.current = null
    }

    setIsProcessing(false)

    if (result.error) {
      setOptimisticCompletedIds(prev => {
        const next = new Set(prev)
        if (pendingMissionIdRef.current) next.delete(pendingMissionIdRef.current)
        return next
      })
      toast.error('No se pudo completar la misión', { description: 'Inténtalo de nuevo' })
      return
    }

    // Sonido ya reproducido al hacer clic — solo efectos secundarios aquí
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

    // Overlays
    if (result.levelUp) setTimeout(() => setLevelUpData({ level: result.newLevel }), 800)

    if (result.allMissionsCompleted && result.daySummary) {
      const key = `recap-shown-${getTodayKey()}`
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        setShowConfetti(true)
        const delay = result.levelUp ? 500 : 0
        setTimeout(() => setRecapData(result.daySummary!), delay)
      }
    }
  }, [result])

  const visibleMissions = missions.filter(m => !optimisticCompletedIds.has(m.id))

  return (
    <>
      {showConfetti && <Confetti key={result?.ts} />}
      {showShieldBanner && (
        <ShieldUsedBanner onDismiss={handleShieldDismiss} />
      )}
      {levelUpData && (
        <LevelUpOverlay
          level={levelUpData.level}
          avatarConfig={avatarConfig}
          onClose={handleLevelUpClose}
        />
      )}
      {recapData && (
        <DailyRecapOverlay
          daySummary={recapData}
          avatarConfig={avatarConfig}
          onClose={handleRecapClose}
        />
      )}
      {visibleMissions.length > 0 && (
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none scrollbar-hide pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          {visibleMissions.map(m => (
            <div key={m.id} className="w-[calc(100vw-32px)] md:min-w-0 md:w-auto flex-shrink-0 snap-start">
              <FeaturedMissionCard
                mission={m}
                formAction={formAction}
                onOptimisticComplete={handleOptimisticComplete}
                isProcessing={isProcessing}
              />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
