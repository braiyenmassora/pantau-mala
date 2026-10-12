import { Flame } from 'lucide-react'

import type { RiskCategory } from '@/data/types'
import { cn } from '@/lib/utils'

type RiskMarkerProps = {
  kategori: RiskCategory
  /** Map pins use shadow-map; list rows omit it. */
  shadow?: boolean
  className?: string
  active?: boolean
}

const ACTIVE: Record<RiskCategory, string> = {
  tidak_tersedia: 'border-line bg-surface-muted',
  sangat_tinggi: 'border-[1.5px] border-risk-high bg-risk-high-tint',
  sedang: 'border-[1.5px] border-risk-mid bg-risk-mid-tint',
  rendah: 'border-[1.5px] border-risk-low bg-risk-low-tint',
}

/** Shared 28×28 risk glyph for map pins (tinggi/sedang) and list rows (all). */
export function RiskMarker({
  kategori,
  shadow = false,
  className,
  active = false,
}: RiskMarkerProps) {
  return (
    <span
      className={cn(
        'border-line bg-surface inline-flex size-7 shrink-0 items-center justify-center rounded-full border',
        shadow && 'shadow-map',
        active && ACTIVE[kategori],
        className,
      )}
      aria-hidden
    >
      {kategori === 'tidak_tersedia' ? (
        <span className="bg-ink-3 size-2 rounded-full" />
      ) : kategori === 'rendah' ? (
        <span className="bg-risk-low size-2 rounded-full" />
      ) : (
        <Flame
          className={cn(
            'size-4',
            kategori === 'sangat_tinggi'
              ? 'fill-risk-high stroke-risk-high'
              : 'fill-risk-mid stroke-risk-mid',
          )}
          strokeWidth={2}
        />
      )}
    </span>
  )
}
