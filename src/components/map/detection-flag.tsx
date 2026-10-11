import { buildDetectionFlag } from '@/lib/detection-flag'
import type { Region } from '@/data/types'
import { cn } from '@/lib/utils'

type DetectionFlagProps = {
  region: Region
  className?: string
}

/**
 * Callout pin terpilih — nama + provinsi, di atas halo.
 * Jarak bawah ~setengah halo maks (52px) supaya tidak numpuk lingkaran.
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
      <div className="rounded-card border-line bg-surface relative w-max max-w-56 border px-2.5 py-1.5 shadow-md">
        <p className="text-ink truncate text-xs font-semibold" title={content.title}>
          {content.title}
        </p>
        <p
          className="text-ink-2 mt-0.5 truncate text-xs leading-4"
          title={content.subtitle}
        >
          {content.subtitle}
        </p>
        {/* Panah ke pin */}
        <span aria-hidden className="absolute top-full left-1/2 -mt-px -translate-x-1/2">
          <span className="border-t-line block size-0 border-x-[6px] border-t-[7px] border-x-transparent" />
          <span className="border-t-surface absolute top-0 left-1/2 size-0 -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent" />
        </span>
      </div>
    </div>
  )
}
