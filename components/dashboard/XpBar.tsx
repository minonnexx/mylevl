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
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs text-text-muted">
        <span className="font-medium uppercase tracking-wider">XP</span>
        <span className="tabular-nums">
          <motion.span>{displayCurrent}</motion.span>
          {' / '}
          {total.toLocaleString('es-ES')}
        </span>
      </div>
      <AnimatedBar value={value} color="var(--color-accent)" height="h-2" />
      <p className="text-xs text-text-muted">{Math.round(value * 100)}% completado</p>
    </div>
  )
}
