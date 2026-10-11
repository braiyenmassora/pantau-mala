import type { RefObject } from 'react'

import { ListRow } from '@/components/common/list-row'
import { RiskMarker } from '@/components/common/risk-marker'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import type { Region } from '@/data/types'
import { formatNumber } from '@/lib/format'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { getMapPadding, PLACE_ZOOM } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type RegionRowProps = {
  region: Region
  mapRef: RefObject<MapRef | null>
}

export function RegionRow({ region, mapRef }: RegionRowProps) {
  const hoveredCode = useMapStore((s) => s.hoveredCode)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const hover = useMapStore((s) => s.hover)
  const select = useMapStore((s) => s.select)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const reducedMotion = usePrefersReducedMotion()
  const active = hoveredCode === region.code || selectedCode === region.code

  return (
    <ListRow
      active={active}
      leading={<RiskMarker kategori={region.risk_category} />}
      title={region.name}
      meta={
        <>
          <span className="block truncate">
            {copy.map.regionMetaProvince(region.province)}
          </span>
          <span className="block truncate">
            {copy.map.regionMetaHotspots(formatNumber(region.hotspots_24h))}
          </span>
        </>
      }
      onMouseEnter={() => hover(region.code)}
      onMouseLeave={() => hover(null)}
      onClick={(e) => {
        rememberFocusTrigger(e.currentTarget)
        select(region.code)
        mapRef.current?.flyTo({
          center: region.center,
          zoom: PLACE_ZOOM,
          padding: getMapPadding(panelOpen),
          duration: reducedMotion ? 0 : 600,
        })
      }}
    />
  )
}
