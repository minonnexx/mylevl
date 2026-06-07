import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Rss } from 'lucide-react'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { FriendSearch } from '@/components/social/FriendSearch'
import { PendingRequests } from '@/components/social/PendingRequests'
import { FriendList } from '@/components/social/FriendList'
import { FeedItem } from '@/components/social/FeedItem'
import { FeedToggle } from '@/components/social/FeedToggle'
import { getFeed, getFriends, getPendingRequests } from '@/app/social/actions'
import type { FeedEventItem } from '@/components/social/FeedItem'

export default async function SocialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [feedRaw, friends, pendingRequests, profileRes] = await Promise.all([
    getFeed(),
    getFriends(),
    getPendingRequests(),
    supabase.from('profiles').select('feed_public').eq('id', user.id).single(),
  ])

  const feedPublic = (profileRes.data as { feed_public: boolean } | null)?.feed_public ?? true
  const feed = feedRaw as unknown as FeedEventItem[]

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
                    className="rounded-card p-10 border border-border/60 flex flex-col items-center gap-3 text-center"
                    style={{ background: 'var(--color-surface)' }}
                  >
                    <Rss size={36} strokeWidth={1.5} style={{ color: 'var(--color-text-muted)' }} aria-hidden />
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      Añade amigos para ver su actividad aquí
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
                <FeedToggle feedPublic={feedPublic} />
              </div>

            </div>
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
