import { Skeleton } from '@/components/ui/Skeleton'

export function FriendSearchSkeleton() {
  return (
    <div
      className="mt-4 flex items-center gap-3 p-4 rounded-component border border-border/60"
      style={{ background: 'var(--color-background)' }}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-14 rounded-pill" />
          <Skeleton className="h-4 w-8" />
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Skeleton className="h-8 w-8 sm:w-24 rounded-component" />
        <Skeleton className="h-8 w-8 sm:w-28 rounded-component" />
      </div>
    </div>
  )
}
