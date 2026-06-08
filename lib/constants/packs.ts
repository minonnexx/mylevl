import type { PackId } from '@/types/supabase'

export type { PackId }

export interface PackMeta {
  id: PackId
  label: string
  subtitle: string
  missions: string[]
}

export const PACK_META: Record<PackId, PackMeta> = {
  guerrero: {
    id: 'guerrero',
    label: 'Guerrero',
    subtitle: 'Entrena tu cuerpo',
    missions: [
      'Entrena 30 minutos',
      'Correr 5 km',
      '100 flexiones al día',
      'Entrenamiento de fuerza',
      'Día de movilidad activa',
    ],
  },
  sabio: {
    id: 'sabio',
    label: 'Sabio',
    subtitle: 'Entrena tu mente',
    missions: [
      'Lee 20 páginas',
      'Estudia 45 minutos',
      'Aprende algo nuevo',
      'Practica escritura reflexiva',
      'Resuelve un problema complejo',
    ],
  },
  monje: {
    id: 'monje',
    label: 'Monje',
    subtitle: 'Entrena tu disciplina',
    missions: [
      'Meditar 10 minutos',
      'Sin móvil 2 horas',
      'Dormir 7-9 horas',
      'Levantarse antes de las 7h',
      'Día sin redes sociales',
    ],
  },
  heroe: {
    id: 'heroe',
    label: 'Héroe',
    subtitle: 'Entrénalo todo',
    missions: [
      'Entrena 30 minutos',
      'Lee 20 páginas',
      'Meditar 10 minutos',
      'Estudia 45 minutos',
      'Sin móvil 2 horas',
      'Dormir 7-9 horas',
    ],
  },
}

export const PACK_LIST: PackMeta[] = [
  PACK_META.guerrero,
  PACK_META.sabio,
  PACK_META.monje,
  PACK_META.heroe,
]
