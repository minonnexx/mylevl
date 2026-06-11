export type ChallengeType = 'count' | 'streak' | 'xp'

export interface ChallengeDefinition {
  key: string
  title: string
  description: string
  type: ChallengeType
  life_class?: 'fisico' | 'mental' | 'disciplina'
  target: number
  xp_reward: number
  medal_name: string
  medal_icon: string
}

export const CHALLENGE_POOL: ChallengeDefinition[] = [
  {
    key: 'fisico_5',
    title: 'Guerrero de la semana',
    description: 'Completa 5 misiones físicas esta semana',
    type: 'count',
    life_class: 'fisico',
    target: 5,
    xp_reward: 150,
    medal_name: 'Guerrero Semanal',
    medal_icon: 'Dumbbell',
  },
  {
    key: 'streak_5',
    title: 'Imparable',
    description: 'Completa al menos una misión durante 5 días consecutivos esta semana',
    type: 'streak',
    target: 5,
    xp_reward: 200,
    medal_name: 'Imparable',
    medal_icon: 'Zap',
  },
  {
    key: 'xp_200',
    title: 'Cosechador de XP',
    description: 'Gana 200 XP esta semana',
    type: 'xp',
    target: 200,
    xp_reward: 100,
    medal_name: 'Cosechador',
    medal_icon: 'Star',
  },
  {
    key: 'mental_5',
    title: 'Mente de acero',
    description: 'Completa 5 misiones mentales esta semana',
    type: 'count',
    life_class: 'mental',
    target: 5,
    xp_reward: 150,
    medal_name: 'Mente de Acero',
    medal_icon: 'Brain',
  },
]

export function getChallengeByWeekNumber(weekNumber: number): ChallengeDefinition {
  return CHALLENGE_POOL[weekNumber % CHALLENGE_POOL.length]
}
