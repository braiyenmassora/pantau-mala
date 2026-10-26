import { MapPin } from 'lucide-react'
import type { RefObject } from 'react'

import { ListRow } from '@/components/common/list-row'
import type { MapRef } from '@/components/ui/map'
import { getCopy } from '@/copy'
import type { CatalogRegency } from '@/data/types'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { getMapPadding, PLACE_ZOOM } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type CatalogRegionRowProps = {
  kab: CatalogRegency
  mapRef: RefObject<MapRef | null>
}

/** Kabupaten/kota without hotspot risk data in /v1/regions. */
export function CatalogRegionRow({ kab, mapRef }: CatalogRegionRowProps) {
  const select = useMapStore((s) => s.select)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const reducedMotion = usePrefersReducedMotion()

  return (
    <ListRow
      leading={
        <span
          className="border-line bg-brand-soft text-brand rounded-ctl flex size-10 items-center justify-center border"
          aria-hidden
        >
          <MapPin className="size-4" strokeWidth={2} />
        </span>
      }
      title={kab.name}
      meta={
        <>
          <span className="block truncate">
            {getCopy().map.regionMetaProvince(kab.province)}
          </span>
          <span className="block truncate">{getCopy().search.noHotspots}</span>
        </>
      }
      onClick={(e) => {
        rememberFocusTrigger(e.currentTarget)
        select(kab.code)
        mapRef.current?.flyTo({
          center: kab.center,
          zoom: PLACE_ZOOM,
          padding: getMapPadding(panelOpen),
          duration: reducedMotion ? 0 : 600,
        })
      }}
    />
  )
}
