export type AvatarStyle = 'adventurer' | 'pixel-art'

export const ADVENTURER_OPTIONS = {
  hair: ['short01', 'short02', 'short03', 'long01', 'long02', 'long03'],
  hairColors: ['black', 'brown', 'blonde', 'red', 'white'],
  eyes: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05'],
  mouth: ['variant01', 'variant02', 'variant03', 'variant04'],
  skinColors: ['light', 'medium-light', 'medium', 'medium-dark', 'dark'],
}

export const PIXEL_ART_OPTIONS = {
  hair: ['short01', 'short02', 'short03', 'long01', 'long02', 'long03'],
  hairColors: ['black', 'brown', 'blonde', 'red', 'white'],
  eyes: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05'],
  skinColors: ['light', 'medium-light', 'medium', 'medium-dark', 'dark'],
}

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
