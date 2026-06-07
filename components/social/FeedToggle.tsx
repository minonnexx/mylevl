'use client'

import { useState, useTransition } from 'react'
import { Globe, Lock } from 'lucide-react'
import { toggleFeedPublic } from '@/app/social/actions'

export function FeedToggle({ feedPublic }: { feedPublic: boolean }) {
  const [isPublic, setIsPublic] = useState(feedPublic)
  const [isPending, startToggle] = useTransition()

  function handleToggle() {
    startToggle(async () => {
      const newValue = await toggleFeedPublic()
      if (newValue !== null) setIsPublic(newValue)
    })
  }

  return (
    <div
      className="rounded-card p-6 border border-border/60"
      style={{ background: 'var(--color-surface)' }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex-shrink-0">
            {isPublic
              ? <Globe size={16} style={{ color: 'var(--color-accent)' }} aria-hidden />
              : <Lock size={16} style={{ color: 'var(--color-text-muted)' }} aria-hidden />
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Feed público</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {isPublic
                ? 'Cualquier jugador puede ver tu actividad'
                : 'Solo tus amigos ven tu actividad'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={isPending}
          role="switch"
          aria-checked={isPublic}
          aria-label="Activar o desactivar feed público"
          className="relative flex-shrink-0 w-11 h-6 rounded-pill transition-all duration-200 disabled:opacity-50"
          style={{
            background: isPublic
              ? 'color-mix(in srgb, var(--color-accent) 80%, transparent)'
              : 'color-mix(in srgb, var(--color-text-muted) 30%, transparent)',
            border: isPublic
              ? '1px solid color-mix(in srgb, var(--color-accent) 60%, transparent)'
              : '1px solid color-mix(in srgb, var(--color-text-muted) 30%, transparent)',
          }}
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-200"
            style={{
              background: 'var(--color-text-primary)',
              transform: isPublic ? 'translateX(20px)' : 'translateX(2px)',
            }}
          />
        </button>
      </div>
    </div>
  )
}
