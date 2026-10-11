import { Check, ChevronDown, Map as MapIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Chip } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { copy } from '@/copy/id'
import type { Region, RiskCategory } from '@/data/types'
import { filterRegions } from '@/lib/filter-regions'
import { formatNumber } from '@/lib/format'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'

const ALL_PROVINCES = 'Semua'

/** MVP: BE tidak kirim pin rendah — chip Rendah disembunyikan. */
const CATEGORY_ORDER: RiskCategory[] = ['sangat_tinggi', 'sedang']

type FilterBarProps = {
  panelOpen: boolean
  regions: Region[]
}

export function FilterBar({ panelOpen, regions }: FilterBarProps) {
  const [open, setOpen] = useState(false)
  const province = useMapStore((s) => s.province)
  const selectedCategories = useMapStore((s) => s.selectedCategories)
  const query = useMapStore((s) => s.query)
  const setProvince = useMapStore((s) => s.setProvince)
  const toggleCategory = useMapStore((s) => s.toggleCategory)
  const clearCategories = useMapStore((s) => s.clearCategories)

  const provinces = useMemo(() => {
    const set = new Set(regions.map((r) => r.province))
    return [...set].sort((a, b) => a.localeCompare(b, 'id'))
  }, [regions])

  /** Counts after province + search, before category filter. */
  const preCategory = useMemo(
    () =>
      filterRegions(regions, {
        province,
        query,
        selectedCategories: new Set(),
      }),
    [regions, province, query],
  )

  const counts = useMemo(() => {
    const next: Record<RiskCategory, number> = {
      sangat_tinggi: 0,
      sedang: 0,
      rendah: 0,
    }
    for (const r of preCategory) next[r.risk_category] += 1
    return next
  }, [preCategory])

  const provinceLabel = province === ALL_PROVINCES ? copy.filter.allProvinces : province
  const options = [
    { value: ALL_PROVINCES, label: copy.filter.allProvinces },
    ...provinces.map((name) => ({ value: name, label: name })),
  ]
  const allPressed = selectedCategories.size === 0
  const allCount = preCategory.length

  return (
    <div
      className={cn(
        // fixed: keeps map-area placement when rendered inside the panel for tab order
        'fixed top-4 right-4 z-30 flex flex-wrap items-center gap-2',
        'transition-[left] duration-300 ease-[var(--ease-out-soft)]',
        panelOpen ? 'left-[432px]' : 'left-4',
      )}
      {...mapOverlayGestureProps}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Chip
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={copy.filter.pickProvince}
          >
            <span className="inline-flex min-w-0 items-center gap-2">
              <MapIcon
                className="text-ink-2 size-4 shrink-0"
                strokeWidth={2}
                aria-hidden
              />
              <span className="max-w-48 truncate">{provinceLabel}</span>
            </span>
            <ChevronDown
              className={cn(
                'text-ink-2 size-4 shrink-0 transition-transform duration-150 ease-in-out',
                open && 'rotate-180',
              )}
              strokeWidth={2}
              aria-hidden
            />
          </Chip>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={8}
          className="rounded-card bg-surface text-ink z-[60] w-60 border-0 p-1 shadow-lg ring-0"
        >
          <div
            role="listbox"
            aria-label={copy.search.provinces}
            className="max-h-72 overflow-y-auto"
          >
            {options.map((option) => {
              const selected = province === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    'rounded-ctl flex h-9 w-full cursor-pointer items-center gap-2 px-3 text-left text-sm',
                    'hover:bg-surface-muted transition-colors duration-150 ease-in-out',
                    focusRing,
                    selected && 'bg-surface-muted font-semibold',
                  )}
                  onClick={() => {
                    setProvince(option.value)
                    setOpen(false)
                  }}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {selected && (
                    <Check
                      className="text-brand size-4 shrink-0"
                      strokeWidth={2}
                      aria-hidden
                    />
                  )}
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>

      <Chip
        pressed={allPressed}
        title={copy.filter.allStatusesTitle(formatNumber(allCount))}
        aria-label={copy.filter.allStatusesTitle(formatNumber(allCount))}
        onClick={clearCategories}
      >
        <span>{copy.filter.allStatuses}</span>
        <span
          className={cn(
            'font-mono text-sm',
            allPressed ? 'text-surface/70' : 'text-ink-2',
          )}
        >
          {formatNumber(allCount)}
        </span>
      </Chip>

      {CATEGORY_ORDER.map((category) => {
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
              className={cn(
                'size-2 shrink-0 rounded-full',
                pressed && 'ring-surface ring-[1.5px]',
              )}
              style={{ backgroundColor: meta.dot }}
              aria-hidden
            />
            <span>{meta.label}</span>
            <span
              className={cn(
                'font-mono text-sm',
                pressed ? 'text-surface/70' : 'text-ink-2',
              )}
            >
              {formatNumber(count)}
            </span>
          </Chip>
        )
      })}
    </div>
  )
}
