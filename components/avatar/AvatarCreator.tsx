'use client'

import { useState } from 'react'
import AvatarDisplay from './AvatarDisplay'
import {
  SKIN_TONES,
  HAIR_COLORS,
  HAIR_STYLES_MALE,
  HAIR_STYLES_FEMALE,
} from '@/lib/constants/avatar'
import type { AvatarConfig } from '@/types/supabase'

interface Props {
  onComplete: (config: AvatarConfig) => void
}

const DEFAULT_CONFIG: AvatarConfig = {
  gender: 'male',
  skin: 'medium',
  hair: HAIR_STYLES_MALE[0],
  hairColor: 'black',
  eyes: 'variant01',
}

const SKIN_ORDER = ['light', 'medium-light', 'medium', 'medium-dark', 'dark'] as const
const HAIR_COLOR_ORDER = ['black', 'brown', 'blonde', 'red', 'white'] as const
const EYE_LABELS: Record<string, string> = {
  variant01: 'Ojos 1',
  variant02: 'Ojos 2',
  variant03: 'Ojos 3',
}

function hairLabel(style: string): string {
  const prefix = style.startsWith('short') ? 'Corto' : 'Largo'
  const num = style.replace(/[a-z]/g, '')
  return `${prefix} ${num}`
}

export default function AvatarCreator({ onComplete }: Props) {
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_CONFIG)

  function setGender(gender: AvatarConfig['gender']) {
    const styles = gender === 'male' ? HAIR_STYLES_MALE : HAIR_STYLES_FEMALE
    setConfig((prev) => ({ ...prev, gender, hair: styles[0] }))
  }

  function set<K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const hairStyles = config.gender === 'male' ? HAIR_STYLES_MALE : HAIR_STYLES_FEMALE

  const selectedBorder = '2px solid var(--color-accent)'
  const defaultBorder = '2px solid transparent'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Preview */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <AvatarDisplay config={config} pack={null} size={120} />
      </div>

      {/* Género */}
      <section>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '8px' }}>
          Género
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['male', 'female'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 'var(--radius-component)',
                border: config.gender === g ? selectedBorder : '2px solid var(--color-surface)',
                backgroundColor:
                  config.gender === g ? 'var(--color-surface)' : 'transparent',
                color:
                  config.gender === g
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {g === 'male' ? 'Masculino' : 'Femenino'}
            </button>
          ))}
        </div>
      </section>

      {/* Tono de piel */}
      <section>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '8px' }}>
          Tono de piel
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {SKIN_ORDER.map((tone) => (
            <button
              key={tone}
              onClick={() => set('skin', tone)}
              title={tone}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: SKIN_TONES[tone],
                border: config.skin === tone ? selectedBorder : defaultBorder,
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      </section>

      {/* Pelo */}
      <section>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '8px' }}>
          Pelo
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {hairStyles.map((style) => (
            <button
              key={style}
              onClick={() => set('hair', style)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 'var(--radius-component)',
                border:
                  config.hair === style ? selectedBorder : '2px solid var(--color-surface)',
                backgroundColor:
                  config.hair === style ? 'var(--color-surface)' : 'transparent',
                color:
                  config.hair === style
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {hairLabel(style)}
            </button>
          ))}
        </div>
      </section>

      {/* Color de pelo */}
      <section>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '8px' }}>
          Color de pelo
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {HAIR_COLOR_ORDER.map((color) => (
            <button
              key={color}
              onClick={() => set('hairColor', color)}
              title={color}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: HAIR_COLORS[color],
                border: config.hairColor === color ? selectedBorder : defaultBorder,
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      </section>

      {/* Ojos */}
      <section>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '8px' }}>
          Ojos
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['variant01', 'variant02', 'variant03'] as const).map((v) => (
            <button
              key={v}
              onClick={() => set('eyes', v)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 'var(--radius-component)',
                border: config.eyes === v ? selectedBorder : '2px solid var(--color-surface)',
                backgroundColor:
                  config.eyes === v ? 'var(--color-surface)' : 'transparent',
                color:
                  config.eyes === v
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {EYE_LABELS[v]}
            </button>
          ))}
        </div>
      </section>

      {/* Continuar */}
      <button
        onClick={() => onComplete(config)}
        style={{
          width: '100%',
          padding: '12px 0',
          borderRadius: 'var(--radius-component)',
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-text-primary)',
          border: 'none',
          cursor: 'pointer',
          fontSize: '15px',
          fontWeight: 600,
          marginTop: '8px',
        }}
      >
        Continuar
      </button>
    </div>
  )
}
