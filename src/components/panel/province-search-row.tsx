import { Map as MapIcon } from 'lucide-react'
import type { RefObject } from 'react'

import { ListRow } from '@/components/common/list-row'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import type { CatalogProvince } from '@/data/types'
import { formatNumber } from '@/lib/format'
import { easeOutSoft, getMapPadding } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
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
    <ListRow
      leading={
        <span
          className="bg-brand-soft text-brand flex size-10 items-center justify-center rounded-full"
          aria-hidden
        >
          <MapIcon className="size-4" strokeWidth={2} />
        </span>
      }
      title={copy.search.provinceTitle(province.name)}
      meta={
        hotspotCount > 0
          ? copy.search.withHotspots(formatNumber(hotspotCount))
          : copy.search.noHotspots
      }
      onClick={() => {
        setProvince(province.name)
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
    />
  )
}
