import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import { Skeleton } from '@/components/ui/Skeleton'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-border/40 pb-2 mb-4">
      {children}
    </div>
  )
}

const CLASS_OPACITIES = [1, 0.8, 0.6]

export default function ProfileLoading() {
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
          <div className="max-w-[1100px] mx-auto flex flex-col gap-8">

            {/* Page title */}
            <div>
              <Skeleton className="h-8 w-20 mb-1.5" />
              <Skeleton className="h-4 w-48" />
            </div>

            {/* Profile header card — avatar + username/level + shield + hours played */}
            <section className="bg-surface rounded-card p-6 border border-border/60 flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3.5 w-28" />
                </div>
                <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
              </div>
              <div className="border-t border-border/40 pt-5 flex items-center gap-4">
                <Skeleton className="w-9 h-9 rounded-component flex-shrink-0" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-7 w-24" />
                </div>
              </div>
            </section>

            {/* ShareButton skeleton — full width */}
            <Skeleton className="h-9 w-full rounded-component" />

            {/* Classes + Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 items-start">

              {/* ClassProgressCard */}
              <section>
                <SectionTitle>
                  <Skeleton className="h-3 w-28" />
                </SectionTitle>
                <div className="bg-surface rounded-card border border-border/60 overflow-hidden">
                  {/* Radar chart skeleton */}
                  <div className="px-4 md:px-6 pt-5 pb-2 flex justify-center">
                    <Skeleton className="w-48 h-48 rounded-full" />
                  </div>
                  {/* 3 class rows */}
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-5 px-4 md:px-6 py-4 md:py-5 ${i < 2 ? 'border-b border-border/40' : ''}`}
                      style={{ opacity: CLASS_OPACITIES[i] }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center gap-3 md:w-32 flex-shrink-0">
                          <Skeleton className="w-2.5 h-2.5 rounded-full flex-shrink-0" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-pill flex-shrink-0" />
                        <Skeleton className="ml-auto h-3.5 w-14 md:hidden" />
                      </div>
                      <div className="w-full md:flex-1 min-w-0">
                        <Skeleton className="h-2 w-full rounded-full" />
                      </div>
                      <Skeleton className="hidden md:block h-3.5 w-28 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Right column */}
              <div className="flex flex-col gap-6">

                {/* Recap card */}
                <div className="flex items-center gap-4 p-6 bg-surface rounded-card border border-border/60">
                  <Skeleton className="w-8 h-8 flex-shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-3.5 w-48" />
                  </div>
                  <Skeleton className="w-4 h-4 flex-shrink-0" />
                </div>

                {/* StatsGrid — 2×3 = 6 stats */}
                <section>
                  <SectionTitle>
                    <Skeleton className="h-3 w-24" />
                  </SectionTitle>
                  <div className="grid grid-cols-2 gap-3">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="bg-surface rounded-card p-6 border border-border/60 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="w-4 h-4" />
                        </div>
                        <div>
                          <Skeleton className="h-9 w-16 mb-1.5" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

              </div>
            </div>

            {/* Recent achievements — 5 rows */}
            <section>
              <SectionTitle>
                <Skeleton className="h-3 w-28" />
              </SectionTitle>
              <div className="bg-surface rounded-card border border-border/60 overflow-hidden">
                {[0, 1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className={`flex items-center gap-4 px-6 py-4 ${i < 4 ? 'border-b border-border/40' : ''}`}
                  >
                    <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
                    <Skeleton className="flex-1 h-4 min-w-0" />
                    <Skeleton className="h-6 w-20 rounded-pill flex-shrink-0" />
                    <Skeleton className="h-4 w-16 flex-shrink-0" />
                    <Skeleton className="hidden md:block h-3.5 w-28 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </section>

            {/* ClassBalance — 3 cards with stagger */}
            <section>
              <SectionTitle>
                <Skeleton className="h-3 w-36" />
              </SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="bg-surface rounded-card p-6 border border-border/60 flex flex-col gap-4"
                    style={{ opacity: CLASS_OPACITIES[i] }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="w-2.5 h-2.5 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div>
                      <Skeleton className="h-8 w-14 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </section>

          </div>
        </main>

      </div>

      <BottomNav />
    </div>
  )
}
