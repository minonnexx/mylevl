import {
  Lock, Shield, Star, Zap, Award, Target, Flame, Crown,
  Swords, Trophy, BookOpen, Dumbbell, CheckCircle2, Sunrise,
  Moon, Brain, Leaf, Wind, Heart, Timer, Medal,
  Footprints, WifiOff, Library,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Rarity } from '@/types/supabase'
import { RARITY_META } from '@/lib/constants/medals'

const MEDAL_ICONS: Record<string, LucideIcon> = {
  Shield, Star, Zap, Award, Target, Flame, Crown, Swords, Trophy,
  BookOpen, Dumbbell, CheckCircle2, Sunrise, Moon, Brain, Leaf, Wind,
  Heart, Timer, Medal, Footprints, WifiOff, Library,
}

export function HexMedal({
  locked = false,
  icon,
  rarity,
  size = 40,
}: {
  locked?: boolean
  icon?: string
  rarity?: Rarity
  size?: number
}) {
  const h = Math.round(size * 1.15)
  const iconSize = Math.round(size * 0.42)
  const IconComponent: LucideIcon | null = icon ? (MEDAL_ICONS[icon] ?? null) : null

  const rarityData = rarity ? RARITY_META[rarity] : null

  const borderColor   = locked ? '#444' : (rarityData?.color ?? 'currentColor')
  const fillColor     = locked ? '#1a1a1a' : (rarityData?.bg ?? 'currentColor')
  const fillOpacity   = rarityData || locked ? 1 : 0.18
  const strokeOpacity = locked ? 0.4 : 1
  const strokeWidth   = locked ? 1.5 : (rarityData?.strokeWidth ?? 1.5)
  const iconColor     = locked ? '#555' : borderColor

  return (
    <svg viewBox="0 0 40 46" width={size} height={h} aria-hidden style={{ display: 'block', flexShrink: 0 }}>
      <polygon
        points="20,0 40,12 40,34 20,46 0,34 0,12"
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={borderColor}
        strokeOpacity={strokeOpacity}
        strokeWidth={strokeWidth}
      />
      {locked ? (
        <foreignObject x="0" y="0" width="40" height="46">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              color: iconColor,
            }}
          >
            <Lock size={iconSize} strokeWidth={1.75} />
          </div>
        </foreignObject>
      ) : IconComponent ? (
        <foreignObject x="0" y="0" width="40" height="46">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              color: iconColor,
            }}
          >
            <IconComponent size={iconSize} strokeWidth={1.5} />
          </div>
        </foreignObject>
      ) : null}
    </svg>
  )
}
