import { useMemo, type CSSProperties } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { MapMarker, MarkerContent } from '@/components/ui/map'
import { useRegionCatalog } from '@/data/queries'
import type { Region, RiskCategory } from '@/data/types'
import { aggregateByProvince, provinceLabelAnchors } from '@/lib/province-aggregates'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'

type ProvinceRadarsLayerProps = {
  regions: Region[]
}

type RadarPoint = {
  coordinates: [number, number]
  name: string
  hotspots24h: number
  riskCategory: Extract<RiskCategory, 'sangat_tinggi' | 'sedang'>
}

const riskLabel: Record<'sangat_tinggi' | 'sedang', string> = {
  sangat_tinggi: 'sangat tinggi',
  sedang: 'sedang',
}

/**
 * National risk radars use DOM/CSS transforms so the pulse stays on the browser
 * compositor and does not invalidate MapLibre paint properties every frame.
 */
export function ProvinceRadarsLayer({ regions }: ProvinceRadarsLayerProps) {
  const { data: catalog } = useRegionCatalog()
  const province = useMapStore((state) => state.province)
  const selectedCode = useMapStore((state) => state.selectedCode)
  const setProvince = useMapStore((state) => state.setProvince)
  const isNational = province === 'Semua' && !selectedCode

  const points = useMemo<RadarPoint[]>(() => {
    if (!isNational || !catalog) return []

    const anchors = new Map(
      provinceLabelAnchors(catalog, regions).map((item) => [item.name, item.center]),
    )

    return aggregateByProvince(regions, catalog.provinces)
      .filter(
        (item) =>
          item.hotspots_24h > 0 &&
          (item.risk_category === 'sangat_tinggi' || item.risk_category === 'sedang'),
      )
      .map((item) => ({
        coordinates: anchors.get(item.name) ?? item.center,
        name: item.name,
        hotspots24h: item.hotspots_24h,
        riskCategory: item.risk_category as Extract<
          RiskCategory,
          'sangat_tinggi' | 'sedang'
        >,
      }))
  }, [catalog, isNational, regions])

  return (
    <>
      {points.map((point) => {
        const high = point.riskCategory === 'sangat_tinggi'
        const color = high
          ? RISK_CATEGORIES.sangat_tinggi.dot
          : RISK_CATEGORIES.sedang.dot
        const style = {
          '--province-radar-color': color,
          '--province-radar-duration': high ? '2.8s' : '3.4s',
          '--province-radar-delay': high ? '-1.4s' : '-1.7s',
        } as CSSProperties

        return (
          <MapMarker
            key={point.name}
            longitude={point.coordinates[0]}
            latitude={point.coordinates[1]}
            anchor="center"
          >
            <MarkerContent className="overflow-visible">
              <button
                type="button"
                aria-label={`Buka ${point.name}: ${point.hotspots24h} titik panas, risiko ${riskLabel[point.riskCategory]}`}
                onClick={() => setProvince(point.name)}
                className={cn(
                  'group relative flex size-11 cursor-pointer items-center justify-center rounded-full',
                  focusRing,
                )}
                style={style}
              >
                <span
                  data-testid="province-radar-ring"
                  className="province-radar-ring"
                  aria-hidden
                />
                <span className="province-radar-core" aria-hidden />
              </button>
            </MarkerContent>
          </MapMarker>
        )
      })}
    </>
  )
}
