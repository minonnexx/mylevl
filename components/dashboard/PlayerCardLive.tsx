'use client'

import type { ComponentProps } from 'react'
import { PlayerCard } from './PlayerCard'
import { useStreak } from './StreakContext'

export function PlayerCardLive(props: Omit<ComponentProps<typeof PlayerCard>, 'currentStreak'>) {
  const { streak } = useStreak()
  return <PlayerCard {...props} currentStreak={streak} />
}
