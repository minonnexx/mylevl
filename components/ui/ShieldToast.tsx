'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Shield } from 'lucide-react'

export function ShieldToast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-card border"
          style={{
            background: 'color-mix(in srgb, var(--color-fisico) 10%, var(--color-surface))',
            borderColor: 'color-mix(in srgb, var(--color-fisico) 30%, transparent)',
          }}
        >
          <Shield size={16} style={{ color: 'var(--color-fisico)', flexShrink: 0 }} />
          <span className="text-sm font-medium" style={{ color: 'var(--color-fisico)' }}>
            Escudo ganado — racha de 7 días
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
