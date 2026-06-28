'use client'

import Link from 'next/link'
import { CheckCircle, TrendingUp, Flame } from 'lucide-react'
import { CLASS_META } from '@/lib/constants/classes'
import AvatarDisplay from '@/components/avatar/AvatarDisplay'
import type { LifeClass, AvatarConfig } from '@/types/supabase'

type ProfileData = { username: string | null; global_level: number; avatar_config: AvatarConfig | null }

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
  const avatarConfig = profileData?.avatar_config ?? null
  const { event_type, metadata, created_at } = event

  let icon: React.ReactNode
  let content: React.ReactNode

  if (event_type === 'mission_completed') {
    const lc = metadata.life_class
    const meta = lc && LIFE_CLASSES.has(lc) ? CLASS_META[lc as LifeClass] : null
    icon = (
      <CheckCircle size={14} strokeWidth={2} style={{ color: 'var(--color-fisico)' }} aria-hidden />
    )
    content = (
      <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
        <Link href={`/u/${username}`} className="font-semibold text-text-primary hover:underline">
          {username}
        </Link>
        {' completó '}
        <span>{metadata.mission_title ?? 'una misión'}</span>
        {meta && (
          <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-pill ml-1.5 align-middle ${meta.badgeClasses}`}>
            {meta.label}
          </span>
        )}
      </p>
    )
  } else if (event_type === 'level_up') {
    icon = (
      <TrendingUp size={16} strokeWidth={2} style={{ color: 'var(--color-accent)' }} aria-hidden />
    )
    content = (
      <p className="text-sm font-black text-text-primary leading-relaxed">
        <Link href={`/u/${username}`} className="hover:underline">
          {username}
        </Link>
        {' subió al '}
        <span
          className="inline-flex items-center text-xs font-black px-2.5 py-1 rounded-pill ml-1 align-middle"
          style={{
            color: 'var(--color-accent)',
            background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
          }}
        >
          NIVEL {metadata.new_level}
        </span>
      </p>
    )
  } else {
    icon = (
      <Flame size={14} strokeWidth={2} style={{ color: 'var(--color-disciplina)' }} aria-hidden />
    )
    content = (
      <p className="text-sm text-text-primary leading-relaxed">
        <Link href={`/u/${username}`} className="font-semibold hover:underline" style={{ color: 'inherit' }}>
          {username}
        </Link>
        {' alcanzó una racha de '}
        <span className="font-black tabular-nums" style={{ color: 'var(--color-disciplina)' }}>
          {metadata.streak_days}
        </span>
        {' días'}
      </p>
    )
  }

  return (
    <div
      className="rounded-card p-4 border border-border/60 flex items-start gap-3"
      style={{ background: 'var(--color-surface)' }}
    >
      <Link
        href={`/u/${username}`}
        aria-label={`Ver perfil de ${username}`}
        className="flex-shrink-0 transition-opacity hover:opacity-75"
      >
        <AvatarDisplay config={avatarConfig} size={36} />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1.5">
          <span className="mt-0.5 flex-shrink-0">{icon}</span>
          <div className="flex-1 min-w-0">{content}</div>
        </div>
        <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
          {formatRelative(created_at)}
        </p>
      </div>
    </div>
  )
}
