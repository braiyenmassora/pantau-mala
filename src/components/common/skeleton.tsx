import { cn } from '@/lib/utils'

type SkeletonProps = {
  className?: string
}

/** Soft pulse block; disabled when prefers-reduced-motion (global tokens). */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('rounded-card bg-surface-muted animate-pulse', className)}
      aria-hidden
    />
  )
}
