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

import { HotspotHeatmapLayer } from '@/components/map/hotspot-heatmap-layer'
import { IndonesiaMapFraming } from '@/components/map/indonesia-map-framing'
import { ProvinceChoroplethLayer } from '@/components/map/province-choropleth-layer'
import { ProvinceFocus } from '@/components/map/province-focus'
import { ProvinceLabelsLayer } from '@/components/map/province-labels-layer'
import { ProvincePinsLayer } from '@/components/map/province-pins-layer'
import { RegionLayers } from '@/components/map/region-layers'
import { SelectedHotspotsLayer } from '@/components/map/selected-hotspots-layer'
import { UserLocationLayer } from '@/components/map/user-location-layer'
import { Map, useMap, type MapRef } from '@/components/ui/map'
import { useRegionCatalog } from '@/data/queries'
import type { Region } from '@/data/types'
import { getCopy } from '@/copy'
import { getMapPadding, INDONESIA_CENTER } from '@/lib/indonesia-view'
import { useMapChrome } from '@/lib/layout'
import { isBasemapStyleError, webGlSupported } from '@/lib/map-support'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

type MapShellProps = {
  mapRef: RefObject<MapRef | null>
  panelOpen: boolean
  regions: Region[]
  /** false sementara /v1/regions pending — satu SoftLoading sampai framing + data siap. */
  dataReady?: boolean
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
          title={getCopy().empty.mapFail.title}
          description={getCopy().empty.mapFail.description}
          action={{ label: getCopy().empty.mapFail.action, onClick: onReload }}
          className="max-w-sm"
        />
      </div>
    </div>
  )
}

function BasemapBanner({ onRetry }: { onRetry: () => void }) {
  const panelOpen = useUiStore((s) => s.panelOpen)
  const { left } = useMapChrome(panelOpen)
  return (
    <div
      data-testid="map-basemap-banner"
      className="rounded-card border-line bg-surface-muted pointer-events-auto absolute z-30 flex max-w-[min(360px,calc(100vw-2rem))] items-center gap-3 border px-4 py-3"
      style={{
        left,
        top: 68,
      }}
    >
      <p className="text-ink min-w-0 flex-1 text-sm leading-5">
        {getCopy().empty.basemapFail.title}
      </p>
      <Button variant="secondary" size="sm" className="shrink-0" onClick={onRetry}>
        {getCopy().empty.basemapFail.action}
      </Button>
    </div>
  )
}

function PartialBanner() {
  const panelOpen = useUiStore((s) => s.panelOpen)
  const { left } = useMapChrome(panelOpen)
  return (
    <div
      data-testid="map-partial-banner"
      className="rounded-card border-line bg-surface-muted pointer-events-none absolute z-30 max-w-[min(360px,calc(100vw-2rem))] border px-4 py-3"
      style={{
        left,
        top: 68,
      }}
      role="status"
    >
      <p className="text-ink text-sm leading-5">{getCopy().empty.mapPartial.title}</p>
    </div>
  )
}

function applyBasemapCleanups(map: MapLibreMap) {
  if (!map || typeof map.getLayer !== 'function') return

  // Rapikan basemap: sembunyikan hanya jalur pejalan/servis yang berisik.
  // Nama kota, desa, dan jalan tetap terlihat (sebelumnya di-hide semua).
  const clutterRoads = [
    'road_path',
    'tunnel_path',
    'bridge_path',
    'road_service_case',
    'road_service_fill',
    'tunnel_service_case',
    'tunnel_service_fill',
    'bridge_service_case',
    'bridge_service_fill',
  ]
  for (const id of clutterRoads) {
    if (map.getLayer(id)) {
      try {
        map.setLayoutProperty(id, 'visibility', 'none')
      } catch {
        // layer not found or already styled
      }
    }
  }

  // County Positron terlalu ramai; boundary_state tetap (fill choropleth di bawahnya).
  if (map.getLayer('boundary_county')) {
    try {
      map.setLayoutProperty('boundary_county', 'visibility', 'none')
    } catch {
      // layer not found
    }
  }

  // Benua saja yang disembunyikan; negara difilter ke Indonesia + prefer name:id.
  if (map.getLayer('place_continent')) {
    try {
      map.setLayoutProperty('place_continent', 'visibility', 'none')
    } catch {
      // layer already styled
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

  // Prefer label Indonesia + turunkan minzoom agar nama daerah
  // sudah terbaca di zoom provinsi (default Carto: desa 10+, jalan 13–16).
  const placeTextLayers = [
    'place_state',
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
    'roadname_minor',
  ]
  for (const id of placeTextLayers) {
    if (!map.getLayer(id)) continue
    try {
      map.setLayoutProperty(id, 'text-field', [
        'coalesce',
        ['get', 'name:id'],
        ['get', 'name'],
      ])
    } catch {
      // layer tidak mendukung text-field
    }
  }

  const earlierLabels: Record<string, [number, number]> = {
    place_state: [4, 12],
    place_city_r6: [6, 16],
    place_city_r5: [6, 16],
    place_town: [6, 16],
    place_villages: [7, 16],
    place_suburbs: [8, 16],
    place_hamlet: [9, 16],
    roadname_major: [11, 24],
    roadname_pri: [12, 24],
    roadname_sec: [12, 24],
    roadname_minor: [13, 24],
  }
  for (const [id, [minZ, maxZ]] of Object.entries(earlierLabels)) {
    if (!map.getLayer(id)) continue
    try {
      map.setLayerZoomRange(id, minZ, maxZ)
    } catch {
      // layer tidak mendukung zoom range
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
    const handler = (e: unknown) => {
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
  { hasError: boolean; retry: number }
> {
  state = { hasError: false, retry: 0 }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(`[LayerErrorBoundary:${this.props.name}]`, error, info.componentStack)
    }
    this.props.onError?.()
    // Satu kali pulih otomatis — heatmap/layer sering gagal sementara saat style HMR.
    if (this.state.retry < 1) {
      window.setTimeout(() => {
        this.setState((s) => ({ hasError: false, retry: s.retry + 1 }))
      }, 0)
    }
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
  dataReady = true,
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

  const pad = getMapPadding(panelOpen)
  const mapReady = !noWebGl && framed && dataReady
  const setBootDone = useUiStore((s) => s.setBootDone)

  // Satu overlay boot di AccessGate — sync selesai di sini (juga lepas saat WebGL gagal).
  useEffect(() => {
    setBootDone(noWebGl || mapReady)
  }, [noWebGl, mapReady, setBootDone])

  if (noWebGl) {
    return <MapUnavailable onReload={remount} />
  }

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
      <Map
        key={mountKey}
        ref={mapRef}
        theme="light"
        blank={basemapFailed}
        className={cn(
          'ease-out-soft size-full transition-opacity duration-300',
          mapReady ? 'opacity-100' : 'opacity-0',
        )}
        center={INDONESIA_CENTER}
        zoom={4.5}
        attributionControl={false}
        dragRotate={false}
        pitchWithRotate={false}
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
        <LayerErrorBoundary name="ProvincePinsLayer" onError={markLayerFailed}>
          <ProvincePinsLayer regions={regions} />
        </LayerErrorBoundary>
        <LayerErrorBoundary name="RegionLayers" onError={markLayerFailed}>
          <RegionLayers regions={regions} />
        </LayerErrorBoundary>
        <LayerErrorBoundary name="HotspotHeatmapLayer" onError={markLayerFailed}>
          <HotspotHeatmapLayer regions={regions} />
        </LayerErrorBoundary>
        <LayerErrorBoundary name="SelectedHotspotsLayer" onError={markLayerFailed}>
          <SelectedHotspotsLayer regions={regions} />
        </LayerErrorBoundary>
        <LayerErrorBoundary name="UserLocationLayer" onError={markLayerFailed}>
          <UserLocationLayer />
        </LayerErrorBoundary>
      </Map>
    </div>
  )
}
