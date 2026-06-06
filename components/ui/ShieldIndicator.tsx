'use client'

import { useState, useTransition } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Shield, ShieldCheck } from 'lucide-react'
import { activateShieldAction } from '@/app/actions/activateShield'

const MAX_SHIELDS = 3

export function ShieldIndicator({
  shieldCount,
  shieldActive,
}: {
  shieldCount: number
  shieldActive: boolean
}) {
  const [localCount, setLocalCount] = useState(shieldCount)
  const [localActive, setLocalActive] = useState(shieldActive)
  const [consumingIndex, setConsumingIndex] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const prefersReduced = useReducedMotion()

  function handleActivate() {
    if (localCount <= 0 || localActive || isPending || consumingIndex !== null) return

    const idx = localCount - 1
    setConsumingIndex(idx)

    startTransition(async () => {
      const result = await activateShieldAction()
      setTimeout(() => {
        setConsumingIndex(null)
        if (result.success) {
          setLocalCount(c => c - 1)
          setLocalActive(true)
        }
      }, 300)
    })
  }

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <div className="flex items-center gap-1.5" aria-label={`Escudos: ${localCount} disponibles${localActive ? ', escudo activo' : ''}`}>
        {Array.from({ length: MAX_SHIELDS }, (_, i) => {
          // First slot shows the deployed shield when active
          if (i === 0 && localActive) {
            return (
              <motion.div
                key={i}
                animate={prefersReduced ? undefined : { scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ShieldCheck
                  size={18}
                  strokeWidth={1.75}
                  style={{ color: 'var(--color-fisico)' }}
                  aria-hidden
                />
              </motion.div>
            )
          }

          // Inventory index: when active, slot 0 is taken by ShieldCheck so inventory starts at slot 1
          const inventoryIndex = localActive ? i - 1 : i
          const isFilled = inventoryIndex < localCount
          const isConsuming = i === consumingIndex

          if (isConsuming) {
            return (
              <motion.div
                key={i}
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeIn' }}
              >
                <Shield
                  size={18}
                  strokeWidth={1.75}
                  style={{ color: 'var(--color-text-primary)' }}
                  aria-hidden
                />
              </motion.div>
            )
          }

          return (
            <Shield
              key={i}
              size={18}
              strokeWidth={1.75}
              style={{
                color: 'var(--color-text-primary)',
                opacity: isFilled ? 1 : 0.2,
              }}
              aria-hidden
            />
          )
        })}
      </div>

      {localCount > 0 && !localActive && (
        <button
          type="button"
          onClick={handleActivate}
          disabled={isPending || consumingIndex !== null}
          className="text-xs font-medium text-text-secondary hover:text-text-primary border border-border/60 hover:border-border px-2.5 py-1 rounded-component transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Activar escudo
        </button>
      )}

      {localActive && (
        <span className="text-xs font-semibold" style={{ color: 'var(--color-fisico)' }}>
          Escudo activo
        </span>
      )}

      {localCount === 0 && !localActive && (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Completa 7 días seguidos para ganar un escudo
        </p>
      )}
    </div>
  )
}
