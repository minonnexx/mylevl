import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { Skeleton } from '@/components/ui/Skeleton'

// Shield indicator skeleton — sm size (ring=48px, inventory icons=24px)
function ShieldSkeletonSm() {
  return (
    <div className="flex items-center flex-shrink-0 gap-3">
      <div className="flex flex-col items-center gap-1">
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        <Skeleton className="h-2.5 w-6" />
      </div>
      <div className="flex items-center gap-1.5">
        <Skeleton className="w-6 h-6 rounded-sm" />
        <Skeleton className="w-6 h-6 rounded-sm" />
      </div>
    </div>
  )
}

// Mission card skeleton
function MissionCardSkeleton() {
  return (
    <div className="bg-surface rounded-card overflow-hidden flex border border-border/60 min-w-0">
      <Skeleton className="w-1 flex-shrink-0 rounded-none" />
      <div className="flex-1 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16 rounded-pill" />
          <Skeleton className="h-6 w-14 rounded-pill" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6 mt-1" />
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-8 w-24 rounded-component" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-background">

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
          <div className="flex items-center gap-3">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-6 w-16 rounded-pill" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 py-6 px-4 md:py-8 md:px-8 pb-28 md:pb-8">
          <div className="max-w-[1100px] mx-auto">

            {/* Page title */}
            <div className="mb-6">
              <Skeleton className="h-8 w-20 mb-1.5" />
              <Skeleton className="h-4 w-52" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 items-start">

              {/* LEFT: Mission queue */}
              <div className="flex flex-col gap-5">
                <div className="border-b border-border/40 pb-2 flex items-center justify-between">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>

                <MissionCardSkeleton />
                <MissionCardSkeleton />
                <MissionCardSkeleton />

                <Skeleton className="h-3.5 w-36" />
              </div>

              {/* RIGHT: Player + Stats */}
              <div className="flex flex-col gap-4">

                {/* Player card */}
                <div className="bg-surface rounded-card p-6 border border-border/60 flex flex-col gap-5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-4 w-28 mb-1.5" />
                      <Skeleton className="h-3.5 w-36" />
                    </div>
                    <ShieldSkeletonSm />
                  </div>
                  {/* XpBar */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-6" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>

                {/* Stats card */}
                <div className="bg-surface rounded-card p-6 border border-border/60">
                  <div className="border-b border-border/40 pb-2 mb-4">
                    <Skeleton className="h-3 w-24" />
                  </div>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 py-3 border-b border-border/40 last:border-b-0">
                      <Skeleton className="w-9 h-9 rounded-component flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Skeleton className="h-3 w-24 mb-1.5" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </main>

      </div>

      <BottomNav />
    </div>
  )
}
