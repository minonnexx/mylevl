import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { Skeleton } from '@/components/ui/Skeleton'

export default function PublicProfileLoading() {
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

            {/* Title row */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <Skeleton className="h-8 w-40 mb-1.5" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>

            {/* Stats card */}
            <div
              className="rounded-card p-6 border border-border/60 flex items-center gap-6"
              style={{ background: 'var(--color-surface)' }}
            >
              {/* Avatar */}
              <Skeleton className="w-14 h-14 rounded-card flex-shrink-0" />

              {/* Info */}
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <Skeleton className="h-6 w-16 rounded-pill" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="w-3.5 h-3.5" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              {/* Friendship button */}
              <Skeleton className="h-9 w-9 sm:w-28 rounded-component flex-shrink-0" />
            </div>

            {/* Class milestones card */}
            <div
              className="rounded-card p-6 border border-border/60"
              style={{ background: 'var(--color-surface)' }}
            >
              <Skeleton className="h-3 w-28 mb-4" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-28 rounded-pill" />
                <Skeleton className="h-6 w-28 rounded-pill" />
                <Skeleton className="h-6 w-32 rounded-pill" />
              </div>
            </div>

          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
