import { Check, ChevronDown, Map as MapIcon, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Chip } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useRegionCatalog } from '@/data/queries'
import { copy } from '@/copy/id'
import type { Region, RiskCategory } from '@/data/types'
import { filterRegions } from '@/lib/filter-regions'
import { formatNumber } from '@/lib/format'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { effectiveRiskCategory } from '@/lib/risk-rule'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'

const ALL_PROVINCES = 'Semua'

/** Chip filter mencakup Semua kategori yang masuk total. */
const CATEGORY_BASE: RiskCategory[] = ['sangat_tinggi', 'sedang', 'rendah']

type PanelFiltersProps = {
  regions: Region[]
  className?: string
}

/** Filter provinsi + chip risiko — dipakai di panel beranda (Level 2). */
export function PanelFilters({ regions, className }: PanelFiltersProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { data: catalog } = useRegionCatalog()
  const province = useMapStore((s) => s.province)
  const selectedCategories = useMapStore((s) => s.selectedCategories)
  const query = useMapStore((s) => s.query)
  const setProvince = useMapStore((s) => s.setProvince)
  const toggleCategory = useMapStore((s) => s.toggleCategory)
  const clearCategories = useMapStore((s) => s.clearCategories)

  const provinces = useMemo(() => {
    const set = new Set([
      ...(catalog?.provinces.map((p) => p.name) ?? []),
      ...regions.map((r) => r.province),
    ])
    return [...set].sort((a, b) => a.localeCompare(b, 'id'))
  }, [regions, catalog])

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
      tidak_tersedia: 0,
      sangat_tinggi: 0,
      sedang: 0,
      rendah: 0,
    }
    for (const r of preCategory) next[effectiveRiskCategory(r)] += 1
    return next
  }, [preCategory])

  const categoryOrder = CATEGORY_BASE

  const provinceLabel = province === ALL_PROVINCES ? copy.filter.allProvinces : province
  const options = useMemo(
    () => [
      { value: ALL_PROVINCES, label: copy.filter.allProvinces },
      ...provinces.map((name) => ({ value: name, label: name })),
    ],
    [provinces],
  )

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options
    const q = search.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, search])

  const allPressed = selectedCategories.size === 0
  const allCount = preCategory.length

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setSearch('')
        }}
      >
        <PopoverTrigger asChild>
          <Chip
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={copy.filter.pickProvince}
            className="w-full justify-between sm:w-auto"
          >
            <span className="flex min-w-0 items-center gap-2">
              <MapIcon
                className="text-ink-2 size-4 shrink-0"
                strokeWidth={2}
                aria-hidden
              />
              <span className="max-w-48 truncate">{provinceLabel}</span>
            </span>
            <ChevronDown
              className={cn(
                'text-ink-2 size-4 shrink-0 transition-transform duration-200 ease-[var(--ease-out-soft)]',
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
          sideOffset={6}
          className="rounded-ctl bg-surface text-ink border-line shadow-chrome z-[60] w-64 border p-1"
        >
          <div className="border-line border-b p-1">
            <div className="rounded-ctl bg-surface-muted flex items-center gap-2 px-2 py-1">
              <Search
                className="text-ink-3 size-4 shrink-0"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="text"
                placeholder={copy.search.searchProvince}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-ink placeholder:text-ink-3 w-full bg-transparent text-xs outline-none"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-ink-3 hover:text-ink"
                >
                  <X className="size-4 shrink-0" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
          <div
            role="listbox"
            aria-label={copy.search.provinces}
            className="soft-scroll max-h-60 overflow-y-auto p-1"
          >
            {filteredOptions.length === 0 ? (
              <p className="text-ink-3 px-3 py-2 text-center text-xs">
                {copy.search.noProvinceFound}
              </p>
            ) : (
              filteredOptions.map((option) => {
                const selected = province === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      'rounded-ctl flex h-9 w-full cursor-pointer items-center gap-2 px-2 text-left text-sm',
                      'hover:bg-surface-muted transition-colors duration-150 ease-in-out',
                      focusRing,
                      selected && 'bg-surface-muted font-semibold',
                    )}
                    onClick={() => {
                      setProvince(option.value)
                      setOpen(false)
                      setSearch('')
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
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex flex-wrap items-center gap-2">
        <Chip
          pressed={allPressed}
          title={copy.filter.allStatusesTitle(formatNumber(allCount))}
          aria-label={copy.filter.allStatusesTitle(formatNumber(allCount))}
          onClick={clearCategories}
        >
          <span>{copy.filter.allStatuses}</span>
          <span
            className={cn(
              'text-xs tabular-nums',
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
                className={cn('size-2 shrink-0 rounded-full', meta.dotClass)}
                aria-hidden
              />
              <span>{meta.label}</span>
              <span
                className={cn(
                  'text-xs tabular-nums',
                  pressed ? 'text-surface/80' : 'text-ink-2',
                )}
              >
                {formatNumber(count)} {copy.filter.wilayahUnit}
              </span>
            </Chip>
          )
        })}
      </div>
    </div>
  )
}
