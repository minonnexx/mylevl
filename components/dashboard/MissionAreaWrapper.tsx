'use client'

import { useState } from 'react'
import type { Mission } from '@/types/supabase'
import { FeaturedMissionCard } from './FeaturedMissionCard'
import { LevelUpOverlay } from '@/components/LevelUpOverlay'

export function MissionAreaWrapper({ missions }: { missions: Mission[] }) {
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null)

  if (missions.length === 0) return null
  return (
    <>
      {levelUpData && (
        <LevelUpOverlay
          level={levelUpData.level}
          onClose={() => setLevelUpData(null)}
        />
      )}
      <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none scrollbar-hide pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
        {missions.map(m => (
          <div key={m.id} className="w-[calc(100vw-32px)] md:min-w-0 md:w-auto flex-shrink-0 snap-start">
            <FeaturedMissionCard mission={m} onLevelUp={(level) => setLevelUpData({ level })} />
          </div>
        ))}
      </div>
    </>
  )
}
