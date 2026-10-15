import { Search, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { ProgressBar } from '@/components/common/progress-bar'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { copy } from '@/copy/id'
import type { Village } from '@/data/extended-contract'
import { useSearchVillages } from '@/data/queries'
import { cn } from '@/lib/utils'

type VillageSearchProps = {
  value: Village | null
  onChange: (village: Village | null) => void
}

export function VillageSearch({ value, onChange }: VillageSearchProps) {
  const id = useId()
  const anchorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlighted, setHighlighted] = useState(-1)
  const villages = useSearchVillages(search)
  const options = villages.data?.data ?? []
  const activeIndex = Math.min(highlighted, options.length - 1)
  const canSearch = Array.from(search.trim()).length >= 2
  const listId = `${id}-villages`

  function close() {
    setOpen(false)
    setSearch('')
    setHighlighted(-1)
  }

  function select(village: Village) {
    onChange(village)
    close()
    inputRef.current?.focus()
  }

  return (
    <Popover open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <label htmlFor={id} className="sr-only">
        {copy.weather.locationLabel}
      </label>
      <PopoverAnchor asChild>
        <div
          ref={anchorRef}
          className={cn(
            'group border-line bg-surface rounded-ctl shadow-chrome flex h-12 items-center gap-2 border px-3',
            'transition-all duration-200 ease-[var(--ease-out-soft)]',
            'focus-within:border-brand focus-within:bg-surface',
          )}
        >
          <Search
            className="text-ink-3 group-focus-within:text-brand size-4 shrink-0 transition-colors duration-150"
            strokeWidth={2}
            aria-hidden
          />
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={
              open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
            }
            aria-describedby={open ? `${id}-status` : undefined}
            autoComplete="off"
            spellCheck={false}
            maxLength={120}
            value={open ? search : (value?.nama ?? '')}
            placeholder={copy.weather.searchPlaceholder}
            className={cn(
              'text-ink placeholder:text-ink-3 min-w-0 flex-1 appearance-none border-0 bg-transparent text-xs font-normal shadow-none',
              'ring-0 outline-none focus:border-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none',
            )}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onChange={(event) => {
              setSearch(event.target.value)
              setHighlighted(-1)
              setOpen(true)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                event.stopPropagation()
                close()
              } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                setOpen(true)
                if (!options.length) return
                setHighlighted(
                  event.key === 'ArrowDown'
                    ? Math.min(activeIndex + 1, options.length - 1)
                    : activeIndex < 0
                      ? options.length - 1
                      : Math.max(activeIndex - 1, 0),
                )
              } else if (event.key === 'Enter' && open) {
                event.preventDefault()
                if (activeIndex >= 0 && !villages.isSearching)
                  select(options[activeIndex])
              }
            }}
          />
          {(open ? search : value) && (
            <button
              type="button"
              aria-label={copy.weather.clearSearch}
              className={cn(
                'text-ink-3 hover:bg-surface-muted hover:text-ink rounded-ctl flex size-5 shrink-0 items-center justify-center transition-colors',
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (!open) onChange(null)
                setSearch('')
                setHighlighted(-1)
                inputRef.current?.focus()
              }}
            >
              <X className="size-4" strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={4}
        collisionPadding={16}
        className="rounded-ctl border-line bg-surface shadow-chrome z-50 max-h-[var(--radix-popover-content-available-height)] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-32px)] gap-0 overflow-hidden border p-1"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (anchorRef.current?.contains(event.target as Node)) event.preventDefault()
        }}
      >
        <p id={`${id}-status`} role="status" className="text-ink-3 px-2 py-2 text-xs">
          {!canSearch
            ? copy.extra.villageMinChars
            : villages.isSearching
              ? copy.extra.villageLoading
              : villages.isError
                ? copy.extra.villageSearchUnavailable
                : options.length
                  ? copy.weather.searchResults(options.length)
                  : copy.extra.villageEmpty}
        </p>
        {villages.isSearching && <ProgressBar />}
        {villages.isError && canSearch && (
          <button
            type="button"
            className={cn(
              'rounded-ctl text-brand hover:bg-brand-soft px-2 py-1 text-left text-xs',
              focusRing,
            )}
            onClick={() => void villages.refetch()}
          >
            {copy.common.retry}
          </button>
        )}
        <div
          id={listId}
          role="listbox"
          aria-label={copy.weather.resultsLabel}
          className="soft-scroll max-h-56 min-h-0 overflow-y-auto"
        >
          {options.map((village, index) => (
            <button
              key={village.kode}
              id={`${listId}-${index}`}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={value?.kode === village.kode}
              className={cn(
                'rounded-ctl hover:bg-surface-muted block w-full px-2 py-2 text-left text-xs transition-colors duration-150',
                index === activeIndex && 'bg-brand-soft',
                focusRing,
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(village)}
            >
              <span className="text-ink block font-medium">{village.nama}</span>
              <span className="text-ink-2 mt-1 block leading-4 break-words">
                {village.kecamatan}, {village.kabupaten}, {village.provinsi}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
