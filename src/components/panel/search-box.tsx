import { Search, X } from 'lucide-react'
import type { RefObject } from 'react'

import { IconButton } from '@/components/common/icon-button'
import { Input } from '@/components/ui/input'
import type { MapRef } from '@/components/ui/map'
import { getCopy } from '@/copy'
import { CHROME } from '@/lib/pola'
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
        CHROME.mapFloat,
        'group flex h-12 items-center gap-3 px-3',
        'ease-out-soft transition-[border-color,box-shadow] duration-150',
        'focus-within:border-brand',
      )}
    >
      <Search className="text-brand size-4 shrink-0" strokeWidth={2} aria-hidden />
      <Input
        type="text"
        inputMode="search"
        enterKeyHint="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={getCopy().panel.searchPlaceholder}
        aria-label={getCopy().panel.searchPlaceholder}
        className={cn(
          // h-full (bukan h-auto/py-0): tinggi ketat memotong glif → teks hampir tak kebaca.
          'h-full min-w-0 flex-1 border-0 bg-transparent px-0 text-sm leading-5 shadow-none',
          'text-ink caret-ink placeholder:text-ink-3',
          'focus-visible:border-0 focus-visible:ring-0',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      {showClear ? (
        <IconButton aria-label={getCopy().panel.searchClear} onClick={clearAll}>
          <X className="size-4" strokeWidth={2} aria-hidden />
        </IconButton>
      ) : null}
    </div>
  )
}
