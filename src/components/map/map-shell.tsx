import { Map as MapIcon } from 'lucide-react'
import {
  Component,
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type ErrorInfo,
  type ReactNode,
  type RefObject,
} from 'react'
import { Button, EmptyState } from '@/components/common'
import type { Map as MapLibreMap } from 'maplibre-gl'

import { EarthquakeLayer } from '@/components/map/earthquake-layer'
import { TemperatureLayer } from '@/components/map/temperature-layer'
import { WindVectorLayer } from '@/components/map/wind-vector-layer'
import { HotspotHeatmapLayer } from '@/components/map/hotspot-heatmap-layer'
import { IndonesiaMapFraming } from '@/components/map/indonesia-map-framing'
import { MapSoftLoading } from '@/components/map/map-soft-loading'
import { ProvinceChoroplethLayer } from '@/components/map/province-choropleth-layer'
import { ProvinceFocus } from '@/components/map/province-focus'
import { ProvinceLabelsLayer } from '@/components/map/province-labels-layer'
import { ProvinceRadarsLayer } from '@/components/map/province-radars-layer'
import { SelectedHotspotsLayer } from '@/components/map/selected-hotspots-layer'
import { UserLocationLayer } from '@/components/map/user-location-layer'
import { Map, useMap, type MapRef } from '@/components/ui/map'
import { useRegionCatalog } from '@/data/queries'
import type { Region } from '@/data/types'
import { copy } from '@/copy/id'
import { getMapPadding, INDONESIA_CENTER } from '@/lib/indonesia-view'
import { isBasemapStyleError, webGlSupported } from '@/lib/map-support'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

type MapShellProps = {
  mapRef: RefObject<MapRef | null>
  panelOpen: boolean
  regions: Region[]
  weatherRegions?: Region[]
}

function MapUnavailable({ onReload }: { onReload: () => void }) {
  const panelOpen = useUiStore((s) => s.panelOpen)
  const pad = getMapPadding(panelOpen)

  return (
    <div className="bg-map-bg absolute inset-0 z-10" data-testid="map-webgl-fail">
      <div
        className="absolute flex items-center justify-center p-6"
        style={{
          top: pad.top,
          right: pad.right,
          bottom: pad.bottom,
          left: pad.left,
        }}
      >
        <EmptyState
          icon={MapIcon}
          title={copy.empty.mapFail.title}
          description={copy.empty.mapFail.description}
          action={{ label: copy.empty.mapFail.action, onClick: onReload }}
          className="max-w-sm shadow-sm"
        />
      </div>
    </div>
  )
}

function BasemapBanner({ onRetry }: { onRetry: () => void }) {
  const panelOpen = useUiStore((s) => s.panelOpen)
  return (
    <div
      data-testid="map-basemap-banner"
      className="rounded-card border-line bg-surface pointer-events-auto absolute z-30 flex items-center gap-3 border px-3 py-2 shadow-sm"
      style={{
        left: panelOpen ? 432 : 16,
        top: 68,
      }}
    >
      <p className="text-ink text-sm">{copy.empty.basemapFail.title}</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        {copy.empty.basemapFail.action}
      </Button>
    </div>
  )
}

function PartialBanner() {
  const panelOpen = useUiStore((s) => s.panelOpen)
  return (
    <div
      data-testid="map-partial-banner"
      className="rounded-card border-line bg-surface pointer-events-none absolute z-30 border px-3 py-2 shadow-sm"
      style={{
        left: panelOpen ? 432 : 16,
        top: 68,
      }}
      role="status"
    >
      <p className="text-ink text-sm">{copy.empty.mapPartial.title}</p>
    </div>
  )
}

function applyBasemapCleanups(map: MapLibreMap) {
  if (!map || typeof map.getLayer !== 'function') return

  // Keep useful Indonesian labels while removing visual clutter from service paths.
  const minorRoads = [
    'road_service_case',
    'road_service_fill',
    'road_path',
    'tunnel_service_case',
    'tunnel_service_fill',
    'bridge_service_case',
    'bridge_service_fill',
  ]
  for (const id of minorRoads) {
    if (map.getLayer(id)) {
      try {
        map.setLayoutProperty(id, 'visibility', 'none')
      } catch {
        // layer not found or already styled
      }
    }
  }
  const hiddenLabels = [
    'place_continent',
    'place_state',
    'place_city_dot_r7',
    'place_city_dot_r4',
    'place_city_dot_r2',
    'place_city_dot_z7',
    'place_capital_dot_z7',
    'place_town',
    'place_suburbs',
    'place_hamlet',
    'place_villages',
  ]
  for (const id of hiddenLabels) {
    if (map.getLayer(id)) {
      try {
        map.setLayoutProperty(id, 'visibility', 'none')
      } catch {
        // layer not found or already styled
      }
    }
  }

  const placeTextLayers = [
    'place_city',
    'place_city_r6',
    'place_city_r5',
    'place_town',
    'place_suburbs',
    'place_villages',
    'place_hamlet',
    'roadname_major',
    'roadname_pri',
    'roadname_sec',
  ]
  for (const id of placeTextLayers) {
    if (!map.getLayer(id)) continue
    try {
      map.setLayoutProperty(id, 'visibility', 'visible')
      map.setLayoutProperty(id, 'text-field', [
        'coalesce',
        ['get', 'name:id'],
        ['get', 'name'],
      ])
    } catch {
      // layer not found or already styled
    }
  }

  const earlierLabels: Record<string, [number, number]> = {
    place_city_r6: [6, 16],
    place_city_r5: [6, 16],
    place_town: [6, 16],
    place_villages: [7, 16],
    place_suburbs: [8, 16],
    place_hamlet: [9, 16],
    roadname_major: [11, 24],
    roadname_pri: [12, 24],
    roadname_sec: [12, 24],
  }
  for (const [id, [minZoom, maxZoom]] of Object.entries(earlierLabels)) {
    if (!map.getLayer(id)) continue
    try {
      map.setLayerZoomRange(id, minZoom, maxZoom)
    } catch {
      // layer not found or already styled
    }
  }

  for (const id of ['place_country_1', 'place_country_2']) {
    if (map.getLayer(id)) {
      try {
        map.setFilter(id, ['==', 'iso_a2', 'ID'])
        map.setLayoutProperty(id, 'text-field', [
          'coalesce',
          ['get', 'name:id'],
          ['get', 'name'],
        ])
      } catch {
        // layer not found or already styled
      }
    }
  }
}

function MapBasemapListener({ onBasemapError }: { onBasemapError: () => void }) {
  const { map } = useMap()

  useEffect(() => {
    if (!map) return
    const onStyle = () => {
      applyBasemapCleanups(map)
    }
    if (typeof map.isStyleLoaded === 'function' && map.isStyleLoaded()) {
      applyBasemapCleanups(map)
    }
    if (typeof map.on === 'function') {
      map.on('style.load', onStyle)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MapLibre ErrorEvent shape
    const handler = (e: any) => {
      if (isBasemapStyleError(e)) onBasemapError()
    }
    if (typeof map.on === 'function') {
      map.on('error', handler)
    }
    return () => {
      if (typeof map.off === 'function') {
        map.off('style.load', onStyle)
        map.off('error', handler)
      }
    }
  }, [map, onBasemapError])

  return null
}

/** Hides a broken layer; does not unmount the rest of the map. */
export class LayerErrorBoundary extends Component<
  { name: string; children: ReactNode; onError?: () => void },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(`[LayerErrorBoundary:${this.props.name}]`, error, info.componentStack)
    }
    this.props.onError?.()
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

export function MapShell({
  mapRef,
  panelOpen,
  regions,
  weatherRegions = regions,
}: MapShellProps) {
  const { data: catalog } = useRegionCatalog()
  const [noWebGl, setNoWebGl] = useState(() => !webGlSupported())
  const [basemapFailed, setBasemapFailed] = useState(false)
  const [layerFailed, setLayerFailed] = useState(false)
  const [mountKey, setMountKey] = useState(0)
  const [framed, setFramed] = useState(false)

  const markBasemapFailed = useCallback(() => setBasemapFailed(true), [])
  const markLayerFailed = useCallback(() => setLayerFailed(true), [])
  const markFramed = useCallback(() => setFramed(true), [])

  const remount = useCallback(() => {
    const ok = webGlSupported()
    setNoWebGl(!ok)
    setBasemapFailed(false)
    setLayerFailed(false)
    setFramed(false)
    setMountKey((k) => k + 1)
  }, [])

  if (noWebGl) {
    return <MapUnavailable onReload={remount} />
  }

  const pad = getMapPadding(panelOpen)

  return (
    <div
      className="relative size-full"
      style={
        {
          '--map-pad-top': `${pad.top}px`,
          '--map-pad-right': `${pad.right}px`,
          '--map-pad-bottom': `${pad.bottom}px`,
          '--map-pad-left': `${pad.left}px`,
        } as CSSProperties
      }
    >
      {basemapFailed && <BasemapBanner onRetry={remount} />}
      {!basemapFailed && layerFailed && <PartialBanner />}
      {!framed && (
        <div className="pointer-events-none absolute inset-0 z-20">
          <MapSoftLoading />
        </div>
      )}
      <Map
        key={mountKey}
        ref={mapRef}
        theme="light"
        blank={basemapFailed}
        className={cn(
          'ease-out-soft size-full transition-opacity duration-300',
          framed ? 'opacity-100' : 'opacity-0',
        )}
        center={INDONESIA_CENTER}
        zoom={4.5}
        attributionControl={false}
        boxZoom={false}
        cooperativeGestures={false}
        doubleClickZoom
        dragPan
        dragRotate={false}
        pitchWithRotate={false}
        scrollZoom
        touchPitch={false}
        touchZoomRotate
        loading={false}
      >
        <MapBasemapListener onBasemapError={markBasemapFailed} />
        <IndonesiaMapFraming panelOpen={panelOpen} onReady={markFramed} />
        {catalog && <ProvinceFocus provinces={catalog.provinces} />}
        <LayerErrorBoundary name="ProvinceChoroplethLayer" onError={markLayerFailed}>
          <ProvinceChoroplethLayer regions={regions} />
        </LayerErrorBoundary>
        <LayerErrorBoundary name="ProvinceLabelsLayer" onError={markLayerFailed}>
          <ProvinceLabelsLayer regions={regions} />
        </LayerErrorBoundary>
        <LayerErrorBoundary name="ProvinceRadarsLayer" onError={markLayerFailed}>
          <ProvinceRadarsLayer regions={regions} />
        </LayerErrorBoundary>
        <LayerErrorBoundary name="HotspotHeatmapLayer" onError={markLayerFailed}>
          <HotspotHeatmapLayer regions={regions} />
        </LayerErrorBoundary>
        <LayerErrorBoundary name="SelectedHotspotsLayer" onError={markLayerFailed}>
          <SelectedHotspotsLayer regions={regions} />
        </LayerErrorBoundary>
        <LayerErrorBoundary name="EarthquakeLayer" onError={markLayerFailed}>
          <EarthquakeLayer />
        </LayerErrorBoundary>
        <LayerErrorBoundary name="TemperatureLayer" onError={markLayerFailed}>
          <TemperatureLayer regions={weatherRegions} />
        </LayerErrorBoundary>
        <LayerErrorBoundary name="WindVectorLayer" onError={markLayerFailed}>
          <WindVectorLayer />
        </LayerErrorBoundary>
        <LayerErrorBoundary name="UserLocationLayer" onError={markLayerFailed}>
          <UserLocationLayer />
        </LayerErrorBoundary>
      </Map>
    </div>
  )
}
