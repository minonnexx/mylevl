'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { CheckCircle2, Flame, ShieldCheck, Swords, Trophy, Zap } from 'lucide-react'
import { CLASS_META } from '@/lib/constants/classes'
import { AvatarSpeechBubble } from '@/components/ui/AvatarSpeechBubble'
import type { DaySummary, MissionSummaryItem } from '@/lib/recap'
import type { AvatarConfig, LifeClass } from '@/types/supabase'

const AVATAR_MESSAGES = [
  'Otro día que no se puede quitarte. Sigue así.',
  'La racha no es suerte — es una decisión que tomaste hoy.',
  'Cada misión completada es un ladrillo. Estás construyendo algo real.',
]

interface Props {
  daySummary: DaySummary
  avatarConfig: AvatarConfig | null
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
    <div
      className="flex items-center gap-2.5 pl-3"
      style={{ borderLeft: `3px solid ${meta.color}` }}
    >
      <span className="text-sm text-text-muted flex-1 min-w-0 truncate">{item.title}</span>
      <span className="text-sm font-black tabular-nums flex-shrink-0" style={{ color: 'var(--color-accent)' }}>
        +{item.xp_reward} XP
      </span>
    </div>
  )
}

export function DailyRecapOverlay({ daySummary, avatarConfig, onClose }: Props) {
  const shouldReduceMotion = useReducedMotion()
  const [avatarMessage] = useState(() => AVATAR_MESSAGES[Math.floor(Math.random() * AVATAR_MESSAGES.length)])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const { dailyMissions, bossMission, achievements } = daySummary

  const content = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        className="bg-surface border border-border/60 rounded-card p-6 max-w-sm w-full mx-4 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Title */}
        <div className="text-center">
          <p className="text-xs font-medium text-text-muted tracking-widest mb-2">
            Resumen del día
          </p>
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 size={20} style={{ color: 'var(--color-accent)' }} aria-hidden />
            <h2 className="text-2xl font-black text-text-primary">Misión diaria completada</h2>
          </div>
        </div>

        {/* Avatar — protagonista */}
        <AvatarSpeechBubble
          message={avatarMessage}
          avatarConfig={avatarConfig}
          size={48}
        />

        {/* XP pill */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-pill"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
            }}
          >
            <Zap size={16} style={{ color: 'var(--color-accent)' }} aria-hidden />
            <XpCounter value={daySummary.xpEarnedToday} />
          </div>
          <p className="text-xs text-text-muted">XP ganada</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Missions — fisico green */}
          <div
            className="flex flex-col items-center gap-1 rounded-component p-3"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-fisico) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-fisico) 30%, transparent)',
            }}
          >
            <span className="text-xl font-black tabular-nums" style={{ color: 'var(--color-fisico)' }}>
              {daySummary.missionsCompleted}/{daySummary.missionsTotal}
            </span>
            <span className="text-[10px] text-text-muted text-center leading-tight">diarias</span>
          </div>

          {/* Streak — disciplina amber */}
          <div
            className="flex flex-col items-center gap-1 rounded-component p-3"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-disciplina) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-disciplina) 30%, transparent)',
            }}
          >
            <div className="flex items-center gap-1">
              <Flame size={14} style={{ color: 'var(--color-disciplina)' }} aria-hidden />
              <span className="text-xl font-black tabular-nums" style={{ color: 'var(--color-disciplina)' }}>
                {daySummary.currentStreak}
              </span>
            </div>
            <span className="text-[10px] text-text-muted text-center leading-tight">
              {daySummary.currentStreak === 1 ? 'día racha' : 'días racha'}
            </span>
          </div>

          {/* Shields — accent purple */}
          <div
            className="flex flex-col items-center gap-1 rounded-component p-3"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
            }}
          >
            <div className="flex items-center gap-1">
              <ShieldCheck size={14} style={{ color: 'var(--color-accent)' }} aria-hidden />
              <span className="text-xl font-black tabular-nums" style={{ color: 'var(--color-accent)' }}>
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
            Ver recap
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
