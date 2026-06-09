'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Users } from 'lucide-react'
import { FeedItem } from '@/components/social/FeedItem'
import type { FeedEventItem } from '@/components/social/FeedItem'

const INITIAL_LIMIT = 4

export function SocialFeed({ feed }: { feed: FeedEventItem[] }) {
  const [expanded, setExpanded] = useState(false)

  if (feed.length === 0) {
    return (
      <div
        className="rounded-card p-6 border border-border/60 flex flex-col items-center gap-3 text-center"
        style={{ background: 'var(--color-surface)' }}
      >
        <Users size={32} strokeWidth={1.5} style={{ color: 'var(--color-text-muted)' }} aria-hidden />
        <p className="text-base font-semibold text-text-primary">Tu feed está vacío</p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Añade amigos para ver cuando suban de nivel, completen misiones o alcancen nuevas rachas
        </p>
      </div>
    )
  }

  const visible = expanded ? feed : feed.slice(0, INITIAL_LIMIT)
  const hasMore = feed.length > INITIAL_LIMIT

  return (
    <div className="flex flex-col gap-4">
      {visible.map(event => (
        <FeedItem key={event.id} event={event} />
      ))}

      {hasMore && (
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-component text-sm font-medium transition-colors"
          style={{
            color: 'var(--color-text-muted)',
            border: '1px solid color-mix(in srgb, var(--color-text-muted) 20%, transparent)',
          }}
        >
          {expanded ? (
            <>
              <ChevronUp size={15} aria-hidden />
              Ver menos
            </>
          ) : (
            <>
              <ChevronDown size={15} aria-hidden />
              Ver más actividad
            </>
          )}
        </button>
      )}
    </div>
  )
}
