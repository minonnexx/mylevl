import type { Rarity } from '@/types/supabase'

export const RARITY_META: Record<Rarity, { label: string; color: string }> = {
  common:    { label: 'Común',        color: '#888784' },
  uncommon:  { label: 'Poco común',   color: '#1D9E75' },
  rare:      { label: 'Rara',         color: '#4A90D9' },
  epic:      { label: 'Épica',        color: '#7F77DD' },
  legendary: { label: 'Legendaria',   color: '#D4A843' },
}
