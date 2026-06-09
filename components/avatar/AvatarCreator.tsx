'use client'

import { useState } from 'react'
import AvatarDisplay from './AvatarDisplay'
import {
  SKIN_TONES,
  HAIR_COLORS,
  ADVENTURER_OPTIONS,
  PIXEL_ART_OPTIONS,
  type AvatarStyle,
} from '@/lib/constants/avatar'
import type { AvatarConfig } from '@/types/supabase'

interface Props {
  onComplete: (config: AvatarConfig) => void
  initialConfig?: AvatarConfig | null
}

const SKIN_ORDER = ['light', 'medium-light', 'medium', 'medium-dark', 'dark']
const HAIR_COLOR_ORDER = ['black', 'brown', 'blonde', 'red', 'white']

const PIXEL_ART_PREVIEW: AvatarConfig = {
  style: 'pixel-art',
  gender: 'male',
  skin: 'medium',
  hair: 'short02',
  hairColor: 'brown',
  eyes: 'variant02',
}

const ADVENTURER_PREVIEW: AvatarConfig = {
  style: 'adventurer',
  gender: 'female',
  skin: 'medium-light',
  hair: 'long02',
  hairColor: 'blonde',
  eyes: 'variant03',
  mouth: 'variant02',
}

function hairLabel(style: string): string {
  const prefix = style.startsWith('short') ? 'Corto' : 'Largo'
  const num = style.replace(/\D/g, '')
  return `${prefix} ${num}`
}

function optionLabel(key: string, prefix: string): string {
  const num = key.replace(/\D/g, '')
  return `${prefix} ${num}`
}

const selectedBtn: React.CSSProperties = {
  border: '2px solid var(--color-accent)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
}
const defaultBtn: React.CSSProperties = {
  border: '2px solid var(--color-surface)',
  backgroundColor: 'transparent',
  color: 'var(--color-text-muted)',
}

function TraitButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '8px 0',
        borderRadius: 'var(--radius-component)',
        cursor: 'pointer',
        fontSize: '13px',
        ...(active ? selectedBtn : defaultBtn),
      }}
    >
      {label}
    </button>
  )
}

// ── Step A: style selector ───────────────────────────────────────────────────

function StyleStep({ onSelect }: { onSelect: (s: AvatarStyle) => void }) {
  const [picked, setPicked] = useState<AvatarStyle | null>(null)

  const cardStyle = (s: AvatarStyle): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 12px',
    borderRadius: 'var(--radius-card)',
    backgroundColor: 'var(--color-surface)',
    border: picked === s ? '2px solid var(--color-accent)' : '2px solid transparent',
    cursor: 'pointer',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
          Elige tu estilo
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button style={cardStyle('pixel-art')} onClick={() => setPicked('pixel-art')}>
          <AvatarDisplay config={PIXEL_ART_PREVIEW} size={80} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: picked === 'pixel-art' ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
            Pixel art
          </span>
        </button>

        <button style={cardStyle('adventurer')} onClick={() => setPicked('adventurer')}>
          <AvatarDisplay config={ADVENTURER_PREVIEW} size={80} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: picked === 'adventurer' ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
            Ilustrado
          </span>
        </button>
      </div>

      <button
        onClick={() => picked && onSelect(picked)}
        disabled={!picked}
        style={{
          width: '100%',
          padding: '12px 0',
          borderRadius: 'var(--radius-component)',
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-text-primary)',
          border: 'none',
          cursor: picked ? 'pointer' : 'not-allowed',
          fontSize: '15px',
          fontWeight: 600,
          opacity: picked ? 1 : 0.4,
        }}
      >
        Continuar
      </button>
    </div>
  )
}

// ── Step B: traits editor ────────────────────────────────────────────────────

function TraitsStep({
  style,
  onComplete,
  initialConfig,
}: {
  style: AvatarStyle
  onComplete: (cfg: AvatarConfig) => void
  initialConfig?: AvatarConfig | null
}) {
  const opts = style === 'pixel-art' ? PIXEL_ART_OPTIONS : ADVENTURER_OPTIONS
  const maleHair = opts.hair.filter(h => h.startsWith('short'))
  const femaleHair = opts.hair.filter(h => h.startsWith('long'))

  const [config, setConfig] = useState<AvatarConfig>(() => {
    if (initialConfig && initialConfig.style === style) return initialConfig
    return {
      style,
      gender: 'male',
      skin: 'medium',
      hair: maleHair[0],
      hairColor: 'black',
      eyes: opts.eyes[0],
      mouth: style === 'adventurer' ? ADVENTURER_OPTIONS.mouth[0] : undefined,
    }
  })

  function setGender(gender: 'male' | 'female') {
    const hair = gender === 'male' ? maleHair[0] : femaleHair[0]
    setConfig(prev => ({ ...prev, gender, hair }))
  }

  function set<K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const hairStyles = config.gender === 'male' ? maleHair : femaleHair

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Preview */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <AvatarDisplay config={config} size={120} />
      </div>

      {/* Género */}
      <section>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '8px' }}>Género</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['male', 'female'] as const).map(g => (
            <TraitButton
              key={g}
              label={g === 'male' ? 'Masculino' : 'Femenino'}
              active={config.gender === g}
              onClick={() => setGender(g)}
            />
          ))}
        </div>
      </section>

      {/* Tono de piel */}
      <section>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '8px' }}>Tono de piel</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {SKIN_ORDER.map(tone => (
            <button
              key={tone}
              onClick={() => set('skin', tone)}
              title={tone}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: SKIN_TONES[tone],
                border: config.skin === tone ? '2px solid var(--color-accent)' : '2px solid transparent',
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </section>

      {/* Pelo */}
      <section>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '8px' }}>Pelo</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {hairStyles.map(h => (
            <TraitButton
              key={h}
              label={hairLabel(h)}
              active={config.hair === h}
              onClick={() => set('hair', h)}
            />
          ))}
        </div>
      </section>

      {/* Color de pelo */}
      <section>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '8px' }}>Color de pelo</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {HAIR_COLOR_ORDER.map(color => (
            <button
              key={color}
              onClick={() => set('hairColor', color)}
              title={color}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: HAIR_COLORS[color],
                border: config.hairColor === color ? '2px solid var(--color-accent)' : '2px solid transparent',
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </section>

      {/* Ojos */}
      <section>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '8px' }}>Ojos</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {opts.eyes.map(v => (
            <TraitButton
              key={v}
              label={optionLabel(v, 'Ojos')}
              active={config.eyes === v}
              onClick={() => set('eyes', v)}
            />
          ))}
        </div>
      </section>

      {/* Boca — solo adventurer */}
      {style === 'adventurer' && (
        <section>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '8px' }}>Boca</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {ADVENTURER_OPTIONS.mouth.map(m => (
              <TraitButton
                key={m}
                label={optionLabel(m, 'Boca')}
                active={config.mouth === m}
                onClick={() => set('mouth', m)}
              />
            ))}
          </div>
        </section>
      )}

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

// ── Main component ────────────────────────────────────────────────────────────

export default function AvatarCreator({ onComplete, initialConfig }: Props) {
  const [step, setStep] = useState<'style' | 'traits'>(initialConfig ? 'traits' : 'style')
  const [chosenStyle, setChosenStyle] = useState<AvatarStyle | null>(initialConfig?.style ?? null)

  if (step === 'style') {
    return (
      <StyleStep
        onSelect={s => {
          setChosenStyle(s)
          setStep('traits')
        }}
      />
    )
  }

  return (
    <TraitsStep
      style={chosenStyle!}
      onComplete={onComplete}
      initialConfig={initialConfig}
    />
  )
}
