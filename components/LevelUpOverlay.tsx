'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import confetti from 'canvas-confetti'
import { AvatarSpeechBubble } from '@/components/ui/AvatarSpeechBubble'
import type { AvatarConfig } from '@/types/supabase'

const PALETTE = ['#7F77DD', '#1D9E75', '#BA7517', '#F2F2F0']

const PHRASES = [
  'La constancia es la única ventaja injusta.',
  'Cada repetición es una deuda con tu yo futuro.',
  'La constancia lo cambia todo.',
  'El progreso no se ve día a día. Se ve año a año.',
  'No hay atajos. Solo hay el trabajo.',
]

const AVATAR_MESSAGES = [
  'Otro nivel. Esto no es suerte — es disciplina acumulada.',
  'Mira lo lejos que has llegado. Y esto es solo el principio.',
  'Cada día que entrenas, tu yo futuro te da las gracias.',
]

interface Props {
  level: number
  avatarConfig: AvatarConfig | null
  onClose: () => void
}

export function LevelUpOverlay({ level, avatarConfig, onClose }: Props) {
  const [phrase] = useState(() => PHRASES[Math.floor(Math.random() * PHRASES.length)])
  const [avatarMessage] = useState(() => AVATAR_MESSAGES[Math.floor(Math.random() * AVATAR_MESSAGES.length)])
  const [showSpeech, setShowSpeech] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowSpeech(true), 700)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const t1 = setTimeout(() => {
      confetti({ particleCount: 80, spread: 65, origin: { y: 0.5 }, colors: PALETTE })
    }, 300)
    const t2 = setTimeout(() => {
      confetti({ particleCount: 40, angle: 55, spread: 45, origin: { x: 0, y: 0.6 }, colors: PALETTE })
      confetti({ particleCount: 40, angle: 125, spread: 45, origin: { x: 1, y: 0.6 }, colors: PALETTE })
    }, 600)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(14, 14, 16, 0.95)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-surface border border-border/60 rounded-card p-10 max-w-sm w-full mx-4 flex flex-col items-center gap-6 text-center relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Accent glow strip at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: 'var(--color-accent)' }} aria-hidden />

        {/* LEVEL UP animated label */}
        <motion.p
          initial={{ opacity: 0, y: -8, letterSpacing: '0.4em' }}
          animate={{ opacity: 1, y: 0, letterSpacing: '0.3em' }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="text-4xl font-black uppercase"
          style={{ color: 'var(--color-accent)' }}
        >
          Level Up
        </motion.p>

        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest -mt-2">
          Nivel alcanzado
        </p>

        {/* Level number */}
        <motion.p
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="text-8xl font-black tabular-nums leading-none"
          style={{ color: 'var(--color-accent)' }}
        >
          {level}
        </motion.p>

        <p className="text-sm text-text-muted leading-relaxed max-w-[240px]">{phrase}</p>

        <button
          type="button"
          onClick={onClose}
          className="
            w-full bg-accent text-white font-semibold py-2.5 rounded-component
            border border-accent/40
            transition-all duration-150 ease-out
            hover:shadow-[0_0_16px_rgba(127,119,221,0.35)]
            active:scale-[0.96]
          "
        >
          Continuar
        </button>

        {showSpeech && (
          <div className="w-full text-left border-t border-border/40 pt-4">
            <AvatarSpeechBubble
              message={avatarMessage}
              avatarConfig={avatarConfig}
              size={48}
            />
          </div>
        )}
      </motion.div>
    </div>
  )

  return createPortal(content, document.body)
}
