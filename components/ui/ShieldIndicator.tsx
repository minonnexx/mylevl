'use client'

import { motion, useReducedMotion } from 'motion/react'
import { Shield } from 'lucide-react'

const MAX_SHIELDS = 3
const STROKE_WIDTH = 2

const SIZES = {
  sm: { ring: 48, shieldIcon: 22, inventoryIcon: 24, gap: 12 },
  lg: { ring: 72, shieldIcon: 32, inventoryIcon: 30, gap: 16 },
} as const

export function ShieldIndicator({
  shieldCount,
  streakProgress,
  size = 'sm',
}: {
  shieldCount: number
  streakProgress: number  // current_streak % 7, range 0–6
  size?: 'sm' | 'lg'
}) {
  const prefersReduced = useReducedMotion()
  const s = SIZES[size]

  const isMax = shieldCount >= MAX_SHIELDS
  const progress = isMax ? 1 : streakProgress / 7
  const center = s.ring / 2
  const radius = center - STROKE_WIDTH - 1
  const circumference = 2 * Math.PI * radius
  const ringOffset = circumference * (1 - progress)

  const ringStroke = isMax ? 'var(--color-fisico)' : 'var(--color-text-primary)'
  const shieldColor = isMax ? 'var(--color-fisico)' : 'var(--color-text-secondary)'

  return (
    <div className="flex items-center" style={{ gap: s.gap }}>

      {/* Charging shield with SVG progress ring */}
      <div className="flex flex-col items-center gap-1">
        <div
          className="relative flex items-center justify-center flex-shrink-0"
          style={{ width: s.ring, height: s.ring }}
        >
          <svg
            viewBox={`0 0 ${s.ring} ${s.ring}`}
            width={s.ring}
            height={s.ring}
            className="absolute inset-0"
            style={{ transform: 'rotate(-90deg)' }}
            aria-hidden
          >
            {/* Background ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth={STROKE_WIDTH}
            />
            {/* Progress ring */}
            <motion.circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={ringStroke}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: ringOffset }}
              transition={
                prefersReduced
                  ? { duration: 0 }
                  : { duration: 0.7, ease: 'easeOut', delay: 0.1 }
              }
            />
          </svg>

          <Shield
            size={s.shieldIcon}
            strokeWidth={1.75}
            style={{ color: shieldColor }}
            aria-hidden
          />
        </div>

        <span
          className="tabular-nums leading-none text-center"
          style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}
          aria-label={
            isMax
              ? 'Escudos al máximo'
              : `${streakProgress} de 7 días para el siguiente escudo`
          }
        >
          {isMax ? 'Máx' : `${streakProgress}/7`}
        </span>
      </div>

      {/* Inventory */}
      <div
        className="flex items-center gap-1.5"
        aria-label={`${shieldCount} ${shieldCount === 1 ? 'escudo disponible' : 'escudos disponibles'}`}
      >
        {Array.from({ length: MAX_SHIELDS }, (_, i) => (
          <Shield
            key={i}
            size={s.inventoryIcon}
            strokeWidth={1.5}
            style={{
              color: 'var(--color-text-primary)',
              opacity: i < shieldCount ? 1 : 0.2,
            }}
            aria-hidden
          />
        ))}
      </div>

    </div>
  )
}
