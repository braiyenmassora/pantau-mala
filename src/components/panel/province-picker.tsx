import { Check, ChevronDown, Map as MapIcon, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Chip } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { copy } from '@/copy/id'
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
          className={cn('max-w-[240px] shrink-0', className)}
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
        className="rounded-card border-line bg-surface text-ink z-50 max-h-[320px] w-[280px] overflow-hidden border p-2 shadow-sm"
      >
        <div className="mb-2">
          <div className="bg-surface-muted flex h-10 items-center gap-2 rounded-full px-3">
            <Search
              className="text-ink-3 size-4 shrink-0"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="text"
              placeholder="Cari provinsi"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-ink placeholder:text-ink-3 w-full bg-transparent text-sm outline-none"
              autoFocus
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-ink-3 hover:text-ink"
                aria-label="Hapus pencarian"
              >
                <X className="size-4 shrink-0" strokeWidth={1.75} />
              </button>
            ) : null}
          </div>
        </div>
        <div
          role="listbox"
          aria-label={copy.search.provinces}
          className="soft-scroll max-h-[250px] overflow-y-auto"
        >
          {filteredOptions.length === 0 ? (
            <p className="text-ink-3 px-3 py-4 text-center text-sm">
              Provinsi tidak ditemukan.
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
                    'rounded-ctl flex h-10 w-full cursor-pointer items-center justify-between px-3 text-left text-sm font-normal',
                    'ease-out-soft transition-colors duration-150',
                    'hover:bg-surface-muted',
                    focusRing,
                    selected && 'bg-brand-soft text-brand font-medium',
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
