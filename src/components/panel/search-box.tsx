import { Flame, Search, X } from 'lucide-react'
import type { RefObject } from 'react'

import { IconButton } from '@/components/common/icon-button'
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

  if (detailOpen) {
    return (
      <div className="flex h-12 items-center justify-end">
        <IconButton shape="pill" aria-label={copy.panel.closeDetail} onClick={clearAll}>
          <X className="size-4.5" strokeWidth={2} aria-hidden />
        </IconButton>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'border-line bg-surface flex h-12 items-center gap-2 rounded-full border pr-1 pl-2 shadow-sm',
        'focus-within:ring-brand focus-within:ring-2 focus-within:ring-offset-2',
      )}
    >
      <span className="bg-brand text-surface flex size-8 shrink-0 items-center justify-center rounded-full">
        <Flame className="size-4.5" strokeWidth={2} aria-hidden />
      </span>
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
          'text-ink min-w-0 flex-1 appearance-none border-0 bg-transparent text-base shadow-none',
          'ring-0 outline-none focus:border-0 focus:ring-0 focus:outline-none',
          'focus-visible:ring-0 focus-visible:outline-none',
          'placeholder:text-ink-2',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      {showClear ? (
        <IconButton shape="pill" aria-label={copy.panel.searchClear} onClick={clearAll}>
          <X className="size-4.5" strokeWidth={2} aria-hidden />
        </IconButton>
      ) : (
        <span
          className="text-ink-2 flex size-10 shrink-0 items-center justify-center"
          aria-hidden
        >
          <Search className="size-4.5" strokeWidth={2} />
        </span>
      )}
    </div>
  )
}
