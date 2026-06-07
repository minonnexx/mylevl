'use client'

import { ShieldCheck, X } from 'lucide-react'

interface ShieldUsedBannerProps {
  onDismiss: () => void
}

export function ShieldUsedBanner({ onDismiss }: ShieldUsedBannerProps) {
  return (
    <div
      className="relative flex items-start gap-4 rounded-card p-6 border"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
      }}
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-component flex items-center justify-center"
        style={{ background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }}
      >
        <ShieldCheck size={20} style={{ color: 'var(--color-accent)' }} aria-hidden />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Tu racha estaba en peligro
        </p>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Tu escudo absorbió el golpe y protegió tu racha
        </p>
      </div>

      <button
        onClick={onDismiss}
        aria-label="Cerrar notificación"
        className="flex-shrink-0 p-1 rounded-component transition-colors"
        style={{ color: 'var(--color-text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  )
}
