'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Check } from 'lucide-react'
import type { Mission } from '@/types/supabase'
import { CLASS_META } from '@/lib/constants/classes'
import { CompleteButton } from './CompleteButton'

function ClassBadge({ lifeClass }: { lifeClass: keyof typeof CLASS_META }) {
  const { label, badgeClasses } = CLASS_META[lifeClass]
  return (
    <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-pill ${badgeClasses}`}>
      {label}
    </span>
  )
}

export function FeaturedMissionCard({
  mission,
  formAction,
  onOptimisticComplete,
  isProcessing,
}: {
  mission: Mission
  formAction: (payload: FormData) => void
  onOptimisticComplete: (missionId: string) => void
  isProcessing?: boolean
}) {
  const meta = CLASS_META[mission.life_class]
  const [showXp, setShowXp] = useState(false)
  const [completing, setCompleting] = useState(false)
  const xpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setCompleting(false)
    setShowXp(false)
    if (xpTimerRef.current) clearTimeout(xpTimerRef.current)
  }, [mission.id])

  useEffect(() => {
    return () => { if (xpTimerRef.current) clearTimeout(xpTimerRef.current) }
  }, [])

  function handleSubmit() {
    if (navigator.vibrate) navigator.vibrate(40)
    setCompleting(true)
    setShowXp(true)
    onOptimisticComplete(mission.id)
    if (xpTimerRef.current) clearTimeout(xpTimerRef.current)
    xpTimerRef.current = setTimeout(() => setShowXp(false), 650)
  }

  return (
    <div
      className="rounded-card p-6 border border-border/60 flex flex-col gap-5 relative overflow-hidden bg-surface"
      style={{
        transition: 'opacity 300ms ease, transform 300ms ease',
        opacity: completing ? 0.45 : 1,
        transform: completing ? 'scale(0.985)' : 'scale(1)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: meta.color }} aria-hidden />

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <ClassBadge lifeClass={mission.life_class} />
          <h3 className="font-semibold text-text-primary text-lg leading-snug">
            {mission.title}
          </h3>
          {mission.description && (
            <p className="text-sm text-text-muted leading-relaxed">{mission.description}</p>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <span className="text-2xl font-bold text-accent tabular-nums">+{mission.xp_reward}</span>
          <p className="text-xs text-text-muted font-medium">XP</p>
        </div>
      </div>

      <form action={formAction} onSubmit={handleSubmit} className="flex items-center gap-3">
        <input type="hidden" name="missionId"  value={mission.id} />
        <input type="hidden" name="xpReward"   value={mission.xp_reward} />
        <input type="hidden" name="lifeClass"  value={mission.life_class} />
        <input type="hidden" name="difficulty" value={mission.difficulty} />

        <div className="relative">
          <AnimatePresence mode="wait">
            {completing ? (
              <motion.div
                key="check"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut', times: [0, 0.6, 1] }}
                className="flex items-center justify-center w-10 h-10"
              >
                <Check size={22} style={{ color: 'var(--color-success)' }} strokeWidth={2.5} />
              </motion.div>
            ) : (
              <motion.div key="button" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CompleteButton disabled={isProcessing} />
              </motion.div>
            )}
          </AnimatePresence>
          {showXp && (
            <span
              className="absolute left-1/2 bottom-full mb-1 text-sm font-bold text-accent pointer-events-none whitespace-nowrap"
              style={{ animation: 'xp-float 650ms ease forwards' }}
              aria-hidden
            >
              +{mission.xp_reward} XP
            </span>
          )}
        </div>

        <span className="text-xs text-text-muted">Verificación manual</span>
      </form>
    </div>
  )
}
