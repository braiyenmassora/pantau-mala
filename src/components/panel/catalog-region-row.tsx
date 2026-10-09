import { MapPin } from 'lucide-react'
import type { RefObject } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import type { CatalogKabKota } from '@/data/types'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { getMapPadding } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type CatalogRegionRowProps = {
  kab: CatalogKabKota
  mapRef: RefObject<MapRef | null>
}

/** Kabupaten/kota without hotspot risk data in wilayah.json. */
export function CatalogRegionRow({ kab, mapRef }: CatalogRegionRowProps) {
  const select = useMapStore((s) => s.select)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const reducedMotion = usePrefersReducedMotion()

  return (
    <button
      type="button"
      className={cn(
        'flex min-h-16 w-full items-center gap-3 rounded-card px-3 py-2 text-left',
        'transition-colors duration-150 ease-in-out hover:bg-surface-muted',
        focusRing,
      )}
      onClick={(e) => {
        rememberFocusTrigger(e.currentTarget)
        select(kab.kode)
        mapRef.current?.flyTo({
          center: kab.pusat,
          zoom: 9,
          padding: getMapPadding(panelOpen),
          duration: reducedMotion ? 0 : 600,
        })
      }}
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full border-[3px] border-line bg-surface text-ink-3"
        aria-hidden
      >
        <MapPin className="size-4" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-base font-semibold text-ink"
          title={kab.nama}
        >
          {kab.nama}
        </span>
        <span className="block truncate text-sm text-ink-2">
          {copy.search.kabNoHotspotsMeta(kab.provinsi)}
        </span>
      </span>
    </button>
  )
}
