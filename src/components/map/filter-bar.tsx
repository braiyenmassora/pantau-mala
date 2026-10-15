import { useEffect, useMemo } from 'react'

import { Chip } from '@/components/common'
import { ProvincePicker } from '@/components/panel/province-picker'
import { copy } from '@/copy/id'
import type { Region, RiskCategory } from '@/data/types'
import { filterRegions } from '@/lib/filter-regions'
import { formatNumber } from '@/lib/format'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { effectiveRiskCategory } from '@/lib/risk-rule'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'

/** Chip filter — hanya risiko yang tampil di peta (sangat tinggi & sedang). */
const CATEGORY_BASE: RiskCategory[] = ['sangat_tinggi', 'sedang']

type FilterBarProps = {
  panelOpen: boolean
  regions: Region[]
}

/** Provinsi + chip risiko di atas peta (provinsi paling kiri). */
export function FilterBar({ panelOpen, regions }: FilterBarProps) {
  const province = useMapStore((s) => s.province)
  const selectedCategories = useMapStore((s) => s.selectedCategories)
  const toggleCategory = useMapStore((s) => s.toggleCategory)
  const clearCategories = useMapStore((s) => s.clearCategories)

  const preCategory = useMemo(
    () =>
      filterRegions(regions, {
        province,
        query: '',
        selectedCategories: new Set(),
      }),
    [regions, province],
  )

  const counts = useMemo(() => {
    const next: Record<RiskCategory, number> = {
      tidak_tersedia: 0,
      sangat_tinggi: 0,
      sedang: 0,
      rendah: 0,
    }
    for (const r of preCategory) next[effectiveRiskCategory(r)] += 1
    return next
  }, [preCategory])

  const allPressed = selectedCategories.size === 0
  const allCount = preCategory.length
  const categoryOrder = CATEGORY_BASE

  useEffect(() => {
    if (selectedCategories.has('tidak_tersedia') || selectedCategories.has('rendah')) {
      clearCategories()
    }
  }, [selectedCategories, clearCategories])

  return (
    <div
      className={cn(
        'z-30 flex-wrap items-center gap-2',
        'ease-out-soft transition-[left] duration-300',
        panelOpen
          ? 'fixed top-(--floating-control-offset) right-(--floating-control-offset) hidden sm:left-(--map-overlay-inset) sm:flex'
          : 'fixed top-(--floating-control-offset) right-(--floating-control-offset) left-(--floating-control-offset) flex',
      )}
      {...mapOverlayGestureProps}
    >
      <ProvincePicker regions={regions} />

      <Chip
        pressed={allPressed}
        disabled={allCount === 0}
        title={copy.filter.allStatusesTitle(formatNumber(allCount))}
        aria-label={copy.filter.allStatusesTitle(formatNumber(allCount))}
        onClick={clearCategories}
        className={cn(
          allCount === 0 && 'pointer-events-none cursor-not-allowed opacity-40',
        )}
      >
        <span>
          Semua · <span className="tabular-nums">{formatNumber(allCount)}</span>
        </span>
      </Chip>

      {categoryOrder.map((category) => {
        const meta = RISK_CATEGORIES[category]
        const count = counts[category]
        const pressed = selectedCategories.has(category)
        const isZero = count === 0

        return (
          <Chip
            key={category}
            pressed={pressed}
            disabled={isZero}
            title={copy.filter.categoryTitle(formatNumber(count), meta.label)}
            aria-label={copy.filter.categoryTitle(formatNumber(count), meta.label)}
            onClick={() => toggleCategory(category)}
            className={cn(isZero && 'pointer-events-none cursor-not-allowed opacity-40')}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: meta.dot }}
              aria-hidden
            />
            <span>
              {meta.label} · <span className="tabular-nums">{formatNumber(count)}</span>
            </span>
          </Chip>
        )
      })}
    </div>
  )
}
