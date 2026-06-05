'use client'

import type { Mission } from '@/types/supabase'
import { FeaturedMissionCard } from './FeaturedMissionCard'

export function MissionAreaWrapper({ missions }: { missions: Mission[] }) {
  if (missions.length === 0) return null
  return (
    <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none scrollbar-hide pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
      {missions.map(m => (
        <div key={m.id} className="min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink snap-start">
          <FeaturedMissionCard mission={m} />
        </div>
      ))}
    </div>
  )
}
