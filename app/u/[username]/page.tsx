import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Flame, Pencil, Lock, Trophy } from 'lucide-react'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { CLASS_META, getClassMilestone } from '@/lib/constants/classes'
import { RARITY_META } from '@/lib/constants/medals'
import { HexMedal } from '@/components/ui/HexMedal'
import type { AvatarConfig, LifeClass, Medal, Rarity } from '@/types/supabase'
import AvatarDisplay from '@/components/avatar/AvatarDisplay'
import { FriendshipButton } from '@/components/social/FriendshipButton'
import type { FriendshipState } from '@/components/social/FriendshipButton'

const LIFE_CLASSES: LifeClass[] = ['fisico', 'mental', 'disciplina']

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')

  const user = session.user

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, global_level, current_streak, feed_public, avatar_config, active_pack')
    .eq('username', username)
    .maybeSingle()

  if (!profile) notFound()

  const isOwner = user?.id === profile.id
  const isPrivate = !(profile.feed_public as boolean) && !isOwner

  const [classProgressRes, friendshipRes, completedMissionsRes] = await Promise.all([
    supabase
      .from('class_progress')
      .select('life_class, points')
      .eq('user_id', profile.id),
    isOwner
      ? Promise.resolve({ data: null })
      : supabase
          .from('friendships')
          .select('id, requester_id, status')
          .or(
            `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),` +
            `and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`
          )
          .maybeSingle(),
    isPrivate
      ? Promise.resolve({ data: [] as { mission_id: string }[] })
      : supabase.from('completed_missions').select('mission_id').eq('user_id', profile.id),
  ])

  const { data: classProgressRows } = classProgressRes

  const pointsByClass = Object.fromEntries(
    (classProgressRows ?? []).map(r => [r.life_class as string, r.points as number])
  )

  // Medals — query after getting completed mission IDs
  const RARITY_ORDER: Record<Rarity, number> = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }
  const uniqueMissionIds = [...new Set((completedMissionsRes.data ?? []).map(r => r.mission_id as string))]
  const medalsRes = (!isPrivate && uniqueMissionIds.length > 0)
    ? await supabase.from('medals').select('*').in('mission_id', uniqueMissionIds)
    : { data: [] as Medal[] }
  const earnedMedals = ((medalsRes.data ?? []) as Medal[]).sort(
    (a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]
  )

  const friendship = friendshipRes.data as { id: string; requester_id: string; status: string } | null
  let friendshipState: FriendshipState | null = null
  if (!isOwner) {
    if (!friendship) {
      friendshipState = { type: 'none', profileId: profile.id }
    } else if (friendship.status === 'accepted') {
      friendshipState = { type: 'friends', friendshipId: friendship.id }
    } else if (friendship.requester_id === user.id) {
      friendshipState = { type: 'pending_sent', friendshipId: friendship.id }
    } else {
      friendshipState = { type: 'pending_received', friendshipId: friendship.id }
    }
  }

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

            {isPrivate ? (
              <div
                className="rounded-card p-6 border border-border/60 flex flex-col items-center gap-3 text-center py-14"
                style={{ background: 'var(--color-surface)' }}
              >
                <Lock size={32} strokeWidth={1.5} style={{ color: 'var(--color-text-muted)' }} aria-hidden />
                <h1 className="text-xl font-semibold text-text-primary">Perfil privado</h1>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Este usuario ha decidido mantener su perfil privado
                </p>
              </div>
            ) : (
            <>
            {/* Page title */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <AvatarDisplay
                  config={profile.avatar_config as AvatarConfig | null}
                  size={80}
                />
                <div>
                  <h1 className="text-2xl font-semibold text-text-primary">
                    {profile.username}
                  </h1>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Perfil público
                  </p>
                </div>
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

              <div className="flex flex-col gap-2 flex-1 min-w-0">
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

              {/* Friendship action */}
              {friendshipState && (
                <div className="flex-shrink-0 ml-auto">
                  <FriendshipButton state={friendshipState} />
                </div>
              )}
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

            {/* Medals section */}
            <div
              className="rounded-card border border-border/60 p-6"
              style={{ background: 'var(--color-surface)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={15} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} aria-hidden />
                <h2 className="text-sm font-semibold text-text-primary">Medallas</h2>
              </div>

              {earnedMedals.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Este jugador aún no tiene medallas
                </p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                  {earnedMedals.map(medal => (
                    <div key={medal.id} className="flex flex-col items-center gap-1.5" title={medal.name}>
                      <div style={{ color: RARITY_META[medal.rarity].color }}>
                        <HexMedal size={36} icon={medal.icon} />
                      </div>
                      <span className="text-[10px] text-center leading-tight truncate w-full" style={{ color: 'var(--color-text-muted)' }}>
                        {medal.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            </>
            )}

          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
