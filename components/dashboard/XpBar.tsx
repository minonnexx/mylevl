'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { AnimatedBar } from '@/components/ui/AnimatedBar'

export function XpBar({ current, total }: { current: number; total: number }) {
  const reduced = useReducedMotion()
  const motionVal = useMotionValue(0)
  const displayCurrent = useTransform(motionVal, v =>
    Math.round(v).toLocaleString('es-ES')
  )

  useEffect(() => {
    if (reduced) {
      motionVal.set(current)
      return
    }
    const ctrl = animate(motionVal, current, { duration: 0.8, ease: 'easeOut' })
    return ctrl.stop
  }, [current, motionVal, reduced])

  const value = total > 0 ? current / total : 0

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">XP</span>
        <span className="text-[10px] tabular-nums text-text-muted">
          <motion.span>{displayCurrent}</motion.span>
          {' / '}
          {total.toLocaleString('es-ES')}
        </span>
      </div>
      <AnimatedBar
        value={value}
        color="var(--color-accent)"
        height="h-3"
        showTicks
        glowColor="rgba(127, 119, 221, 0.30)"
        aria-label={`XP: ${current} de ${total}`}
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        role="progressbar"
      />
    </div>
  )
}
