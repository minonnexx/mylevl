'use client'

import { createAvatar } from '@dicebear/core'
import { adventurer, pixelArt } from '@dicebear/collection'
import { User } from 'lucide-react'
import { SKIN_TONES, HAIR_COLORS } from '@/lib/constants/avatar'
import type { AvatarConfig } from '@/types/supabase'

interface Props {
  config: AvatarConfig | null
  size?: number
}

export default function AvatarDisplay({ config, size = 80 }: Props) {
  if (!config) {
    return (
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: 'var(--color-surface)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <User size={Math.round(size * 0.45)} color="var(--color-text-muted)" />
      </div>
    )
  }

  const skinHex = (SKIN_TONES[config.skin] ?? '#C68642').replace('#', '')
  const hairColorHex = (HAIR_COLORS[config.hairColor] ?? '#1a1a1a').replace('#', '')
  const styleEngine = config.style === 'pixel-art' ? pixelArt : adventurer

  const options: Record<string, unknown> = {
    seed: [config.style, config.gender, config.hair, config.skin, config.hairColor, config.eyes, config.mouth ?? ''].join('-'),
    backgroundColor: ['transparent'],
    skinColor: [skinHex],
    hair: [config.hair],
    hairColor: [hairColorHex],
    eyes: [config.eyes],
  }

  if (config.mouth && config.style === 'adventurer') {
    options.mouth = [config.mouth]
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svgRaw = createAvatar(styleEngine as any, { ...options, size } as any).toString()
  // Replace fixed pixel dimensions on the <svg> element so it fills the container;
  // viewBox is preserved for correct scaling.
  const svg = svgRaw
    .replace(/(<svg[^>]*)\swidth="[^"]*"/, '$1 width="100%"')
    .replace(/(<svg[^>]*)\sheight="[^"]*"/, '$1 height="100%"')

  return (
    <div style={{ width: size, height: size, flexShrink: 0, overflow: 'hidden' }}>
      <div
        dangerouslySetInnerHTML={{ __html: svg }}
        style={{ width: '100%', height: '100%', lineHeight: 0, display: 'block' }}
      />
    </div>
  )
}
