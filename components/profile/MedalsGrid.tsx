'use client'

import { useState } from 'react'
import { HexMedal } from '@/components/ui/HexMedal'
import { MedalDetailModal } from '@/components/ui/MedalDetailModal'
import type { Medal } from '@/types/supabase'

export function MedalsGrid({ medals }: { medals: Medal[] }) {
  const [selected, setSelected] = useState<Medal | null>(null)

  return (
    <>
      {selected && <MedalDetailModal medal={selected} onClose={() => setSelected(null)} />}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
        {medals.map(medal => (
          <button
            key={medal.id}
            type="button"
            onClick={() => setSelected(medal)}
            className="flex flex-col items-center gap-1.5 cursor-pointer"
            title={medal.name}
            aria-label={`Ver detalle de medalla: ${medal.name}`}
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
            <HexMedal size={36} icon={medal.icon} rarity={medal.rarity} />
            <span className="text-[10px] text-text-muted text-center leading-tight truncate w-full">
              {medal.name}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}
