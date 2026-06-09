import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { FriendSearch } from '@/components/social/FriendSearch'
import { PendingRequests } from '@/components/social/PendingRequests'
import { FriendList } from '@/components/social/FriendList'
import { FeedItem } from '@/components/social/FeedItem'
import { getFeed, getFriends, getPendingRequests } from '@/app/social/actions'
import type { FeedEventItem } from '@/components/social/FeedItem'
import { AppHeader } from '@/components/ui/AppHeader'
import type { PackId } from '@/types/supabase'

export default async function SocialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [feedRaw, friends, pendingRequests, profileRes] = await Promise.all([
    getFeed(),
    getFriends(),
    getPendingRequests(),
    supabase.from('profiles').select('username, active_pack, feed_public, username_changed_at, avatar_config').eq('id', user.id).single(),
  ])

  type SocialProfile = { username: string | null; active_pack: PackId | null; feed_public: boolean; username_changed_at: string | null; avatar_config: import('@/types/supabase').AvatarConfig | null }
  const profileData = profileRes.data as SocialProfile | null
  const feedPublic = profileData?.feed_public ?? true
  const feed = feedRaw as unknown as FeedEventItem[]

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar />

      <div className="md:ml-16 flex-1 min-w-0 flex flex-col min-h-screen">

        <AppHeader
          username={profileData?.username ?? undefined}
          profile={{
            username: profileData?.username ?? null,
            username_changed_at: profileData?.username_changed_at ?? null,
            active_pack: profileData?.active_pack ?? null,
            feed_public: feedPublic,
            avatar_config: profileData?.avatar_config ?? null,
          }}
        />

        {/* Content */}
        <main className="flex-1 py-6 px-4 md:py-8 md:px-8 pb-28 md:pb-8">
          <div className="max-w-[1100px] mx-auto">

            {/* Page title */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-text-primary">Social</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 items-start">

              {/* ── LEFT: Feed ─────────────────────────────────────────────── */}
              <div className="flex flex-col gap-4">
                <div className="border-b border-border/40 pb-2">
                  <h2 className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    Feed de actividad
                  </h2>
                </div>

                {feed.length === 0 ? (
                  <div
                    className="rounded-card p-6 border border-border/60 flex flex-col items-center gap-3 text-center"
                    style={{ background: 'var(--color-surface)' }}
                  >
                    <Users size={32} strokeWidth={1.5} style={{ color: 'var(--color-text-muted)' }} aria-hidden />
                    <p className="text-base font-semibold text-text-primary">Tu feed está vacío</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      Añade amigos para ver cuando suban de nivel, completen misiones o alcancen nuevas rachas
                    </p>
                  </div>
                ) : (
                  feed.map(event => (
                    <FeedItem key={event.id} event={event} />
                  ))
                )}
              </div>

              {/* ── RIGHT: Social management ────────────────────────────── */}
              <div className="flex flex-col gap-4">
                <FriendSearch />
                <PendingRequests requests={pendingRequests} />
                <FriendList friends={friends} />
              </div>

            </div>
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
