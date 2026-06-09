import {
  Lock, Shield, Star, Zap, Award, Target, Flame, Crown,
  Swords, Trophy, BookOpen, Dumbbell, CheckCircle2, Sunrise,
  Moon, Brain, Leaf, Wind, Heart, Timer, Medal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// All icons that can appear inside a medal hex.
// Add new entries here when new medals are created in the DB.
const MEDAL_ICONS: Record<string, LucideIcon> = {
  Shield,
  Star,
  Zap,
  Award,
  Target,
  Flame,
  Crown,
  Swords,
  Trophy,
  BookOpen,
  Dumbbell,
  CheckCircle2,
  Sunrise,
  Moon,
  Brain,
  Leaf,
  Wind,
  Heart,
  Timer,
  Medal,
}

/**
 * Hexagonal medal shape.
 * Inherits `color` from its parent — set `style={{ color: '...' }}` on the wrapper.
 * Lock icon is shown when `locked`. Medal icon (Lucide name) shown when `icon` is provided.
 */
export function HexMedal({
  locked = false,
  icon,
  size = 40,
}: {
  locked?: boolean
  icon?: string
  size?: number
}) {
  const h = Math.round(size * 1.15)
  const iconSize = Math.round(size * 0.42)
  const IconComponent: LucideIcon | null = icon ? (MEDAL_ICONS[icon] ?? null) : null

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: h }}>
      <svg viewBox="0 0 40 46" width={size} height={h} aria-hidden>
        <polygon
          points="20,0 40,12 40,34 20,46 0,34 0,12"
          fill="currentColor"
          fillOpacity={locked ? 0.07 : 0.18}
          stroke="currentColor"
          strokeOpacity={locked ? 0.25 : 0.65}
          strokeWidth={1.5}
        />
      </svg>
      {locked ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock size={iconSize} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} aria-hidden />
        </div>
      ) : IconComponent ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <IconComponent size={iconSize} strokeWidth={1.5} aria-hidden />
        </div>
      ) : null}
    </div>
  )
}
