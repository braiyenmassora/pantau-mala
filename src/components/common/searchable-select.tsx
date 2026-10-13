import { useState, useMemo } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

export type SearchableSelectOption = {
  value: string
  label: string
  description?: string
}

export type SearchableSelectProps = {
  id?: string
  value: string
  options: SearchableSelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  ariaLabel?: string
  onSearch?: (value: string) => void
  serverSearch?: boolean
  selectedLabel?: string
}

export function SearchableSelect({
  id,
  value,
  options,
  onChange,
  placeholder = 'Pilih...',
  searchPlaceholder = 'Cari...',
  emptyText = 'Tidak ditemukan',
  disabled = false,
  className,
  ariaLabel,
  onSearch,
  serverSearch = false,
  selectedLabel,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  )
  const displayLabel =
    selectedLabel || (selectedOption ? selectedOption.label : value ? value : placeholder)
  const isPlaceholder = !selectedLabel && !selectedOption && !value

  const filteredOptions = useMemo(() => {
    if (serverSearch) return options
    if (!search.trim()) return options
    const q = search.toLowerCase()
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.description && o.description.toLowerCase().includes(q)),
    )
  }, [options, search, serverSearch])

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSearch('')
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 border border-line bg-surface px-3 text-xs font-medium text-ink shadow-sm',
            'rounded-ctl hover:bg-surface-muted transition-colors duration-200 ease-[var(--ease-out-soft)]',
            disabled && 'cursor-not-allowed opacity-50',
            focusRing,
            className,
          )}
        >
          <span className={cn('truncate text-left', isPlaceholder ? 'text-ink-3' : 'text-ink')}>
            {displayLabel}
          </span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-ink-2 transition-transform duration-200 ease-[var(--ease-out-soft)]',
              open && 'rotate-180',
            )}
            strokeWidth={2}
            aria-hidden
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        className="z-50 w-64 border border-line bg-surface p-1 shadow-md rounded-card"
      >
        <div className="border-b border-line p-1">
          <div className="flex items-center gap-2 rounded-ctl bg-surface-muted px-2 py-1">
            <Search className="size-4 shrink-0 text-ink-3" strokeWidth={2} aria-hidden />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                onSearch?.(e.target.value)
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs text-ink placeholder:text-ink-3 outline-none"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-ink-3 hover:text-ink"
              >
                <X className="size-4 shrink-0" strokeWidth={2} aria-hidden />
              </button>
            )}
          </div>
        </div>
        <div role="listbox" className="max-h-56 overflow-y-auto p-1 soft-scroll">
          {filteredOptions.length === 0 ? (
            <p className="px-3 py-2 text-center text-xs text-ink-3">{emptyText}</p>
          ) : (
            filteredOptions.map((opt) => {
              const active = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                    setSearch('')
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-ctl px-2 py-1 text-left text-xs transition-colors duration-150',
                    'hover:bg-surface-muted',
                    active && 'bg-surface-muted font-semibold text-ink',
                    focusRing,
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{opt.label}</p>
                    {opt.description && (
                      <p className="truncate text-xs text-ink-3">{opt.description}</p>
                    )}
                  </div>
                  {active && (
                    <Check
                      className="size-4 shrink-0 text-brand"
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
  )
}
