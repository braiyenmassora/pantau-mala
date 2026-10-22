import { Check, ChevronDown, Map as MapIcon, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Chip } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getCopy, getLocale } from '@/copy'
import { useRegionCatalog } from '@/data/queries'
import type { Region } from '@/data/types'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'

const ALL_PROVINCES = 'Semua'

type ProvincePickerProps = {
  regions: Region[]
  className?: string
}

// ponytail: popover 280px bawah chip, max-h 320px, scrollable, baris 40px text 14px.
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
    return [...set].sort((a, b) => a.localeCompare(b, getLocale() === 'en' ? 'en' : 'id'))
  }, [regions, catalog])

  const provinceLabel =
    province === ALL_PROVINCES ? getCopy().filter.allProvinces : province
  const options = useMemo(
    () => [
      { value: ALL_PROVINCES, label: getCopy().filter.allProvinces },
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
          aria-label={getCopy().filter.pickProvince}
          className={cn('max-w-[min(240px,55vw)] shrink-0', className)}
        >
          <MapIcon
            className="text-ink-2 size-4 shrink-0"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="min-w-0 truncate">{provinceLabel}</span>
          <ChevronDown
            className={cn(
              'text-ink-2 ease-out-soft size-4 shrink-0 transition-transform duration-200',
              open && 'rotate-180',
            )}
            strokeWidth={1.75}
            aria-hidden
          />
        </Chip>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="rounded-card border-line bg-surface text-ink shadow-chrome z-50 max-h-80 w-70 overflow-hidden border p-2"
      >
        <div className="mb-2">
          <div className="bg-surface-muted rounded-card flex h-10 items-center gap-2 px-3">
            <Search
              className="text-ink-3 size-4 shrink-0"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="text"
              placeholder={getCopy().search.searchProvince}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-ink placeholder:text-ink-3 w-full bg-transparent text-sm leading-5 outline-none"
              autoFocus
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-ink-3 hover:text-ink"
                aria-label={getCopy().search.clearProvinceSearch}
              >
                <X className="size-4 shrink-0" strokeWidth={1.75} />
              </button>
            ) : null}
          </div>
        </div>
        <div
          role="listbox"
          aria-label={getCopy().search.provinces}
          className="soft-scroll max-h-60 overflow-y-auto"
        >
          {filteredOptions.length === 0 ? (
            <p className="text-ink-2 px-3 py-4 text-center text-sm leading-5">
              {getCopy().search.noProvinceFound}
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
                    'rounded-ctl flex h-10 w-full cursor-pointer items-center justify-between px-3 text-left text-sm leading-5 font-medium',
                    'ease-out-soft transition-colors duration-150',
                    'hover:bg-surface-muted',
                    focusRing,
                    selected && 'bg-brand-soft text-brand font-semibold',
                  )}
                  onClick={() => {
                    setProvince(option.value)
                    setOpen(false)
                    setSearch('')
                  }}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {selected ? (
                    <Check
                      className="text-brand size-4 shrink-0"
                      strokeWidth={2}
                      aria-hidden
                    />
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
