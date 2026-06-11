'use client'

import { useEffect, useState } from 'react'
import AvatarDisplay from '@/components/avatar/AvatarDisplay'
import type { AvatarConfig } from '@/types/supabase'

const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms))

interface Props {
  message: string
  avatarConfig: AvatarConfig | null
  size?: number
}

export function AvatarSpeechBubble({ message, avatarConfig, size = 48 }: Props) {
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    setText('')
    setDone(false)

    async function run() {
      for (let i = 0; i <= message.length; i++) {
        if (cancelled) return
        setText(message.slice(0, i))
        if (i === message.length) {
          setDone(true)
          return
        }
        await sleep(44)
      }
    }

    run()
    return () => { cancelled = true }
  }, [message])

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
      <AvatarDisplay config={avatarConfig} size={size} />
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid color-mix(in srgb, var(--color-border) 60%, transparent)',
          borderRadius: 'var(--radius-card)',
          padding: '10px 14px',
          flex: 1,
        }}
      >
        <p
          style={{
            color: 'var(--color-text-primary)',
            fontSize: '13px',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            margin: 0,
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
      </div>
    </div>
  )
}
