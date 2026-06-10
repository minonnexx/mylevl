import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { AppHeader } from '@/components/ui/AppHeader'
import { LeagueDetailView } from '@/components/social/LeagueDetailView'
import { getLeagueDetail } from '@/app/social/actions'
import type { PackId } from '@/types/supabase'

interface Props {
  params: Promise<{ leagueId: string }>
}

export default async function LeagueDetailPage({ params }: Props) {
  const { leagueId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [league, profileRes] = await Promise.all([
    getLeagueDetail(leagueId),
    supabase
      .from('profiles')
      .select('username, global_level, active_pack, feed_public, username_changed_at, avatar_config')
      .eq('id', user.id)
      .single(),
  ])

  if (!league) notFound()

  type SocialProfile = {
    username: string | null
    global_level: number
    active_pack: PackId | null
    feed_public: boolean
    username_changed_at: string | null
    avatar_config: import('@/types/supabase').AvatarConfig | null
  }
  const profileData = profileRes.data as SocialProfile | null

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar />

      <div className="md:ml-16 flex-1 min-w-0 flex flex-col min-h-screen">
        <AppHeader
          username={profileData?.username ?? undefined}
          globalLevel={profileData?.global_level ?? null}
          profile={{
            username: profileData?.username ?? null,
            username_changed_at: profileData?.username_changed_at ?? null,
            active_pack: profileData?.active_pack ?? null,
            feed_public: profileData?.feed_public ?? true,
            avatar_config: profileData?.avatar_config ?? null,
          }}
        />

        <main className="flex-1 py-6 px-4 md:py-8 md:px-8 pb-28 md:pb-8">
          <div className="max-w-[640px] mx-auto">
            <LeagueDetailView league={league} />
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
