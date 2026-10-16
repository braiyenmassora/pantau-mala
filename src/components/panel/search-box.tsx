import { Search, X } from 'lucide-react'
import type { RefObject } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { Input } from '@/components/ui/input'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import { chromeSurface } from '@/lib/chrome'
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
        chromeSurface,
        'rounded-card group flex h-12 items-center gap-3 px-3',
        'ease-out-soft transition-[border-color,box-shadow] duration-150',
        'focus-within:border-brand',
      )}
    >
      <Search
        className="text-ink-3 group-focus-within:text-brand size-4 shrink-0 transition-colors duration-150"
        strokeWidth={2}
        aria-hidden
      />
      <Input
        type="text"
        inputMode="search"
        enterKeyHint="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={copy.panel.searchPlaceholder}
        aria-label={copy.panel.searchPlaceholder}
        className={cn(
          // h-full (bukan h-auto/py-0): tinggi ketat memotong glif IBM Plex → teks hampir tak kebaca.
          'h-full min-w-0 flex-1 border-0 bg-transparent px-0 text-sm leading-5 shadow-none',
          'text-ink caret-ink placeholder:text-ink-3',
          'focus-visible:border-0 focus-visible:ring-0',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      {showClear ? (
        <button
          type="button"
          aria-label={copy.panel.searchClear}
          onClick={clearAll}
          className={cn(
            'text-ink-3 hover:bg-surface-muted hover:text-ink rounded-ctl flex size-8 shrink-0 items-center justify-center',
            focusRing,
          )}
        >
          <X className="size-4" strokeWidth={2} aria-hidden />
        </button>
      ) : null}
    </div>
  )
}
