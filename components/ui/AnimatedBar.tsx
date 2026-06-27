'use client'

import { motion, useReducedMotion, useMotionValue, useTransform, animate } from 'motion/react'
import { useEffect } from 'react'

interface AnimatedBarProps {
  value: number
  color: string
  height?: string
  showShimmer?: boolean
  showTicks?: boolean
  glowColor?: string
  delay?: number
  className?: string
  role?: string
  'aria-valuenow'?: number
  'aria-valuemin'?: number
  'aria-valuemax'?: number
  'aria-label'?: string
}

export function AnimatedBar({
  value,
  color,
  height = 'h-2',
  showShimmer = true,
  showTicks = false,
  glowColor,
  delay = 0,
  className,
  ...ariaProps
}: AnimatedBarProps) {
  const reduced = useReducedMotion()
  const clampedValue = Math.min(Math.max(value, 0), 1)
  const target = `${(clampedValue * 100).toFixed(2)}%`

  const brightnessMv = useMotionValue(1)
  const filterStyle = useTransform(brightnessMv, v => `brightness(${v})`)

  useEffect(() => {
    if (clampedValue >= 1 && !reduced) {
      animate(brightnessMv, [1, 1.6, 1], { duration: 0.65, ease: 'easeInOut', delay: 0.85 })
    }
  }, [clampedValue, reduced, brightnessMv])

  return (
    <div
      className={`relative w-full bg-background rounded-pill overflow-hidden ${height}${className ? ` ${className}` : ''}`}
      style={glowColor ? { boxShadow: `0 4px 14px ${glowColor}` } : undefined}
    >
      <motion.div
        className="relative h-full rounded-pill overflow-hidden"
        style={{ backgroundColor: color, filter: filterStyle }}
        initial={{ width: reduced ? target : '0%' }}
        animate={{ width: target }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: reduced ? 0 : delay }}
        {...ariaProps}
      >
        {showShimmer && (
          <div className="bar-shimmer-overlay absolute inset-0" aria-hidden />
        )}
      </motion.div>

      {showTicks && (
        <>
          {[25, 50, 75].map(pct => (
            <div
              key={pct}
              aria-hidden
              className="absolute top-0 bottom-0 z-10"
              style={{
                left: `${pct}%`,
                width: 1,
                backgroundColor: 'var(--color-background)',
                opacity: 0.7,
              }}
            />
          ))}
        </>
      )}
    </div>
  )
}
