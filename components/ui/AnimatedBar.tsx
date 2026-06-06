'use client'

import { motion, useReducedMotion } from 'motion/react'

interface AnimatedBarProps {
  value: number
  color: string
  height?: string
  showShimmer?: boolean
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
  delay = 0,
  className,
  ...ariaProps
}: AnimatedBarProps) {
  const reduced = useReducedMotion()
  const target = `${(Math.min(Math.max(value, 0), 1) * 100).toFixed(2)}%`

  return (
    <div className={`w-full bg-background rounded-pill overflow-hidden ${height}${className ? ` ${className}` : ''}`}>
      <motion.div
        className="relative h-full rounded-pill overflow-hidden"
        style={{ backgroundColor: color }}
        initial={{ width: reduced ? target : '0%' }}
        animate={{ width: target }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: reduced ? 0 : delay }}
        {...ariaProps}
      >
        {showShimmer && (
          <div className="bar-shimmer-overlay absolute inset-0" aria-hidden />
        )}
      </motion.div>
    </div>
  )
}
