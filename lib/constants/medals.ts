import type { Rarity } from '@/types/supabase'

export const RARITY_META: Record<Rarity, { label: string; color: string; bg: string; strokeWidth: number }> = {
  common:    { label: 'Común',        color: '#888784', bg: '#2a2a2a', strokeWidth: 1.5 },
  uncommon:  { label: 'Poco común',   color: '#1D9E75', bg: '#0d2818', strokeWidth: 1.5 },
  rare:      { label: 'Rara',         color: '#4A90D9', bg: '#0d1a2e', strokeWidth: 1.5 },
  epic:      { label: 'Épica',        color: '#7F77DD', bg: '#1a0e2e', strokeWidth: 3   },
  legendary: { label: 'Legendaria',   color: '#D4A843', bg: '#2a1f00', strokeWidth: 3.5 },
}
