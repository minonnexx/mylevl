'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
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
  boxShadow: '0 0 8px rgba(127,119,221,0.25)',
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
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
        ...(active ? selectedBtn : defaultBtn),
      }}
    >
      {label}
    </button>
  )
}

// ── Step A: style selector ───────────────────────────────────────────────────

function StyleStep({ onSelect, initial }: { onSelect: (s: AvatarStyle) => void; initial?: AvatarStyle | null }) {
  const [picked, setPicked] = useState<AvatarStyle | null>(initial ?? null)

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
    boxShadow: picked === s ? '0 0 16px rgba(127,119,221,0.2)' : 'none',
    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
  })

  const styles: AvatarStyle[] = ['pixel-art', 'adventurer']
  const previews: Record<AvatarStyle, AvatarConfig> = {
    'pixel-art': PIXEL_ART_PREVIEW,
    'adventurer': ADVENTURER_PREVIEW,
  }
  const labels: Record<AvatarStyle, string> = {
    'pixel-art': 'Pixel art',
    'adventurer': 'Ilustrado',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
          Elige tu estilo
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        {styles.map((s, i) => (
          <motion.button
            key={s}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3, ease: 'easeOut' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={cardStyle(s)}
            onClick={() => setPicked(s)}
          >
            <AvatarDisplay config={previews[s]} size={80} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: picked === s ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
              {labels[s]}
            </span>
          </motion.button>
        ))}
      </div>

      <motion.button
        whileHover={picked ? { boxShadow: '0 0 16px rgba(127,119,221,0.35)' } : {}}
        whileTap={picked ? { scale: 0.97 } : {}}
        onClick={() => picked && onSelect(picked)}
        disabled={!picked}
        style={{
          width: '100%',
          padding: '12px 0',
          borderRadius: 'var(--radius-component)',
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-text-primary)',
          border: '1.5px solid rgba(127,119,221,0.4)',
          cursor: picked ? 'pointer' : 'not-allowed',
          fontSize: '15px',
          fontWeight: 600,
          opacity: picked ? 1 : 0.4,
          transition: 'box-shadow 0.15s ease',
        }}
      >
        Continuar
      </motion.button>
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
  const avatarKey = `${config.hair}-${config.skin}-${config.hairColor}-${config.eyes}-${config.mouth ?? ''}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Preview — re-anima al cambiar rasgos */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <motion.div
          key={avatarKey}
          initial={{ scale: 0.92, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <AvatarDisplay config={config} size={120} />
        </motion.div>
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
          {SKIN_ORDER.map(tone => {
            const isActive = config.skin === tone
            return (
              <button
                key={tone}
                onClick={() => set('skin', tone)}
                title={tone}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: SKIN_TONES[tone],
                  border: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                  outline: isActive ? '2px solid rgba(127,119,221,0.4)' : '2px solid transparent',
                  outlineOffset: '2px',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                  transform: isActive ? 'scale(1.12)' : 'scale(1)',
                  transition: 'transform 0.15s ease, border-color 0.15s ease, outline-color 0.15s ease',
                }}
              />
            )
          })}
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
          {HAIR_COLOR_ORDER.map(color => {
            const isActive = config.hairColor === color
            return (
              <button
                key={color}
                onClick={() => set('hairColor', color)}
                title={color}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: HAIR_COLORS[color],
                  border: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                  outline: isActive ? '2px solid rgba(127,119,221,0.4)' : '2px solid transparent',
                  outlineOffset: '2px',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                  transform: isActive ? 'scale(1.12)' : 'scale(1)',
                  transition: 'transform 0.15s ease, border-color 0.15s ease, outline-color 0.15s ease',
                }}
              />
            )
          })}
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

      <motion.button
        whileHover={{ boxShadow: '0 0 16px rgba(127,119,221,0.35)' }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onComplete(config)}
        style={{
          width: '100%',
          padding: '12px 0',
          borderRadius: 'var(--radius-component)',
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-text-primary)',
          border: '1.5px solid rgba(127,119,221,0.4)',
          cursor: 'pointer',
          fontSize: '15px',
          fontWeight: 600,
          marginTop: '8px',
          transition: 'box-shadow 0.15s ease',
        }}
      >
        Continuar
      </motion.button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AvatarCreator({ onComplete, initialConfig }: Props) {
  const [step, setStep] = useState<'style' | 'traits'>('style')
  const [chosenStyle, setChosenStyle] = useState<AvatarStyle | null>(null)

  if (step === 'style') {
    return (
      <StyleStep
        initial={initialConfig?.style}
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
      initialConfig={chosenStyle === initialConfig?.style ? initialConfig : null}
    />
  )
}
