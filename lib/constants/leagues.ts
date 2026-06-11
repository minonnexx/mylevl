export const LEAGUE_PRESET_NAMES = [
  'La Hermandad de Hierro',
  'Gremio del Alba',
  'Los Imparables',
  'Orden del Caos',
  'Alianza Legendaria',
  'Los Sin Excusas',
  'Cofradía del Progreso',
  'Pacto de Sangre',
  'Los Elegidos',
  'Gremio Oscuro',
] as const

export type LeaguePresetName = (typeof LEAGUE_PRESET_NAMES)[number]

export const LEAGUE_MOTIVATIONAL_MESSAGES: Record<'top1' | 'top2' | 'top3' | 'mid' | 'last', string> = {
  top1: '¿Quién dijo que los elegidos descansan? Tú lideras. No pares.',
  top2: 'Segundo. Tan cerca que huele a victoria. Un empujón más.',
  top3: 'Podio. Pero el hambre de los terceros no tiene límite.',
  mid: 'En tierra de nadie. O subes o te come la mediocridad.',
  last: 'Último puesto. Perfecto. Ahora no tienes nada que perder.',
}

export const LEAGUE_MAX_MEMBERS = 10
