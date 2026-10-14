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
import { IndonesiaMapFraming } from '@/components/map/indonesia-map-framing'
import { HotspotHeatmapLayer } from '@/components/map/hotspot-heatmap-layer'
import { ProvinceFocus } from '@/components/map/province-focus'
import { RegionLayers } from '@/components/map/region-layers'
import { SelectedHotspotsLayer } from '@/components/map/selected-hotspots-layer'
import { EarthquakeLayer } from '@/components/map/earthquake-layer'
import { WindParticleLayer } from '@/components/map/wind-particle-layer'
import { TemperatureLayer } from '@/components/map/temperature-layer'
import { UserLocationLayer } from '@/components/map/user-location-layer'
import { Map, useMap, type MapRef } from '@/components/ui/map'
import { useRegionCatalog } from '@/data/queries'
import type { Region } from '@/data/types'
import { copy } from '@/copy/id'
import { getMapPadding, INDONESIA_CENTER } from '@/lib/indonesia-view'
import { isBasemapStyleError, webGlSupported } from '@/lib/map-support'
import { mapChromeClass } from '@/lib/ui-chrome'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

type MapShellProps = {
  mapRef: RefObject<MapRef | null>
  panelOpen: boolean
  regions: Region[]
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
      className={cn(
        mapChromeClass,
        'pointer-events-auto absolute z-30 flex items-center gap-3',
      )}
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
      className={cn(mapChromeClass, 'pointer-events-none absolute z-30')}
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

function MapBasemapListener({ onBasemapError }: { onBasemapError: () => void }) {
  const { map } = useMap()

  useEffect(() => {
    if (!map) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MapLibre ErrorEvent shape
    const handler = (e: any) => {
      if (isBasemapStyleError(e)) onBasemapError()
    }
    map.on('error', handler)
    return () => {
      map.off('error', handler)
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

export function MapShell({ mapRef, panelOpen, regions }: MapShellProps) {
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
      <Map
        key={mountKey}
        ref={mapRef}
        theme="light"
        blank={basemapFailed}
        className="size-full"
        center={INDONESIA_CENTER}
        zoom={4.5}
        attributionControl={false}
        dragRotate={false}
        pitchWithRotate={false}
        loading={!framed}
      >
        <MapBasemapListener onBasemapError={markBasemapFailed} />
        <IndonesiaMapFraming panelOpen={panelOpen} onReady={markFramed} />
        {catalog && <ProvinceFocus provinces={catalog.provinces} />}
        <LayerErrorBoundary name="RegionLayers" onError={markLayerFailed}>
          <RegionLayers regions={regions} />
        </LayerErrorBoundary>
        <LayerErrorBoundary name="HotspotHeatmapLayer" onError={markLayerFailed}>
          <HotspotHeatmapLayer regions={regions} />
        </LayerErrorBoundary>
        <LayerErrorBoundary name="TemperatureLayer" onError={markLayerFailed}>
          <TemperatureLayer regions={regions} />
        </LayerErrorBoundary>
        <LayerErrorBoundary name="SelectedHotspotsLayer" onError={markLayerFailed}>
          <SelectedHotspotsLayer regions={regions} />
        </LayerErrorBoundary>
        <LayerErrorBoundary name="EarthquakeLayer" onError={markLayerFailed}>
          <EarthquakeLayer />
        </LayerErrorBoundary>
        <LayerErrorBoundary name="WindParticleLayer" onError={markLayerFailed}>
          <WindParticleLayer regions={regions} />
        </LayerErrorBoundary>
        <LayerErrorBoundary name="UserLocationLayer" onError={markLayerFailed}>
          <UserLocationLayer />
        </LayerErrorBoundary>
      </Map>
    </div>
  )
}
