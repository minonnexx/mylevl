import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { Skeleton } from '@/components/ui/Skeleton'

function MissionCardSkeleton() {
  return (
    <div className="bg-surface rounded-card overflow-hidden flex border border-border/60 min-w-0 w-[calc(100vw-32px)] md:min-w-0 md:w-auto flex-shrink-0">
      <Skeleton className="w-1 flex-shrink-0 rounded-none" />
      <div className="flex-1 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16 rounded-pill" />
          <Skeleton className="h-6 w-14 rounded-pill" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5 mt-1" />
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-8 w-24 rounded-component" />
        </div>
      </div>
    </div>
  )
}

function BossCardSkeleton() {
  return (
    <div className="rounded-card overflow-hidden border border-border/60 bg-surface w-[calc(100vw-32px)] md:min-w-0 md:w-auto flex-shrink-0">
      <Skeleton className="h-[2px] w-full rounded-none" />
      <div className="p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-pill" />
              <Skeleton className="h-6 w-14 rounded-pill" />
            </div>
            <div>
              <Skeleton className="h-7 w-2/3 mb-2" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5 mt-1" />
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <Skeleton className="h-9 w-20 mb-1" />
            <Skeleton className="h-3 w-6 ml-auto" />
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-1 border-t border-border/40">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}

function SectionSkeleton({ isBoss = false }: { isBoss?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="border-b border-border/40 pb-2 flex items-center justify-between">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-3 w-8" />
      </div>
      <div className="flex md:grid md:grid-cols-2 gap-3 overflow-x-auto md:overflow-x-visible scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {isBoss ? (
          <BossCardSkeleton />
        ) : (
          <>
            <MissionCardSkeleton />
            <MissionCardSkeleton />
          </>
        )}
      </div>
    </div>
  )
}

export default function MissionsLoading() {
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
            <div className="flex flex-col gap-8">

              {/* Page title */}
              <div className="flex items-end justify-between gap-4">
                <div>
                  <Skeleton className="h-8 w-28 mb-1.5" />
                  <Skeleton className="h-4 w-64 mt-1" />
                </div>
                <Skeleton className="h-4 w-28 flex-shrink-0" />
              </div>

              {/* Filter bar — 8 pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {['w-14', 'w-16', 'w-16', 'w-24', 'w-12', 'w-14', 'w-16', 'w-12'].map((w, i) => (
                  <Skeleton key={i} className={`h-8 ${w} rounded-pill`} />
                ))}
              </div>

              {/* Mission sections */}
              <div className="flex flex-col gap-10">
                <SectionSkeleton />
                <SectionSkeleton />
                <SectionSkeleton isBoss />
              </div>

            </div>
          </div>
        </main>

      </div>

      <BottomNav />
    </div>
  )
}
