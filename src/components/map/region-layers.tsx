import { useEffect, useMemo, useState } from 'react'
import Supercluster from 'supercluster'

import { RegionPin } from '@/components/map/region-pin'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import type { Region } from '@/data/types'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { highestRiskCategory, RISK_CATEGORIES, withAlpha } from '@/lib/risk-category'

type PointProps = { region: Region }

type RegionLayersProps = {
  regions: Region[]
}

export function RegionLayers({ regions }: RegionLayersProps) {
  const { map } = useMap()
  const reducedMotion = usePrefersReducedMotion()
  const [zoom, setZoom] = useState(0)
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null)

  const index = useMemo(() => {
    const sc = new Supercluster<PointProps>({
      radius: 56,
      maxZoom: 12,
    })
    sc.load(
      regions.map((region) => ({
        type: 'Feature' as const,
        properties: { region },
        geometry: {
          type: 'Point' as const,
          coordinates: [...region.pusat] as [number, number],
        },
      })),
    )
    return sc
  }, [regions])

  useEffect(() => {
    if (!map) return

    const sync = () => {
      const b = map.getBounds()
      setZoom(map.getZoom())
      setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()])
    }

    sync()
    map.on('moveend', sync)
    map.on('zoomend', sync)
    return () => {
      map.off('moveend', sync)
      map.off('zoomend', sync)
    }
  }, [map])

  const features = useMemo(() => {
    if (!bounds) return []
    return index.getClusters(bounds, Math.round(zoom))
  }, [index, bounds, zoom])

  return (
    <>
      {features.map((feature) => {
        const [lon, lat] = feature.geometry.coordinates as [number, number]
        const props = feature.properties

        if (props && 'cluster' in props && props.cluster) {
          const clusterId = props.cluster_id as number
          const count = props.point_count as number
          const leaves = index.getLeaves(clusterId, Infinity)
          const top = highestRiskCategory(leaves.map((l) => l.properties.region.kategori))
          const color = RISK_CATEGORIES[top].dot
          const size = 40 + 6 * count

          return (
            <MapMarker
              key={`cluster-${clusterId}`}
              longitude={lon}
              latitude={lat}
              anchor="center"
              onClick={(e) => {
                e.stopPropagation()
                const nextZoom = index.getClusterExpansionZoom(clusterId)
                map?.easeTo({
                  center: [lon, lat],
                  zoom: nextZoom,
                  duration: reducedMotion ? 0 : 600,
                })
              }}
            >
              <MarkerContent className="relative z-[12] flex items-center justify-center">
                <span
                  aria-hidden
                  className="absolute rounded-full"
                  style={{
                    width: size + 12,
                    height: size + 12,
                    backgroundColor: withAlpha(color, 0.18),
                  }}
                />
                <span
                  className="relative flex items-center justify-center rounded-full border-[3px] border-white font-mono text-base leading-none font-semibold text-white shadow-map"
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: color,
                  }}
                >
                  {count}
                </span>
              </MarkerContent>
            </MapMarker>
          )
        }

        const region = (props as PointProps).region
        return <RegionPin key={region.kode} region={region} />
      })}
    </>
  )
}
