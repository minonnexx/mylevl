import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Lock } from 'lucide-react'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { PublicProfileContent } from '@/components/profile/PublicProfileContent'
import type { AvatarConfig, LifeClass, Medal, Rarity } from '@/types/supabase'
import type { FriendshipState } from '@/components/social/FriendshipButton'

const RARITY_ORDER: Record<Rarity, number> = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }

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
    .select('id, username, global_level, current_streak, feed_public, avatar_config, active_pack, profile_show_medals, pinned_medals')
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

  const pointsByClass = Object.fromEntries(
    ((classProgressRes.data ?? []) as { life_class: string; points: number }[]).map(r => [r.life_class, r.points])
  )

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
              <PublicProfileContent
                isOwner={isOwner}
                profile={{
                  username: profile.username as string,
                  global_level: profile.global_level as number,
                  current_streak: profile.current_streak as number,
                  avatar_config: profile.avatar_config as AvatarConfig | null,
                  profile_show_medals: (profile.profile_show_medals as boolean) ?? true,
                  pinned_medals: (profile.pinned_medals as string[]) ?? [],
                }}
                classPoints={pointsByClass}
                earnedMedals={earnedMedals}
                friendshipState={friendshipState}
              />
            )}

          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
