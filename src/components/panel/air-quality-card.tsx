import type { Region } from '@/data/types'
import { airCategoryBadgeClass, airCategoryLabel } from '@/lib/air-card'
import { cn } from '@/lib/utils'

const pillClass =
  'inline-flex h-6 shrink-0 items-center rounded-ctl px-2 text-xs leading-4 font-semibold'

/** Pill kategori untuk header kartu kondisi. */
export function AirCategoryPill({ region }: { region: Region }) {
  const label = airCategoryLabel(region.air_quality.category)
  const badgeClass = airCategoryBadgeClass(region.air_quality.category)
  if (!label || !badgeClass) return null
  return <span className={cn(pillClass, badgeClass)}>{label}</span>
}
