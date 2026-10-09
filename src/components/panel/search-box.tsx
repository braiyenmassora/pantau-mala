import { Flame, Search, X } from 'lucide-react'
import type { RefObject } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import type { MapRef } from '@/components/ui/map'
import { INDONESIA_CENTER, INDONESIA_ZOOM } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'

type SearchBoxProps = {
  mapRef: RefObject<MapRef | null>
}

export function SearchBox({ mapRef }: SearchBoxProps) {
  const query = useMapStore((s) => s.query)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const setQuery = useMapStore((s) => s.setQuery)
  const select = useMapStore((s) => s.select)
  const reducedMotion = usePrefersReducedMotion()

  const showClear = query.trim().length > 0 || selectedCode !== null

  function clearAll() {
    setQuery('')
    select(null)
    mapRef.current?.flyTo({
      center: INDONESIA_CENTER,
      zoom: INDONESIA_ZOOM,
      duration: reducedMotion ? 0 : 600,
    })
  }

  return (
    <div
      className={cn(
        'flex h-12 items-center gap-2 rounded-full border border-line bg-surface pr-1 pl-2 shadow-sm',
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-surface">
        <Flame className="size-4" strokeWidth={2} aria-hidden />
      </span>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari kabupaten/kota"
        aria-label="Cari kabupaten/kota"
        className={cn(
          'min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-3',
          focusRing,
          'rounded-ctl',
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
          aria-label="Hapus pencarian dan pilihan"
          onClick={clearAll}
        >
          <X className="size-4" strokeWidth={2} aria-hidden />
        </button>
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center text-ink-3" aria-hidden>
          <Search className="size-4" strokeWidth={2} />
        </span>
      )}
    </div>
  )
}
