'use client'

import { CheckCircle, TrendingUp, Flame } from 'lucide-react'
import { CLASS_META } from '@/lib/constants/classes'
import type { LifeClass } from '@/types/supabase'

type ProfileData = { username: string | null; global_level: number }

export type FeedEventItem = {
  id: string
  user_id: string
  event_type: 'mission_completed' | 'level_up' | 'streak_milestone'
  metadata: {
    mission_title?: string
    life_class?: string
    xp_reward?: number
    new_level?: number
    streak_days?: number
  }
  created_at: string
  // Supabase may return array or object depending on query form
  profiles: ProfileData | ProfileData[] | null
}

const LIFE_CLASSES = new Set<string>(['fisico', 'mental', 'disciplina'])

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'hace un momento'
  if (minutes < 60) return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`
  const days = Math.floor(hours / 24)
  return `hace ${days} ${days === 1 ? 'día' : 'días'}`
}

export function FeedItem({ event }: { event: FeedEventItem }) {
  const profileData = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles
  const username = profileData?.username ?? 'jugador'
  const { event_type, metadata, created_at } = event

  let icon: React.ReactNode
  let content: React.ReactNode

  if (event_type === 'mission_completed') {
    const lc = metadata.life_class
    const meta = lc && LIFE_CLASSES.has(lc) ? CLASS_META[lc as LifeClass] : null
    icon = (
      <CheckCircle size={18} strokeWidth={2} style={{ color: 'var(--color-accent)' }} aria-hidden />
    )
    content = (
      <p className="text-sm text-text-primary leading-relaxed">
        <span className="font-semibold">{username}</span>
        {' completó '}
        <span className="font-medium">{metadata.mission_title ?? 'una misión'}</span>
        {meta && (
          <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-pill ml-2 align-middle ${meta.badgeClasses}`}>
            {meta.label}
          </span>
        )}
      </p>
    )
  } else if (event_type === 'level_up') {
    icon = (
      <TrendingUp size={18} strokeWidth={2} style={{ color: 'var(--color-accent)' }} aria-hidden />
    )
    content = (
      <p className="text-sm text-text-primary leading-relaxed">
        <span className="font-semibold">{username}</span>
        {' subió al nivel '}
        <span className="font-bold" style={{ color: 'var(--color-accent)' }}>
          {metadata.new_level}
        </span>
      </p>
    )
  } else {
    icon = (
      <Flame size={18} strokeWidth={2} style={{ color: 'var(--color-disciplina)' }} aria-hidden />
    )
    content = (
      <p className="text-sm text-text-primary leading-relaxed">
        <span className="font-semibold">{username}</span>
        {' alcanzó una racha de '}
        <span className="font-bold">{metadata.streak_days}</span>
        {' días'}
      </p>
    )
  }

  return (
    <div
      className="rounded-card p-6 border border-border/60 flex items-start gap-4"
      style={{ background: 'var(--color-surface)' }}
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        {content}
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          {formatRelative(created_at)}
        </p>
      </div>
    </div>
  )
}
