import { Check, ChevronDown, Map as MapIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Chip } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Region, RiskCategory } from '@/data/types'
import { filterRegions } from '@/lib/filter-regions'
import { formatNumber } from '@/lib/format'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'

const ALL_PROVINCES = 'Semua'

const CATEGORY_ORDER: RiskCategory[] = ['sangat_tinggi', 'sedang', 'rendah']

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

  const provinces = useMemo(() => {
    const set = new Set(regions.map((r) => r.provinsi))
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
    for (const r of preCategory) next[r.kategori] += 1
    return next
  }, [preCategory])

  const provinceLabel = province === ALL_PROVINCES ? 'Semua provinsi' : province
  const options = [
    { value: ALL_PROVINCES, label: 'Semua provinsi' },
    ...provinces.map((name) => ({ value: name, label: name })),
  ]

  return (
    <div
      className={cn(
        'absolute top-4 right-4 z-30 flex flex-wrap items-center gap-2',
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
            aria-label="Pilih provinsi"
            className="gap-1"
          >
            <span className="inline-flex min-w-0 items-center gap-2">
              <MapIcon className="size-4 shrink-0 text-ink-2" strokeWidth={2} aria-hidden />
              <span className="max-w-48 truncate">{provinceLabel}</span>
            </span>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-ink-2 transition-transform duration-150 ease-in-out',
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
          className="z-[60] w-60 rounded-card border-0 bg-surface p-1 text-ink shadow-lg ring-0"
        >
          <ul role="listbox" aria-label="Provinsi" className="max-h-72 overflow-y-auto">
            {options.map((option) => {
              const selected = province === option.value
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      'flex h-9 w-full cursor-pointer items-center gap-2 rounded-ctl px-3 text-left text-sm',
                      'transition-colors duration-150 ease-in-out hover:bg-surface-muted',
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
                      <Check className="size-4 shrink-0 text-brand" strokeWidth={2} aria-hidden />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </PopoverContent>
      </Popover>

      {CATEGORY_ORDER.map((category) => {
        const meta = RISK_CATEGORIES[category]
        const count = counts[category]
        const pressed = selectedCategories.has(category)

        return (
          <Chip
            key={category}
            pressed={pressed}
            className="gap-1"
            title={`Tampilkan hanya ${formatNumber(count)} wilayah berisiko ${meta.label}`}
            onClick={() => toggleCategory(category)}
          >
            <span
              className={cn('size-2 shrink-0 rounded-full', pressed && 'ring-[1.5px] ring-surface')}
              style={{ backgroundColor: meta.dot }}
              aria-hidden
            />
            <span>{meta.label}</span>
            <span
              className={cn(
                'font-mono text-sm',
                pressed ? 'text-surface/70' : 'text-ink-3',
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
