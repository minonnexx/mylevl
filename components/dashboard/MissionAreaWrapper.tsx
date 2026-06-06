'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import type { Mission } from '@/types/supabase'
import { FeaturedMissionCard } from './FeaturedMissionCard'
import { LevelUpOverlay } from '@/components/LevelUpOverlay'
import { ShieldToast } from '@/components/ui/ShieldToast'
import { completeMission, type MissionActionResult } from '@/app/dashboard/actions'

export function MissionAreaWrapper({ missions }: { missions: Mission[] }) {
  const [result, formAction] = useActionState<MissionActionResult, FormData>(completeMission, null)
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null)
  const [showShieldToast, setShowShieldToast] = useState(false)
  const prevTsRef = useRef<number | null>(null)

  useEffect(() => {
    if (!result || result.ts === prevTsRef.current) return
    prevTsRef.current = result.ts
    if (result.levelUp) setLevelUpData({ level: result.newLevel })
    if (result.shieldGranted) {
      setShowShieldToast(true)
      setTimeout(() => setShowShieldToast(false), 4000)
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
