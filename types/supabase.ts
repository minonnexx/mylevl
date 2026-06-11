export type LifeClass = 'fisico' | 'mental' | 'disciplina'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface Medal {
  id: string
  mission_id: string
  name: string
  icon: string
  rarity: Rarity
  unlock_percentage: number
  created_at: string
}

export interface AvatarConfig {
  style: 'adventurer' | 'pixel-art'
  gender: 'male' | 'female'
  skin: string
  hair: string
  hairColor: string
  eyes: string
  mouth?: string
}
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
  avatar_confirmation_shown: boolean
  feed_public: boolean
  date_of_birth: string | null
  username_changed_at: string | null
  active_pack: 'guerrero' | 'sabio' | 'monje' | 'heroe' | null
  avatar_config: AvatarConfig | null
  profile_show_medals?: boolean
  pinned_medals?: string[]
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
  verification_type: 'automatic' | 'manual' | 'external'
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

export interface League {
  id: string
  name: string
  created_by: string
  created_at: string
}

export interface LeagueMember {
  id: string
  league_id: string
  user_id: string
  status: 'pending' | 'accepted'
  joined_at: string
}

export interface LeagueWeeklyStat {
  id: string
  league_id: string
  user_id: string
  week_start: string
  xp_earned: number
  missions_completed: number
}

export interface WeeklyChallenge {
  id: string
  week_start: string
  challenge_key: string
  created_at: string
}

export interface ChallengeCompletion {
  id: string
  user_id: string
  week_start: string
  completed_at: string
}
