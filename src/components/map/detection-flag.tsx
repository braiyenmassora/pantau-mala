import { buildDetectionFlag } from '@/lib/detection-flag'
import type { Region } from '@/data/types'
import { cn } from '@/lib/utils'

type DetectionFlagProps = {
  region: Region
  className?: string
}

/**
 * Callout pin terpilih — nama + provinsi di atas pin.
 * `mb-8` menjauh dari halo (~52px); panah diamond mengarah ke pin.
 */
export function DetectionFlag({ region, className }: DetectionFlagProps) {
  const content = buildDetectionFlag(region)

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-none absolute bottom-full left-1/2 z-30 mb-8 -translate-x-1/2',
        className,
      )}
    >
      <div className="border-line bg-surface relative rounded-card w-max max-w-52 border px-3 py-2 shadow-md">
        <div className="flex min-w-0 flex-col gap-0.5 text-left">
          <p
            className="text-ink truncate text-xs leading-4 font-semibold"
            title={content.title}
          >
            {content.title}
          </p>
          <p
            className="text-ink-2 truncate text-xs leading-4"
            title={content.subtitle}
          >
            {content.subtitle}
          </p>
        </div>
        {/* Tip panah: setengah diamond di bawah card */}
        <span
          aria-hidden
          className="border-line bg-surface absolute top-full left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b"
        />
      </div>
    </div>
  )
}
