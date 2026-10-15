import { Search, X } from 'lucide-react'
import type { RefObject } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
        'border-line bg-surface group rounded-ctl flex h-9 items-center gap-2 border px-3 shadow-sm',
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
          'h-auto min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm shadow-none',
          'text-ink placeholder:text-ink-3',
          'focus-visible:border-0 focus-visible:ring-0',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      {showClear ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={copy.panel.searchClear}
          onClick={clearAll}
          className="text-ink-3 hover:bg-surface-muted hover:text-ink rounded-ctl size-8 shrink-0"
        >
          <X className="size-4" strokeWidth={2} aria-hidden />
        </Button>
      ) : null}
    </div>
  )
}
