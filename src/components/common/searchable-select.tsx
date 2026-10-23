import { useState, useMemo } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { focusRing } from '@/components/common/focus-ring'
import { getCopy } from '@/copy'
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
  placeholder = getCopy().common.pick,
  searchPlaceholder = getCopy().common.search,
  emptyText = getCopy().common.notFound,
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
            'border-line bg-surface text-ink rounded-card flex h-11 min-h-11 w-full items-center justify-between gap-2 border px-3 text-sm leading-5 font-medium shadow-none',
            'hover:bg-surface-muted transition-colors duration-200 ease-[var(--ease-out-soft)]',
            disabled && 'cursor-not-allowed opacity-50',
            focusRing,
            className,
          )}
        >
          <span
            className={cn(
              'truncate text-left',
              isPlaceholder ? 'text-ink-3' : 'text-ink',
            )}
          >
            {displayLabel}
          </span>
          <ChevronDown
            className={cn(
              'text-ink-2 size-4 shrink-0 transition-transform duration-200 ease-[var(--ease-out-soft)]',
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
        className="border-line bg-surface rounded-card shadow-chrome z-50 w-64 border p-1"
      >
        <div className="border-line border-b p-1">
          <div className="rounded-card bg-surface-muted flex items-center gap-2 px-2 py-1">
            <Search className="text-ink-3 size-4 shrink-0" strokeWidth={2} aria-hidden />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                onSearch?.(e.target.value)
              }}
              placeholder={searchPlaceholder}
              className="text-ink placeholder:text-ink-3 w-full bg-transparent text-sm leading-5 outline-none"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label={getCopy().common.clearSearch}
                className="text-ink-3 hover:text-ink rounded-ctl flex size-8 shrink-0 items-center justify-center"
              >
                <X className="size-4 shrink-0" strokeWidth={2} aria-hidden />
              </button>
            )}
          </div>
        </div>
        <div role="listbox" className="soft-scroll max-h-56 overflow-y-auto p-1">
          {filteredOptions.length === 0 ? (
            <p className="text-ink-2 px-3 py-2 text-center text-xs leading-4">
              {emptyText}
            </p>
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
                    'rounded-ctl flex w-full items-center justify-between gap-2 px-2 py-2 text-left text-sm leading-5 font-medium transition-colors duration-150',
                    'hover:bg-surface-muted',
                    active && 'bg-surface-muted text-ink font-semibold',
                    focusRing,
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{opt.label}</p>
                    {opt.description && (
                      <p className="text-ink-2 mt-1 truncate text-xs leading-4">
                        {opt.description}
                      </p>
                    )}
                  </div>
                  {active && (
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
  )
}
