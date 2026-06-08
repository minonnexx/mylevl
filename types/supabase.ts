export type LifeClass = 'fisico' | 'mental' | 'disciplina'
export type MissionDifficulty = 'easy' | 'medium' | 'hard' | 'boss'
export type MissionType = 'daily' | 'streak' | 'achievement' | 'boss'
export type VerificationType = 'healthkit' | 'health_connect' | 'manual'
export type PackId = 'guerrero' | 'sabio' | 'monje' | 'heroe'

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
  feed_public: boolean
  date_of_birth: string | null
  username_changed_at: string | null
  active_pack: 'guerrero' | 'sabio' | 'monje' | 'heroe' | null
  created_at: string
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted'
  created_at: string
}

export interface SocialFeedEvent {
  id: string
  user_id: string
  event_type: 'mission_completed' | 'level_up' | 'streak_milestone'
  metadata: {
    mission_title?: string
    life_class?: string
    xp_reward?: number
    new_level?: number
    streak_days?: number
  }
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
  pack: string | null
}

export interface ClassProgress {
  id: string
  user_id: string
  life_class: LifeClass
  points: number
}
