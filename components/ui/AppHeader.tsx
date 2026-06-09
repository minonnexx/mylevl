'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { SettingsDrawer, type SettingsProfile } from './SettingsDrawer'

interface AppHeaderProps {
  username?: string | null
  globalLevel?: number | null
  profile: SettingsProfile
}

export function AppHeader({ username, globalLevel, profile }: AppHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <header
        className="sticky top-0 z-20 h-14 px-4 md:px-8 flex items-center justify-between"
        style={{
          background: 'color-mix(in srgb, var(--color-background) 90%, transparent)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-accent" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          <span className="font-semibold text-text-primary tracking-tight">mylevl</span>
        </div>

        <div className="flex items-center gap-3">
          {username && (
            <span className="text-xs text-text-muted">{username}</span>
          )}
          {globalLevel != null && (
            <span className="text-xs font-bold text-accent bg-accent/12 border border-accent/20 px-3 py-1 rounded-pill tabular-nums">
              LVL {globalLevel}
            </span>
          )}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir ajustes"
            className="flex items-center justify-center w-8 h-8 rounded-component transition-colors hover:bg-surface-elevated"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Settings size={16} aria-hidden />
          </button>
        </div>
      </header>

      <SettingsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        profile={profile}
      />
    </>
  )
}
