import { getCopy } from '@/copy'
import { cn } from '@/lib/utils'

export function ProgressBar({ className }: { className?: string } = {}) {
  return (
    <div
      role="progressbar"
      aria-label={getCopy().common.loading}
      aria-busy="true"
      className={cn(
        'bg-line relative h-1 w-full overflow-hidden rounded-full',
        className,
      )}
    >
      <div className="bg-brand animate-indeterminate absolute inset-y-0 h-full w-1/3 rounded-full" />
    </div>
  )
}
