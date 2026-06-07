import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Flame, Pencil } from 'lucide-react'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { CLASS_META, getClassMilestone } from '@/lib/constants/classes'
import type { LifeClass } from '@/types/supabase'

const LIFE_CLASSES: LifeClass[] = ['fisico', 'mental', 'disciplina']

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  // Auth optional — check if viewer is the owner
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, global_level, current_streak')
    .eq('username', username)
    .maybeSingle()

  if (!profile) notFound()

  const isOwner = user?.id === profile.id

  const { data: classProgressRows } = await supabase
    .from('class_progress')
    .select('life_class, points')
    .eq('user_id', profile.id)

  const pointsByClass = Object.fromEntries(
    (classProgressRows ?? []).map(r => [r.life_class as string, r.points as number])
  )

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar />

      <div className="md:ml-16 flex-1 min-w-0 flex flex-col min-h-screen">

        {/* Header */}
        <header
          className="sticky top-0 z-20 h-14 px-4 md:px-8 flex items-center justify-between"
          style={{
            background: 'rgba(14,14,16,0.9)',
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
        </header>

        {/* Content */}
        <main className="flex-1 py-6 px-4 md:py-8 md:px-8 pb-28 md:pb-8">
          <div className="max-w-[640px] mx-auto flex flex-col gap-6">

            {/* Page title */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-text-primary">
                  {profile.username}
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Perfil público
                </p>
              </div>
              {isOwner && (
                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 h-9 px-4 rounded-component text-sm font-medium transition-colors flex-shrink-0"
                  style={{
                    background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                    color: 'var(--color-accent)',
                    border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
                  }}
                >
                  <Pencil size={13} aria-hidden />
                  Editar perfil
                </Link>
              )}
            </div>

            {/* Stats card */}
            <div
              className="rounded-card p-6 border border-border/60 flex items-center gap-6"
              style={{ background: 'var(--color-surface)' }}
            >
              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-card flex items-center justify-center flex-shrink-0 text-lg font-bold"
                style={{
                  background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                  color: 'var(--color-accent)',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
                }}
              >
                {(profile.username ?? 'JU').slice(0, 2).toUpperCase()}
              </div>

              <div className="flex flex-col gap-2">
                {/* Level badge */}
                <span
                  className="self-start text-xs font-bold px-3 py-1 rounded-pill tabular-nums"
                  style={{
                    color: 'var(--color-accent)',
                    background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
                  }}
                >
                  LVL {profile.global_level}
                </span>

                {/* Streak */}
                {(profile.current_streak as number) > 0 && (
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    <Flame size={14} aria-hidden />
                    <span>
                      <span className="font-semibold text-text-primary">{profile.current_streak}</span>
                      {' días de racha'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Class milestones */}
            <div
              className="rounded-card p-6 border border-border/60"
              style={{ background: 'var(--color-surface)' }}
            >
              <p
                className="text-[11px] font-medium uppercase tracking-wider mb-4"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Clases de vida
              </p>
              <div className="flex flex-wrap gap-2">
                {LIFE_CLASSES.map(lc => {
                  const meta = CLASS_META[lc]
                  const points = pointsByClass[lc] ?? 0
                  const milestone = getClassMilestone(points)
                  return (
                    <span
                      key={lc}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-pill ${meta.badgeClasses}`}
                    >
                      {meta.label}
                      <span className="opacity-60">·</span>
                      {milestone}
                    </span>
                  )
                })}
              </div>
            </div>

          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
