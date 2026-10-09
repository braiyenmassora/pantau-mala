import { Flame, Search, X } from 'lucide-react'
import type { RefObject } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import { fitIndonesia } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type SearchBoxProps = {
  mapRef: RefObject<MapRef | null>
}

export function SearchBox({ mapRef }: SearchBoxProps) {
  const query = useMapStore((s) => s.query)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const setQuery = useMapStore((s) => s.setQuery)
  const select = useMapStore((s) => s.select)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const reducedMotion = usePrefersReducedMotion()

  const detailOpen = selectedCode !== null
  const showClear = query.trim().length > 0

  function clearAll() {
    setQuery('')
    select(null)
    const map = mapRef.current
    if (!map) return
    fitIndonesia(map, panelOpen, reducedMotion ? 0 : 600)
  }

  if (detailOpen) {
    return (
      <div className="flex h-12 items-center justify-end">
        <button
          type="button"
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-2 shadow-sm',
            'transition-[background-color,color] duration-150 ease-in-out',
            'hover:bg-surface-muted hover:text-ink',
            focusRing,
          )}
          aria-label={copy.panel.closeDetail}
          onClick={clearAll}
        >
          <X className="size-[18px]" strokeWidth={2} aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-12 items-center gap-2 rounded-full border border-line bg-surface pr-1 pl-2 shadow-sm',
        'focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2',
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-surface">
        <Flame className="size-[18px]" strokeWidth={2} aria-hidden />
      </span>
      <input
        type="text"
        inputMode="search"
        enterKeyHint="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={copy.panel.searchPlaceholder}
        aria-label={copy.panel.searchPlaceholder}
        style={{ outline: 'none', boxShadow: 'none', border: 'none', background: 'transparent' }}
        className={cn(
          'min-w-0 flex-1 appearance-none border-0 bg-transparent text-base text-ink shadow-none',
          'outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0',
          'focus-visible:outline-none focus-visible:ring-0',
          'placeholder:text-ink-2',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      {showClear ? (
        <button
          type="button"
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full text-ink-2',
            'transition-[background-color,color] duration-150 ease-in-out',
            'hover:bg-surface-muted hover:text-ink',
            focusRing,
          )}
          aria-label={copy.panel.searchClear}
          onClick={clearAll}
        >
          <X className="size-[18px]" strokeWidth={2} aria-hidden />
        </button>
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center text-ink-3" aria-hidden>
          <Search className="size-[18px]" strokeWidth={2} />
        </span>
      )}
    </div>
  )
}
