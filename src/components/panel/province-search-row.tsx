import { Map as MapIcon } from 'lucide-react'
import type { RefObject } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import type { CatalogProvince } from '@/data/types'
import { easeOutSoft, getMapPadding } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type ProvinceSearchRowProps = {
  province: CatalogProvince
  hotspotCount: number
  mapRef: RefObject<MapRef | null>
}

export function ProvinceSearchRow({
  province,
  hotspotCount,
  mapRef,
}: ProvinceSearchRowProps) {
  const setProvince = useMapStore((s) => s.setProvince)
  const setQuery = useMapStore((s) => s.setQuery)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const reducedMotion = usePrefersReducedMotion()
  const [minLon, minLat, maxLon, maxLat] = province.bbox

  return (
    <button
      type="button"
      className={cn(
        'flex min-h-16 w-full items-center gap-3 rounded-card px-3 py-2 text-left',
        'transition-colors duration-150 ease-in-out hover:bg-surface-muted',
        focusRing,
      )}
      onClick={() => {
        setProvince(province.nama)
        setQuery('')
        mapRef.current?.fitBounds(
          [
            [minLon, minLat],
            [maxLon, maxLat],
          ],
          {
            padding: getMapPadding(panelOpen),
            absolutePadding: true,
            duration: reducedMotion ? 0 : 600,
            easing: easeOutSoft,
          },
        )
      }}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
        <MapIcon className="size-4" strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-semibold text-ink">
          {copy.search.provinceTitle(province.nama)}
        </span>
        <span className="block truncate text-sm text-ink-2">
          {hotspotCount > 0
            ? copy.search.withHotspots(hotspotCount)
            : copy.search.noHotspots}
        </span>
      </span>
    </button>
  )
}
