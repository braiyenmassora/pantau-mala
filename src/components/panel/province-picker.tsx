import { Check, ChevronDown, Map as MapIcon, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Chip } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useRegionCatalog } from '@/data/queries'
import type { Region } from '@/data/types'
import { copy } from '@/copy/id'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'

const ALL_PROVINCES = 'Semua'

type ProvincePickerProps = {
  regions: Region[]
  /** Compact chip for panel pill header. */
  className?: string
}

/** Dropdown provinsi — dipakai di pill header panel. */
export function ProvincePicker({ regions, className }: ProvincePickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { data: catalog } = useRegionCatalog()
  const province = useMapStore((s) => s.province)
  const setProvince = useMapStore((s) => s.setProvince)

  const provinces = useMemo(() => {
    const set = new Set([
      ...(catalog?.provinces.map((p) => p.name) ?? []),
      ...regions.map((r) => r.province),
    ])
    return [...set].sort((a, b) => a.localeCompare(b, 'id'))
  }, [regions, catalog])

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

  return (
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
          className={cn('max-w-48 shrink-0', className)}
        >
          <MapIcon className="text-ink-2 size-4 shrink-0" strokeWidth={2} aria-hidden />
          <span className="min-w-0 truncate">{provinceLabel}</span>
          <ChevronDown
            className={cn(
              'text-ink-2 size-4 shrink-0 transition-transform duration-200 ease-out-soft',
              open && 'rotate-180',
            )}
            strokeWidth={2}
            aria-hidden
          />
        </Chip>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={6}
        className="rounded-card bg-surface text-ink border-line z-60 w-64 border p-1 shadow-md"
      >
        <div className="border-line border-b p-1">
          <div className="bg-surface-muted rounded-ctl flex items-center gap-2 px-2 py-1">
            <Search className="text-ink-3 size-4 shrink-0" strokeWidth={2} aria-hidden />
            <input
              type="text"
              placeholder={copy.search.searchProvince}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-ink placeholder:text-ink-3 w-full bg-transparent text-xs outline-none"
              autoFocus
            />
            {search ? (
              <button type="button" onClick={() => setSearch('')} className="text-ink-3 hover:text-ink">
                <X className="size-4 shrink-0" strokeWidth={2} />
              </button>
            ) : null}
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
                  {selected ? (
                    <Check className="text-brand size-4 shrink-0" strokeWidth={2} aria-hidden />
                  ) : null}
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
