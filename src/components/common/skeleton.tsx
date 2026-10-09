import { cn } from '@/lib/utils'

type SkeletonProps = {
  className?: string
}

/** Soft pulse block; disabled when prefers-reduced-motion (global tokens). */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-card bg-surface-muted', className)}
      aria-hidden
    />
  )
}
