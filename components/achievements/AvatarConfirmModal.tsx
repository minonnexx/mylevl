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

export function AvatarConfirmModal({
  username,
  avatarConfig,
  onConfirm,
  onCancel,
}: {
  username: string
  avatarConfig: AvatarConfig | null
  activePack: string | null
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
          await sleep(700)
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
        if (s < segments.length - 1) await sleep(900)
      }
      if (!cancelled) setDone(true)
    }

    run()
    return () => { cancelled = true }
  }, [username])

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
            <button
              onClick={onConfirm}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-component)',
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-text-primary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              Sí, lo he conseguido
            </button>
            <button
              onClick={onCancel}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-component)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 500,
              }}
            >
              Aún no
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
