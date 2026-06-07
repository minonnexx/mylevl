export type LifeClass = 'fisico' | 'mental' | 'disciplina'
export type MissionDifficulty = 'easy' | 'medium' | 'hard' | 'boss'
export type MissionType = 'daily' | 'streak' | 'achievement' | 'boss'
export type VerificationType = 'healthkit' | 'health_connect' | 'manual'

export interface Profile {
  id: string
  username: string | null
  onboarding_completed: boolean
  global_level: number
  current_xp: number
  xp_to_next_level: number
  current_streak: number
  longest_streak: number
  total_days_active: number
  shield_count: number
  shield_active?: boolean
  shield_used_at: string | null
  shield_notification_shown: boolean
  created_at: string
}

export interface Mission {
  id: string
  title: string
  description: string | null
  life_class: LifeClass
  difficulty: MissionDifficulty
  type: MissionType
  xp_reward: number
  verification: VerificationType
  required_level: number
  sort_order: number | null
}

export interface ClassProgress {
  id: string
  user_id: string
  life_class: LifeClass
  points: number
}
