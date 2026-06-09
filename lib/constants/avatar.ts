export const SKIN_TONES: Record<string, string> = {
  light: '#FDDBB4',
  'medium-light': '#E8B88A',
  medium: '#C68642',
  'medium-dark': '#8D5524',
  dark: '#4A2912',
}

export const HAIR_COLORS: Record<string, string> = {
  black: '#1a1a1a',
  brown: '#6B3A2A',
  blonde: '#D4A843',
  red: '#A0522D',
  white: '#E8E8E8',
}

export const HAIR_STYLES_MALE = ['short01', 'short02', 'short03'] as const
export const HAIR_STYLES_FEMALE = ['long01', 'long02', 'long03'] as const

export const PACK_OUTFIT_COLORS: Record<string, { primary: string; secondary: string }> = {
  guerrero: { primary: '#8B0000', secondary: '#4A4A4A' },
  sabio: { primary: '#4A0E8F', secondary: '#1A1A6E' },
  monje: { primary: '#1A1A1A', secondary: '#2A2A2A' },
  heroe: { primary: '#7F77DD', secondary: '#8B0000' },
}
