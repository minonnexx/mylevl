import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { AppHeader } from '@/components/ui/AppHeader'
import AchievementDetailView from '@/components/achievements/AchievementDetailView'
import type { Medal, Mission, PackId } from '@/types/supabase'

export default async function AchievementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [profileRes, missionRes, medalRes, completedRes, totalCountRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, global_level, current_streak, active_pack, feed_public, username_changed_at, avatar_config, total_days_active')
      .eq('id', user.id)
      .single(),
    supabase
      .from('missions')
      .select('*')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('medals')
      .select('*')
      .eq('mission_id', id)
      .maybeSingle(),
    supabase
      .from('completed_missions')
      .select('completed_at')
      .eq('user_id', user.id)
      .eq('mission_id', id)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('completed_missions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  if (!missionRes.data) notFound()

  const profile = profileRes.data
  const username          = profile?.username ?? user.email?.split('@')[0] ?? 'jugador'
  const level             = (profile as { global_level?: number } | null)?.global_level ?? 1
  const currentStreak     = (profile as { current_streak?: number } | null)?.current_streak ?? 0
  const totalDaysActive   = (profile as { total_days_active?: number } | null)?.total_days_active ?? 0
  const activePack        = (profile as { active_pack?: string | null } | null)?.active_pack ?? null
  const feedPublic        = (profile as { feed_public?: boolean } | null)?.feed_public ?? true
  const usernameChangedAt = (profile as { username_changed_at?: string | null } | null)?.username_changed_at ?? null
  const avatarConfig      = (profile as { avatar_config?: import('@/types/supabase').AvatarConfig | null } | null)?.avatar_config ?? null

  const totalMissionsCount = totalCountRes.count ?? 0
  const completedAt = (completedRes.data as { completed_at: string } | null)?.completed_at ?? null

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-16 flex-1 min-w-0 flex flex-col min-h-screen">
        <AppHeader
          username={username}
          globalLevel={level}
          profile={{
            username: profile?.username ?? null,
            username_changed_at: usernameChangedAt,
            active_pack: activePack as PackId | null,
            feed_public: feedPublic,
            avatar_config: avatarConfig,
          }}
        />
        <main className="flex-1 py-6 px-4 md:py-8 md:px-8 pb-28 md:pb-8">
          <AchievementDetailView
            mission={missionRes.data as Mission}
            medal={medalRes.data as Medal | null}
            completedAt={completedAt}
            totalDaysActive={totalDaysActive}
            totalMissionsCount={totalMissionsCount}
            currentStreak={currentStreak}
          />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
