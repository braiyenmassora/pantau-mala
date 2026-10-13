import { copy } from '@/copy/id'
import { cn } from '@/lib/utils'

export function ProgressBar({ className }: { className?: string } = {}) {
  return (
    <div
      role="progressbar"
      aria-label={copy.common.loading}
      aria-busy="true"
      className={cn(
        'rounded-full bg-line relative h-1 w-full overflow-hidden',
        className,
      )}
    >
      <div className="bg-brand absolute inset-y-0 h-full w-1/3 rounded-full animate-indeterminate" />
    </div>
  )
}
