export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-component bg-surface-elevated ${className}`} />
}
