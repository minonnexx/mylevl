'use client'

import { useEffect } from 'react'
import { HexMedal } from '@/components/ui/HexMedal'
import { RARITY_META } from '@/lib/constants/medals'
import type { Medal } from '@/types/supabase'

export function MedalDetailModal({
  medal,
  onClose,
}: {
  medal: Medal
  onClose: () => void
}) {
  const rarityMeta = RARITY_META[medal.rarity]

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <div
        className="rounded-card p-6 flex flex-col items-center gap-4 text-center max-w-[280px] w-full"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: `1px solid color-mix(in srgb, ${rarityMeta.color} 40%, transparent)`,
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-label={`Detalle de medalla: ${medal.name}`}
      >
        <HexMedal icon={medal.icon} rarity={medal.rarity} size={56} />

        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-semibold text-text-primary leading-snug">{medal.name}</p>
          <span className="text-xs font-semibold" style={{ color: rarityMeta.color }}>
            {rarityMeta.label}
          </span>
          {medal.unlock_percentage > 0 && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {medal.unlock_percentage}% de jugadores la tienen
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
