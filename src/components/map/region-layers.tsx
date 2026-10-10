import { useEffect, useMemo, useState } from 'react'
import Supercluster from 'supercluster'

import { focusRing } from '@/components/common/focus-ring'
import { RegionPin } from '@/components/map/region-pin'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import type { Region } from '@/data/types'
import { AREA_MIN_ZOOM } from '@/lib/hotspot-areas'
import { getMapPadding } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { highestRiskCategory, RISK_CATEGORIES, withAlpha } from '@/lib/risk-category'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

type PointProps = { region: Region }

type RegionLayersProps = {
  regions: Region[]
}

type ClusterMarkerProps = {
  lon: number
  lat: number
  count: number
  color: string
  onExpand: () => void
}

function ClusterMarker({ lon, lat, count, color, onExpand }: ClusterMarkerProps) {
  const [hovered, setHovered] = useState(false)
  const size = 40 + 6 * count

  return (
    <MapMarker longitude={lon} latitude={lat} anchor="center">
      <MarkerContent className="relative z-[12] flex items-center justify-center">
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-full transition-[background-color] duration-150 ease-in-out"
          style={{
            width: size + 12,
            height: size + 12,
            backgroundColor: withAlpha(color, hovered ? 0.3 : 0.18),
          }}
        />
        <button
          type="button"
          className={cn(
            'relative flex items-center justify-center rounded-full border-[3px] border-surface font-mono text-base leading-6 font-semibold text-surface shadow-map',
            focusRing,
          )}
          style={{
            width: size,
            height: size,
            backgroundColor: color,
          }}
          aria-label={`${count} wilayah, klik untuk memperbesar`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={(e) => {
            e.stopPropagation()
            onExpand()
          }}
        >
          {count}
        </button>
      </MarkerContent>
    </MapMarker>
  )
}

export function RegionLayers({ regions }: RegionLayersProps) {
  const { map } = useMap()
  const panelOpen = useUiStore((s) => s.panelOpen)
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

          return (
            <ClusterMarker
              key={`cluster-${clusterId}`}
              lon={lon}
              lat={lat}
              count={count}
              color={color}
              onExpand={() => {
                const nextZoom = index.getClusterExpansionZoom(clusterId)
                map?.easeTo({
                  center: [lon, lat],
                  zoom: nextZoom,
                  padding: getMapPadding(panelOpen),
                  duration: reducedMotion ? 0 : 600,
                })
              }}
            />
          )
        }

        const region = (props as PointProps).region
        return (
          <RegionPin
            key={region.kode}
            region={region}
            showHalo={zoom < AREA_MIN_ZOOM}
          />
        )
      })}
    </>
  )
}
