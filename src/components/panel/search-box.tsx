import { Search, X } from 'lucide-react'
import type { RefObject } from 'react'


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
  const resetHome = useMapStore((s) => s.resetHome)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const reducedMotion = usePrefersReducedMotion()

  const detailOpen = selectedCode !== null
  const showClear = query.length > 0

  function clearAll() {
    resetHome()
    const map = mapRef.current
    if (!map) return
    fitIndonesia(map, panelOpen, reducedMotion ? 0 : 600)
  }

  if (detailOpen) return null

  return (
    <div
      className={cn(
        'group flex h-9 items-center gap-2 rounded-ctl border border-line bg-surface-muted px-2 shadow-none',
        'transition-all duration-200 ease-[var(--ease-out-soft)]',
        'focus-within:border-brand focus-within:bg-surface focus-within:shadow-sm',
      )}
    >
      <Search
        className="size-4 shrink-0 text-ink-3 transition-colors duration-150 group-focus-within:text-brand"
        strokeWidth={2}
        aria-hidden
      />
      <input
        type="text"
        inputMode="search"
        enterKeyHint="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={copy.panel.searchPlaceholder}
        aria-label={copy.panel.searchPlaceholder}
        style={{
          outline: 'none',
          boxShadow: 'none',
          border: 'none',
          background: 'transparent',
        }}
        className={cn(
          'min-w-0 flex-1 appearance-none border-0 bg-transparent text-xs text-ink shadow-none',
          'outline-none ring-0 placeholder:text-ink-3 focus:border-0 focus:outline-none focus:ring-0',
          'focus-visible:outline-none focus-visible:ring-0',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      {showClear && (
        <button
          type="button"
          aria-label={copy.panel.searchClear}
          onClick={clearAll}
          className="flex size-5 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <X className="size-3.5" strokeWidth={2} aria-hidden />
        </button>
      )}
    </div>
  )
}
