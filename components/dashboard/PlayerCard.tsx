'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'
import { useCountUp } from 'react-countup'
import { XpBar } from './XpBar'
import { AnimatedBar } from '@/components/ui/AnimatedBar'
import { ShieldIndicator } from '@/components/ui/ShieldIndicator'
import AvatarDisplay from '@/components/avatar/AvatarDisplay'
import { getMilestoneProgress } from '@/lib/constants/classes'
import type { AvatarConfig } from '@/types/supabase'

type LifeClass = 'fisico' | 'mental' | 'disciplina'

interface ClassStat {
  life_class: LifeClass
  points: number
}

const CLASS_BAR_META: Record<LifeClass, { label: string; color: string; glow: string }> = {
  fisico:     { label: 'Físico',     color: 'var(--color-fisico)',     glow: 'rgba(29,158,117,0.28)' },
  mental:     { label: 'Mental',     color: 'var(--color-mental)',     glow: 'rgba(127,119,221,0.28)' },
  disciplina: { label: 'Disciplina', color: 'var(--color-disciplina)', glow: 'rgba(186,117,23,0.28)' },
}

const CLASS_ORDER: LifeClass[] = ['fisico', 'mental', 'disciplina']

function LevelHex({ level }: { level: number }) {
  useCountUp({ ref: 'hex-level', end: level, duration: 1.2, delay: 0.1 })

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <span className="text-[8px] font-semibold uppercase tracking-widest text-text-muted">LVL</span>
      <div className="relative flex items-center justify-center w-11 h-[50px]">
        <svg width="44" height="50" viewBox="0 0 44 50" fill="none" aria-hidden className="absolute">
          <polygon
            points="22,2 42,13 42,37 22,48 2,37 2,13"
            fill="color-mix(in srgb, var(--color-accent) 12%, transparent)"
            stroke="color-mix(in srgb, var(--color-accent) 40%, transparent)"
            strokeWidth="1.5"
          />
        </svg>
        <span id="hex-level" className="relative text-xl font-black text-accent tabular-nums" />
      </div>
    </div>
  )
}

function StreakBadge({ streak }: { streak: number }) {
  useCountUp({ ref: 'streak-count', end: streak, duration: 1.0, delay: 0.3 })

  const isActive = streak > 0
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-component"
      style={{
        background: isActive
          ? 'color-mix(in srgb, var(--color-disciplina) 8%, transparent)'
          : 'var(--color-surface-elevated)',
        border: '1px solid',
        borderColor: isActive
          ? 'color-mix(in srgb, var(--color-disciplina) 22%, transparent)'
          : 'var(--color-border)',
      }}
    >
      <Zap
        size={18}
        strokeWidth={2.25}
        style={{ color: isActive ? 'var(--color-disciplina)' : 'var(--color-text-muted)', flexShrink: 0 }}
        aria-hidden
      />
      <div className="flex items-baseline gap-1.5">
        <span
          id="streak-count"
          className="text-2xl font-black tabular-nums"
          style={{ color: isActive ? 'var(--color-disciplina)' : 'var(--color-text-muted)' }}
        />
        <span className="text-xs text-text-muted">
          {streak === 1 ? 'día de racha' : 'días de racha'}
        </span>
      </div>
    </div>
  )
}

export function PlayerCard({
  username,
  globalLevel,
  currentXp,
  xpToNextLevel,
  currentStreak,
  shieldCount,
  avatarConfig,
  classStats,
}: {
  username: string | null
  globalLevel: number
  currentXp: number
  xpToNextLevel: number
  currentStreak: number
  shieldCount: number
  avatarConfig: AvatarConfig | null
  classStats: ClassStat[]
}) {
  const statMap = new Map(classStats.map(s => [s.life_class, s.points]))

  return (
    <div className="bg-surface rounded-card p-6 border border-border/60 flex flex-col gap-5">

      {/* Top row: avatar + name + level hex + shield */}
      <div className="flex items-center gap-4">
        <Link
          href={`/u/${username}`}
          aria-label={`Ver perfil público de ${username ?? 'jugador'}`}
          className="flex-shrink-0 transition-opacity hover:opacity-75"
        >
          {avatarConfig ? (
            <AvatarDisplay config={avatarConfig} size={64} />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
              }}
            >
              <span className="text-accent font-bold text-base leading-none select-none">
                {(username ?? 'JU').slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary truncate">{username ?? 'Jugador'}</p>
          <p className="text-xs text-text-muted mt-0.5">Aventurero</p>
        </div>

        <LevelHex level={globalLevel} />

        <ShieldIndicator
          shieldCount={shieldCount}
          streakProgress={currentStreak % 7}
          size="sm"
        />
      </div>

      {/* XP bar */}
      <XpBar current={currentXp} total={xpToNextLevel} />

      {/* Streak widget */}
      <StreakBadge streak={currentStreak} />

      {/* Class mini-stats */}
      {classStats.length > 0 && (
        <div className="flex flex-col gap-2.5 pt-1 border-t border-border/40">
          {CLASS_ORDER.map((cls, i) => {
            const m = CLASS_BAR_META[cls]
            const points = statMap.get(cls) ?? 0
            const { pct } = getMilestoneProgress(points)
            return (
              <div key={cls} className="flex items-center gap-3">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider flex-shrink-0"
                  style={{ color: m.color, width: 70 }}
                >
                  {m.label}
                </span>
                <AnimatedBar
                  value={pct / 100}
                  color={m.color}
                  glowColor={m.glow}
                  height="h-1.5"
                  delay={0.3 + i * 0.1}
                />
                <span className="text-[10px] tabular-nums text-text-muted flex-shrink-0 w-7 text-right">
                  {points}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
