'use client'

import type { Mission } from '@/types/supabase'
import { FeaturedMissionCard } from './FeaturedMissionCard'

export function MissionAreaWrapper({ missions }: { missions: Mission[] }) {
  if (missions.length === 0) return null
  return (
    <div className="flex flex-col gap-3">
      {missions.map(m => (
        <FeaturedMissionCard key={m.id} mission={m} />
      ))}
    </div>
  )
}
