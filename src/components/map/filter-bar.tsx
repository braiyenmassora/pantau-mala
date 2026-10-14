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

/** Chip filter — Rendah muncul jika ada di data. */
const CATEGORY_BASE: RiskCategory[] = ['sangat_tinggi', 'sedang', 'rendah']

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
  const categoryOrder = CATEGORY_BASE.filter(
    (c) => c !== 'rendah' || counts.rendah > 0,
  )

  useEffect(() => {
    if (selectedCategories.has('tidak_tersedia')) {
      clearCategories()
    }
  }, [selectedCategories, clearCategories])

  return (
    <div
      className={cn(
        'z-30 flex flex-wrap items-center gap-2',
        'transition-[left] duration-300 ease-out-soft',
        panelOpen
          ? 'fixed top-4 right-4 left-4 sm:left-[432px]'
          : 'fixed top-4 right-4 left-4',
      )}
      {...mapOverlayGestureProps}
    >
      <ProvincePicker regions={regions} />

      <Chip
        pressed={allPressed}
        title={copy.filter.allStatusesTitle(formatNumber(allCount))}
        aria-label={copy.filter.allStatusesTitle(formatNumber(allCount))}
        onClick={clearCategories}
      >
        <span>{copy.filter.allStatuses}</span>
        <span
          className={cn(
            'font-mono text-xs tabular-nums',
            allPressed ? 'text-surface/80' : 'text-ink-2',
          )}
        >
          {formatNumber(allCount)} {copy.filter.wilayahUnit}
        </span>
      </Chip>

      {categoryOrder.map((category) => {
        const meta = RISK_CATEGORIES[category]
        const count = counts[category]
        const pressed = selectedCategories.has(category)

        return (
          <Chip
            key={category}
            pressed={pressed}
            title={copy.filter.categoryTitle(formatNumber(count), meta.label)}
            aria-label={copy.filter.categoryTitle(formatNumber(count), meta.label)}
            onClick={() => toggleCategory(category)}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: meta.dot }}
              aria-hidden
            />
            <span>{meta.label}</span>
            <span
              className={cn(
                'font-mono text-xs tabular-nums',
                pressed ? 'text-surface/80' : 'text-ink-2',
              )}
            >
              {formatNumber(count)} {copy.filter.wilayahUnit}
            </span>
          </Chip>
        )
      })}
    </div>
  )
}
