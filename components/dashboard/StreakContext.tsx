'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

type StreakContextValue = {
  streak: number
  setStreak: (streak: number) => void
}

const StreakContext = createContext<StreakContextValue | null>(null)

export function StreakProvider({
  initialStreak,
  children,
}: {
  initialStreak: number
  children: ReactNode
}) {
  const [streak, setStreak] = useState(initialStreak)
  return (
    <StreakContext.Provider value={{ streak, setStreak }}>
      {children}
    </StreakContext.Provider>
  )
}

export function useStreak() {
  const ctx = useContext(StreakContext)
  if (!ctx) throw new Error('useStreak debe usarse dentro de StreakProvider')
  return ctx
}
