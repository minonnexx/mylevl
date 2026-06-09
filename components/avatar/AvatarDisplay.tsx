'use client'

import { createAvatar } from '@dicebear/core'
import { adventurer } from '@dicebear/collection'
import { User } from 'lucide-react'
import { SKIN_TONES, HAIR_COLORS, PACK_OUTFIT_COLORS } from '@/lib/constants/avatar'
import type { AvatarConfig, PackId } from '@/types/supabase'

interface Props {
  config: AvatarConfig | null
  pack: PackId | null
  size?: number
}

export default function AvatarDisplay({ config, pack, size = 80 }: Props) {
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
        }}
      >
        <User size={Math.round(size * 0.45)} color="var(--color-text-muted)" />
      </div>
    )
  }

  const skinHex = SKIN_TONES[config.skin].replace('#', '')
  const hairColorHex = HAIR_COLORS[config.hairColor].replace('#', '')

  const svg = createAvatar(adventurer, {
    seed: `${config.gender}-${config.hair}-${config.skin}-${config.hairColor}-${config.eyes}`,
    backgroundColor: ['transparent'],
    skinColor: [skinHex] as never,
    hair: [config.hair] as never,
    hairColor: [hairColorHex] as never,
    eyes: [config.eyes] as never,
  }).toString()

  const outfitColors = pack ? PACK_OUTFIT_COLORS[pack] : null

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div
        dangerouslySetInnerHTML={{ __html: svg }}
        style={{ width: '100%', height: '100%' }}
      />
      {outfitColors && (
        <svg
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '38%',
            pointerEvents: 'none',
          }}
        >
          <rect x="8" y="10" width="84" height="34" rx="10" fill={outfitColors.primary} />
          <rect x="36" y="2" width="28" height="18" rx="4" fill={outfitColors.secondary} />
        </svg>
      )}
    </div>
  )
}
