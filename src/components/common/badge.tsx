import type { HTMLAttributes, ReactNode } from 'react'

import type { RiskCategory } from '@/data/types'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { effectiveRiskCategory } from '@/lib/risk-rule'
import { cn } from '@/lib/utils'

type BadgeProps =
  | ({ variant: 'meta'; children: ReactNode } & HTMLAttributes<HTMLSpanElement>)
  | ({
      variant: 'category'
      category: RiskCategory
    } & HTMLAttributes<HTMLSpanElement>)

/** Badge kategori. Tinggi 24, tint + text dari token (tanpa inline hex). */
const badgeBase =
  'inline-flex h-6 shrink-0 items-center rounded-ctl px-2 text-xs leading-4 font-semibold'

export function Badge(props: BadgeProps) {
  if (props.variant === 'meta') {
    const { className, children, variant, ...rest } = props
    void variant
    return (
      <span
        className={cn(badgeBase, 'bg-surface-muted text-ink-2', className)}
        {...rest}
      >
        {children}
      </span>
    )
  }

  const { className, category, variant, ...rest } = props
  void variant
  const style = RISK_CATEGORIES[category]
  return (
    <span className={cn(badgeBase, style.badgeClass, className)} {...rest}>
      {style.label}
    </span>
  )
}

/**
 * Badge risiko hanya bila ada titik terdeteksi.
 * Nol titik → status netral (bukan Rendah/hijau).
 */
export function HotspotStatusBadge({
  hotspots,
  riskCategory = 'tidak_tersedia',
  className,
}: {
  hotspots: number
  riskCategory?: RiskCategory
  className?: string
}) {
  return (
    <Badge
      variant="category"
      category={effectiveRiskCategory({
        risk_category: riskCategory,
        hotspots_24h: hotspots,
      })}
      className={className}
    />
  )
}
