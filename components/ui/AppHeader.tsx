'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import Link from 'next/link'
import { SettingsDrawer, type SettingsProfile } from './SettingsDrawer'
import AvatarDisplay from '@/components/avatar/AvatarDisplay'

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
        <div style={{ height: 32, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo2.png"
            alt="MyLevl"
            style={{ display: 'block', height: 55, width: 55 }}
          />
        </div>

        <div className="flex items-center gap-3">
          {globalLevel != null && (
            <span className="text-xs font-bold text-accent bg-accent/12 border border-accent/20 px-3 py-1 rounded-pill tabular-nums">
              LVL {globalLevel}
            </span>
          )}
          {username && (
            <Link
              href={`/u/${username}`}
              aria-label={`Ver perfil público de ${username}`}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full transition-opacity hover:opacity-75"
            >
              <AvatarDisplay config={profile.avatar_config} size={40} />
            </Link>
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
