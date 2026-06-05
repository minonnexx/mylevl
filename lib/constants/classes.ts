import type { LifeClass } from '@/types/supabase'

export interface ClassMetaEntry {
  key:          LifeClass
  label:        string
  color:        string  // var(--color-xxx) — main class color for inline styles
  borderColor:  string  // var(--color-xxx) — for inline border styles
  bgColor:      string  // var(--color-xxx) — for inline background styles
  badgeClasses: string  // Tailwind classes: border + text/bg/border-color tokens
}

export const CLASS_META: Record<LifeClass, ClassMetaEntry> = {
  fisico: {
    key:          'fisico',
    label:        'Físico',
    color:        'var(--color-fisico)',
    borderColor:  'var(--color-fisico)',
    bgColor:      'var(--color-fisico)',
    badgeClasses: 'border text-fisico bg-fisico/10 border-fisico/25',
  },
  mental: {
    key:          'mental',
    label:        'Mental',
    color:        'var(--color-mental)',
    borderColor:  'var(--color-mental)',
    bgColor:      'var(--color-mental)',
    badgeClasses: 'border text-mental bg-mental/10 border-mental/25',
  },
  disciplina: {
    key:          'disciplina',
    label:        'Disciplina',
    color:        'var(--color-disciplina)',
    borderColor:  'var(--color-disciplina)',
    bgColor:      'var(--color-disciplina)',
    badgeClasses: 'border text-disciplina bg-disciplina/10 border-disciplina/25',
  },
}

// ─── Class milestones ─────────────────────────────────────────────────────────
// Each entry: min (inclusive), max (inclusive), title displayed in UI.
// Leyenda has no upper bound (max = Infinity).
export const CLASS_MILESTONES = [
  { min: 0,   max: 49,       title: 'Iniciado'    },
  { min: 50,  max: 149,      title: 'Practicante' },
  { min: 150, max: 349,      title: 'Experto'     },
  { min: 350, max: 699,      title: 'Maestro'     },
  { min: 700, max: Infinity, title: 'Leyenda'     },
] as const

export type MilestoneTitle = typeof CLASS_MILESTONES[number]['title']

/** Returns the milestone title for a given points total. */
export function getClassMilestone(points: number): MilestoneTitle {
  return (CLASS_MILESTONES.find(m => points >= m.min && points <= m.max)?.title ?? 'Iniciado') as MilestoneTitle
}

/** Returns the milestone title, progress % within that milestone, and the points threshold for the next milestone (null at Leyenda). */
export function getMilestoneProgress(points: number): {
  title: MilestoneTitle
  pct: number
  nextAt: number | null
} {
  if (points < 50)  return { title: 'Iniciado',    pct: (points / 50) * 100,           nextAt: 50  }
  if (points < 150) return { title: 'Practicante', pct: ((points - 50) / 100) * 100,   nextAt: 150 }
  if (points < 350) return { title: 'Experto',     pct: ((points - 150) / 200) * 100,  nextAt: 350 }
  if (points < 700) return { title: 'Maestro',     pct: ((points - 350) / 350) * 100,  nextAt: 700 }
  return { title: 'Leyenda', pct: 100, nextAt: null }
}

/** Returns 0–4 index for the milestone tier (used for lagging comparisons). */
export function getMilestoneTier(points: number): number {
  if (points < 50)  return 0
  if (points < 150) return 1
  if (points < 350) return 2
  if (points < 700) return 3
  return 4
}
