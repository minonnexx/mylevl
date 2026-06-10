'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import AvatarDisplay from '@/components/avatar/AvatarDisplay'
import type { AvatarConfig } from '@/types/supabase'

const CONFIRM_DIALOGUE = (username: string) => [
  `Oye, ${username}.`,
  '¿De verdad lo has conseguido?',
  'Esta app eres tú. Si mientes aquí, solo te mientes a ti mismo.',
]

const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms))

// ─── Shared overlay wrapper ────────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {children}
    </motion.div>
  )
}

// ─── Shared button styles ──────────────────────────────────────────────────────
const btnPrimary: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: 'var(--radius-component)',
  backgroundColor: 'var(--color-accent)',
  color: 'var(--color-text-primary)',
  border: 'none',
  cursor: 'pointer',
  fontSize: '15px',
  fontWeight: 600,
}

const btnSecondary: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: 'var(--radius-component)',
  backgroundColor: 'transparent',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  cursor: 'pointer',
  fontSize: '15px',
  fontWeight: 500,
}

// ─── Full typewriter modal (first time) ───────────────────────────────────────
function FullConfirmModal({
  username,
  avatarConfig,
  onConfirm,
  onCancel,
}: {
  username: string
  avatarConfig: AvatarConfig | null
  onConfirm: () => void
  onCancel: () => void
}) {
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    const segments = CONFIRM_DIALOGUE(username)

    async function run() {
      let accumulated = ''
      for (let s = 0; s < segments.length; s++) {
        if (s > 0) {
          await sleep(350)
          if (cancelled) return
          accumulated += '\n\n'
          setText(accumulated)
        }
        const segment = segments[s]
        for (let c = 0; c < segment.length; c++) {
          if (cancelled) return
          accumulated += segment[c]
          setText(accumulated)
          await sleep(44)
        }
        if (s < segments.length - 1) await sleep(450)
      }
      if (!cancelled) setDone(true)
    }

    run()
    return () => { cancelled = true }
  }, [username])

  return (
    <Overlay onClose={onCancel}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', maxWidth: '360px', width: '100%' }}>
        <AvatarDisplay config={avatarConfig} size={80} />

        <p
          style={{
            color: 'var(--color-text-primary)',
            fontSize: '18px',
            lineHeight: '1.75',
            whiteSpace: 'pre-wrap',
            textAlign: 'center',
            minHeight: '110px',
          }}
        >
          {text}
          {!done && (
            <span
              style={{
                display: 'inline-block',
                width: '2px',
                height: '1.1em',
                backgroundColor: 'var(--color-accent)',
                verticalAlign: 'text-bottom',
                marginLeft: '2px',
                animation: 'blink 1s step-end infinite',
              }}
            />
          )}
        </p>

        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}
          >
            <button onClick={onConfirm} style={btnPrimary}>Sí, lo he conseguido</button>
            <button onClick={onCancel} style={btnSecondary}>Aún no</button>
          </motion.div>
        )}
      </div>
    </Overlay>
  )
}

// ─── Simple confirmation modal (subsequent times) ─────────────────────────────
function SimpleConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Overlay onClose={onCancel}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid color-mix(in srgb, var(--color-border) 60%, transparent)',
          padding: '24px',
          maxWidth: '320px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <p
          style={{
            color: 'var(--color-text-primary)',
            fontSize: '17px',
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: '1.5',
          }}
        >
          ¿De verdad lo has completado?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={onConfirm} style={btnPrimary}>Sí, lo he conseguido</button>
          <button onClick={onCancel} style={btnSecondary}>Aún no</button>
        </div>
      </motion.div>
    </Overlay>
  )
}

// ─── Public export ─────────────────────────────────────────────────────────────
export function AvatarConfirmModal({
  username,
  avatarConfig,
  alreadyShown,
  onConfirm,
  onCancel,
}: {
  username: string
  avatarConfig: AvatarConfig | null
  activePack: string | null
  alreadyShown: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (alreadyShown) {
    return <SimpleConfirmModal onConfirm={onConfirm} onCancel={onCancel} />
  }
  return (
    <FullConfirmModal
      username={username}
      avatarConfig={avatarConfig}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
