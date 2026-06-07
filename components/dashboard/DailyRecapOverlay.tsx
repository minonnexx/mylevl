'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { Flame, ShieldCheck, Swords, Trophy } from 'lucide-react'
import { CLASS_META } from '@/lib/constants/classes'
import type { DaySummary, MissionSummaryItem } from '@/lib/recap'
import type { LifeClass } from '@/types/supabase'

interface Props {
  daySummary: DaySummary
  onClose: () => void
}

function XpCounter({ value }: { value: number }) {
  const reduced = useReducedMotion()
  const motionVal = useMotionValue(0)
  const display = useTransform(motionVal, v => `+${Math.round(v).toLocaleString('es-ES')}`)

  useEffect(() => {
    if (reduced) { motionVal.set(value); return }
    const ctrl = animate(motionVal, value, { duration: 1, ease: 'easeOut' })
    return ctrl.stop
  }, [value, motionVal, reduced])

  return (
    <motion.span
      className="text-5xl font-bold tabular-nums leading-none"
      style={{ color: 'var(--color-accent)' }}
    >
      {display}
    </motion.span>
  )
}

function MissionRow({ item }: { item: MissionSummaryItem }) {
  const lc = item.life_class as LifeClass
  const meta = CLASS_META[lc] ?? CLASS_META.fisico
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: meta.color }}
        aria-hidden
      />
      <span className="text-sm text-text-muted flex-1 min-w-0 truncate">{item.title}</span>
      <span className="text-sm font-bold tabular-nums flex-shrink-0" style={{ color: 'var(--color-accent)' }}>
        +{item.xp_reward} XP
      </span>
    </div>
  )
}

export function DailyRecapOverlay({ daySummary, onClose }: Props) {
  const shouldReduceMotion = useReducedMotion()

  const { dailyMissions, bossMission, achievements } = daySummary

  const content = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <motion.div
        className="bg-surface border border-border/60 rounded-card p-6 max-w-sm w-full mx-4 flex flex-col gap-5"
        initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Title */}
        <div className="text-center">
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-widest mb-2">
            Resumen del día
          </p>
          <h2 className="text-2xl font-bold text-text-primary">Día completado</h2>
        </div>

        {/* XP */}
        <div className="flex flex-col items-center gap-1">
          <XpCounter value={daySummary.xpEarnedToday} />
          <p className="text-xs text-text-muted">XP ganados hoy</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1 bg-background rounded-component p-3">
            <span className="text-xl font-bold text-text-primary tabular-nums">
              {daySummary.missionsCompleted}/{daySummary.missionsTotal}
            </span>
            <span className="text-[10px] text-text-muted text-center leading-tight">diarias</span>
          </div>
          <div className="flex flex-col items-center gap-1 bg-background rounded-component p-3">
            <div className="flex items-center gap-1">
              <Flame size={14} style={{ color: 'var(--color-disciplina)' }} aria-hidden />
              <span className="text-xl font-bold text-text-primary tabular-nums">
                {daySummary.currentStreak}
              </span>
            </div>
            <span className="text-[10px] text-text-muted text-center leading-tight">
              {daySummary.currentStreak === 1 ? 'día racha' : 'días racha'}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 bg-background rounded-component p-3">
            <div className="flex items-center gap-1">
              <ShieldCheck size={14} style={{ color: 'var(--color-accent)' }} aria-hidden />
              <span className="text-xl font-bold text-text-primary tabular-nums">
                {daySummary.shieldCount}
              </span>
            </div>
            <span className="text-[10px] text-text-muted text-center leading-tight">escudos</span>
          </div>
        </div>

        {/* Daily missions */}
        {dailyMissions.length > 0 && (
          <div className="flex flex-col gap-2.5 border-t border-border/40 pt-4">
            <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
              Misiones diarias · {daySummary.missionsCompleted}/{daySummary.missionsTotal} completadas
            </p>
            {dailyMissions.map(item => (
              <MissionRow key={item.mission_id} item={item} />
            ))}
          </div>
        )}

        {/* Boss mission */}
        {bossMission && (
          <div className="flex flex-col gap-2.5 border-t border-border/40 pt-4">
            <div className="flex items-center gap-1.5">
              <Swords size={12} style={{ color: 'var(--color-accent)' }} aria-hidden />
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                Misión jefe
              </p>
            </div>
            <MissionRow item={bossMission} />
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="flex flex-col gap-2.5 border-t border-border/40 pt-4">
            <div className="flex items-center gap-1.5">
              <Trophy size={12} style={{ color: 'var(--color-disciplina)' }} aria-hidden />
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                Logros
              </p>
            </div>
            {achievements.map(item => (
              <MissionRow key={item.mission_id} item={item} />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <Link
            href="/recap"
            className="w-full text-center bg-accent text-white font-semibold py-2.5 rounded-component transition-opacity duration-150 hover:opacity-90 active:scale-[0.98] text-sm"
            onClick={onClose}
          >
            Ver historial completo
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-sm font-medium text-text-muted py-2.5 rounded-component border border-border/60 hover:text-text-secondary hover:border-border transition-colors"
          >
            Continuar
          </button>
        </div>
      </motion.div>
    </div>
  )

  return createPortal(content, document.body)
}
