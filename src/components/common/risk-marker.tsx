import type { RiskCategory } from '@/data/types'
import { cn } from '@/lib/utils'

type RiskMarkerProps = {
  kategori: RiskCategory
  /** Map pins use shadow-map; list rows omit it. */
  shadow?: boolean
  className?: string
  active?: boolean
}

const FILL: Record<RiskCategory, string> = {
  tidak_tersedia: 'bg-ink-3',
  sangat_tinggi: 'bg-risk-high',
  sedang: 'bg-risk-mid',
  rendah: 'bg-risk-low',
}

/** Satu lingkaran penuh warna risiko — tanpa ring dalam ring. */
export function RiskMarker({
  kategori,
  shadow = false,
  className,
  active = false,
}: RiskMarkerProps) {
  return (
    <span
      className={cn(
        'border-surface inline-flex size-3 shrink-0 rounded-full border-2',
        FILL[kategori],
        shadow && 'shadow-map',
        active && 'scale-110',
        className,
      )}
      aria-hidden
    />
  )
}
