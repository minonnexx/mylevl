'use client'

import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import type { Mission } from '@/types/supabase'
import type { DaySummary } from '@/lib/recap'
import { FeaturedMissionCard } from './FeaturedMissionCard'
import { LevelUpOverlay } from '@/components/LevelUpOverlay'
import { DailyRecapOverlay } from '@/components/dashboard/DailyRecapOverlay'
import { ShieldToast } from '@/components/ui/ShieldToast'
import { completeMission, type MissionActionResult } from '@/app/dashboard/actions'

export function MissionAreaWrapper({ missions }: { missions: Mission[] }) {
  const [result, formAction] = useActionState<MissionActionResult, FormData>(completeMission, null)
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null)
  const [showShieldToast, setShowShieldToast] = useState(false)
  const [recapData, setRecapData] = useState<DaySummary | null>(null)
  const prevTsRef = useRef<number | null>(null)

  const handleRecapClose = useCallback(() => setRecapData(null), [])

  useEffect(() => {
    if (!result || result.ts === prevTsRef.current) return
    prevTsRef.current = result.ts
    if (result.levelUp) setLevelUpData({ level: result.newLevel })
    if (result.shieldGranted) {
      setShowShieldToast(true)
      setTimeout(() => setShowShieldToast(false), 4000)
    }
    if (result.allMissionsCompleted && result.daySummary) {
      const summary = result.daySummary
      const delay = result.levelUp ? 500 : 0
      setTimeout(() => setRecapData(summary), delay)
    }
  }, [result])

  return (
    <>
      {levelUpData && (
        <LevelUpOverlay
          level={levelUpData.level}
          onClose={() => setLevelUpData(null)}
        />
      )}
      {recapData && (
        <DailyRecapOverlay
          daySummary={recapData}
          onClose={handleRecapClose}
        />
      )}
      <ShieldToast show={showShieldToast} />
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
