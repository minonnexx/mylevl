import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import AchievementsClient from '@/components/achievements/AchievementsClient'
import { AppHeader } from '@/components/ui/AppHeader'
import type { PackId } from '@/types/supabase'

export default async function AchievementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [profileRes, achievementsRes, bossRes, completedRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, global_level, current_streak, active_pack, feed_public, username_changed_at, avatar_config')
      .eq('id', user.id)
      .single(),
    supabase
      .from('missions')
      .select('*')
      .eq('type', 'achievement')
      .order('life_class')
      .order('xp_reward'),
    supabase
      .from('missions')
      .select('*')
      .eq('type', 'boss')
      .order('xp_reward'),
    supabase
      .from('completed_missions')
      .select('mission_id, completed_at')
      .eq('user_id', user.id),
  ])

  const profile          = profileRes.data
  const username         = profile?.username ?? user.email?.split('@')[0] ?? 'jugador'
  const level            = (profile as { global_level?: number } | null)?.global_level ?? 1
  const currentStreak    = (profile as { current_streak?: number } | null)?.current_streak ?? 0
  const activePack       = (profile as { active_pack?: string | null } | null)?.active_pack ?? null
  const feedPublic       = (profile as { feed_public?: boolean } | null)?.feed_public ?? true
  const usernameChangedAt = (profile as { username_changed_at?: string | null } | null)?.username_changed_at ?? null
  const avatarConfig = (profile as { avatar_config?: import('@/types/supabase').AvatarConfig | null } | null)?.avatar_config ?? null

  // Build map: mission_id → most recent completed_at
  const completedMap: Record<string, string> = {}
  for (const row of completedRes.data ?? []) {
    const existing = completedMap[row.mission_id as string]
    const current  = row.completed_at as string
    if (!existing || current > existing) {
      completedMap[row.mission_id as string] = current
    }
  }

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
          <div className="max-w-[1100px] mx-auto">
            <AchievementsClient
              achievements={achievementsRes.data ?? []}
              bossMissions={bossRes.data ?? []}
              completedMap={completedMap}
              currentStreak={currentStreak}
            />
          </div>
        </main>

      </div>

      <BottomNav />
    </div>
  )
}
