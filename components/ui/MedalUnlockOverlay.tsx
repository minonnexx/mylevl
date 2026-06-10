'use client'

import { useEffect } from 'react'
import { HexMedal } from '@/components/ui/HexMedal'
import { RARITY_META } from '@/lib/constants/medals'
import type { Medal } from '@/types/supabase'

export function MedalUnlockOverlay({
  medal,
  missionTitle,
  onClose,
}: {
  medal: Medal
  missionTitle: string
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
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="rounded-card p-8 flex flex-col items-center gap-5 text-center max-w-xs w-full"
        style={{ backgroundColor: 'var(--color-surface)', border: `1px solid ${rarityMeta.color}` }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-label="Medalla desbloqueada"
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          Medalla desbloqueada
        </p>

        <div style={{ animation: 'medal-pop 400ms cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
          <HexMedal icon={medal.icon} rarity={medal.rarity} size={80} />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <h2 className="text-lg font-semibold text-text-primary leading-snug">{missionTitle}</h2>
          <span className="text-sm font-semibold" style={{ color: rarityMeta.color }}>
            {rarityMeta.label}
          </span>
          {medal.unlock_percentage > 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Solo el {medal.unlock_percentage}% de jugadores tiene esta medalla
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-component text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-background)' }}
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
