'use client'

import { useState, useTransition } from 'react'
import { motion } from 'motion/react'
import { Shield } from 'lucide-react'
import { activateShieldAction } from '@/app/actions/activateShield'

const MAX_SHIELDS = 3

export function ShieldWidget({
  shieldCount,
  shieldActive,
}: {
  shieldCount: number
  shieldActive: boolean
}) {
  const [localCount, setLocalCount] = useState(shieldCount)
  const [localActive, setLocalActive] = useState(shieldActive)
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleActivate() {
    if (localCount <= 0 || localActive || isPending) return

    const consumedIndex = localCount - 1
    setAnimatingIndex(consumedIndex)
    setLocalCount(c => c - 1)
    setLocalActive(true)
    setTimeout(() => setAnimatingIndex(null), 300)

    startTransition(async () => {
      const result = await activateShieldAction()
      if (!result.success) {
        // Revert optimistic update on failure
        setLocalCount(shieldCount)
        setLocalActive(shieldActive)
      }
    })
  }

  return (
    <div
      className="bg-surface rounded-card p-6 border border-border/60 flex flex-col gap-4"
      aria-label="Escudos de racha"
    >
      <div className="border-b border-border/40 pb-2">
        <h2 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
          Escudos
        </h2>
      </div>

      {/* Shield icons */}
      <div className="flex items-center gap-2">
        {Array.from({ length: MAX_SHIELDS }, (_, i) => {
          const isActive = i < localCount
          const isAnimating = i === animatingIndex

          return (
            <motion.div
              key={i}
              animate={isAnimating ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Shield
                size={22}
                strokeWidth={1.75}
                style={{
                  color: isActive
                    ? 'var(--color-text-primary)'
                    : 'var(--color-border)',
                  transition: 'color 200ms ease',
                }}
                aria-hidden
              />
            </motion.div>
          )
        })}

        {localActive && (
          <span
            className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-pill"
            style={{
              background: 'color-mix(in srgb, var(--color-fisico) 12%, transparent)',
              color: 'var(--color-fisico)',
              border: '1px solid color-mix(in srgb, var(--color-fisico) 25%, transparent)',
            }}
          >
            Escudo activo
          </span>
        )}
      </div>

      {/* Action / hint */}
      {localCount > 0 && !localActive ? (
        <button
          type="button"
          onClick={handleActivate}
          disabled={isPending}
          className="w-full h-9 rounded-component border border-border/60 text-sm font-medium text-text-secondary hover:text-text-primary hover:border-border transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Activar escudo
        </button>
      ) : localCount === 0 && !localActive ? (
        <p className="text-xs text-text-muted leading-snug">
          Completa 7 días seguidos para ganar un escudo
        </p>
      ) : null}
    </div>
  )
}
