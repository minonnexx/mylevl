'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { LevelUpParticles } from '@/components/ui/LevelUpParticles'
import { AvatarSpeechBubble } from '@/components/ui/AvatarSpeechBubble'
import type { AvatarConfig } from '@/types/supabase'

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
  const [visible, setVisible] = useState(false)
  const [showSpeech, setShowSpeech] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setShowSpeech(true), 600)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const content = (
    <>
    <LevelUpParticles />
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(14, 14, 16, 0.95)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border/60 rounded-card p-10 max-w-sm w-full mx-4 flex flex-col items-center gap-6 text-center"
        style={{
          animation: visible ? 'level-up-in 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none',
          opacity: visible ? undefined : 0,
        }}
        onClick={e => e.stopPropagation()}
      >
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-widest">
          Nivel alcanzado
        </p>

        <p
          className="text-8xl font-bold tabular-nums leading-none"
          style={{ color: 'var(--color-accent)' }}
        >
          {level}
        </p>

        <p className="text-sm text-text-muted leading-relaxed max-w-[240px]">{phrase}</p>

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-accent text-white font-semibold py-2.5 rounded-component transition-opacity duration-150 hover:opacity-90 active:scale-[0.98]"
        >
          Continuar
        </button>
      </div>

      {showSpeech && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            maxWidth: 'min(300px, calc(100vw - 32px))',
          }}
          onClick={e => e.stopPropagation()}
        >
          <AvatarSpeechBubble
            message={avatarMessage}
            avatarConfig={avatarConfig}
            size={48}
          />
        </div>
      )}
    </div>
    </>
  )

  return createPortal(content, document.body)
}
