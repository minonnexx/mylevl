import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { Skeleton } from '@/components/ui/Skeleton'

function FeedCardSkeleton() {
  return (
    <div className="bg-surface rounded-card p-6 border border-border/60 flex items-start gap-4">
      <Skeleton className="w-8 h-8 rounded-component flex-shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3 w-24 mt-1" />
      </div>
    </div>
  )
}

function FriendRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/40 last:border-b-0">
      <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-6 w-14 rounded-pill flex-shrink-0" />
    </div>
  )
}

export default function SocialLoading() {
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
              <Skeleton className="h-8 w-24" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 items-start">

              {/* LEFT: Feed skeleton */}
              <div className="flex flex-col gap-4">
                <div className="border-b border-border/40 pb-2">
                  <Skeleton className="h-3 w-36" />
                </div>
                <FeedCardSkeleton />
                <FeedCardSkeleton />
                <FeedCardSkeleton />
                <FeedCardSkeleton />
              </div>

              {/* RIGHT: Social management skeleton */}
              <div className="flex flex-col gap-4">

                {/* Search bar */}
                <Skeleton className="h-10 w-full rounded-component" />

                {/* Friend list card */}
                <div className="bg-surface rounded-card p-6 border border-border/60">
                  <Skeleton className="h-3 w-28 mb-4" />
                  <FriendRowSkeleton />
                  <FriendRowSkeleton />
                  <FriendRowSkeleton />
                </div>

                {/* Feed toggle */}
                <div className="bg-surface rounded-card p-4 border border-border/60 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="w-10 h-6 rounded-pill flex-shrink-0" />
                </div>

              </div>
            </div>
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
