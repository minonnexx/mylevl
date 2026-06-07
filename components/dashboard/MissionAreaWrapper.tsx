'use client'

import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'
import type { Mission } from '@/types/supabase'
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
}: {
  missions: Mission[]
  showShieldNotification: boolean
}) {
  const [result, formAction] = useActionState<MissionActionResult, FormData>(completeMission, null)
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null)
  const [recapData, setRecapData] = useState<DaySummary | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showShieldBanner, setShowShieldBanner] = useState(showShieldNotification)
  const prevTsRef = useRef<number>(-1)
  const pendingRecapRef = useRef<DaySummary | null>(null)

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
        setShowConfetti(true)
        const delay = result.levelUp ? 500 : 0
        setTimeout(() => setRecapData(result.daySummary!), delay)
      }
    }
  }, [result])

  return (
    <>
      {showConfetti && <Confetti key={result?.ts} />}
      {showShieldBanner && (
        <ShieldUsedBanner onDismiss={handleShieldDismiss} />
      )}
      {levelUpData && (
        <LevelUpOverlay
          level={levelUpData.level}
          onClose={handleLevelUpClose}
        />
      )}
      {recapData && (
        <DailyRecapOverlay
          daySummary={recapData}
          onClose={handleRecapClose}
        />
      )}
      {missions.length > 0 && (
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none scrollbar-hide pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          {missions.map(m => (
            <div key={m.id} className="w-[calc(100vw-32px)] md:min-w-0 md:w-auto flex-shrink-0 snap-start">
              <FeaturedMissionCard mission={m} formAction={formAction} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
