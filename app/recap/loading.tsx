import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { Skeleton } from '@/components/ui/Skeleton'

function MissionRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b border-border/40 last:border-b-0">
      <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
      <Skeleton className="flex-1 h-4 min-w-0" />
      <Skeleton className="h-5 w-14 rounded-pill flex-shrink-0" />
      <Skeleton className="h-4 w-14 flex-shrink-0" />
      <Skeleton className="w-4 h-4 flex-shrink-0" />
    </div>
  )
}

function ClassRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-border/40 last:border-b-0">
      <Skeleton className="w-2.5 h-2.5 rounded-full flex-shrink-0" />
      <Skeleton className="flex-1 h-4" />
      <Skeleton className="h-4 w-20 flex-shrink-0" />
    </div>
  )
}

export default function RecapLoading() {
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
          <Skeleton className="h-3.5 w-20" />
        </header>

        {/* Content */}
        <main className="flex-1 py-6 px-4 md:py-8 md:px-8 pb-28 md:pb-8">
          <div className="max-w-[720px] mx-auto flex flex-col gap-8">

            {/* Page header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <Skeleton className="h-8 w-16 mb-1.5" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-7 w-28 rounded-pill" />
            </div>

            {/* Stats 2×2 */}
            <section>
              <div className="border-b border-border/40 pb-2 mb-4">
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="bg-surface rounded-card p-6 border border-border/60 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="w-4 h-4" />
                    </div>
                    <div>
                      <Skeleton className="h-9 w-16 mb-1.5" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Class points */}
            <section>
              <div className="border-b border-border/40 pb-2 mb-4">
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="bg-surface rounded-card border border-border/60 overflow-hidden">
                <ClassRowSkeleton />
                <ClassRowSkeleton />
                <ClassRowSkeleton />
              </div>
            </section>

            {/* Missions list */}
            <section>
              <div className="border-b border-border/40 pb-2 mb-4">
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="bg-surface rounded-card border border-border/60 overflow-hidden">
                <MissionRowSkeleton />
                <MissionRowSkeleton />
                <MissionRowSkeleton />
                <MissionRowSkeleton />
              </div>
            </section>

            {/* Footer line */}
            <Skeleton className="h-3.5 w-56 mx-auto" />

          </div>
        </main>

      </div>

      <BottomNav />
    </div>
  )
}
