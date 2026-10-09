import { Map as MapIcon } from 'lucide-react'
import {
  Component,
  useCallback,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
  type RefObject,
} from 'react'
import { EmptyState } from '@/components/common'
import { IndonesiaMapFraming } from '@/components/map/indonesia-map-framing'
import { RegionLayers } from '@/components/map/region-layers'
import { UserLocationLayer } from '@/components/map/user-location-layer'
import { Map, useMap, type MapRef } from '@/components/ui/map'
import type { Region } from '@/data/types'
import { copy } from '@/copy/id'
import { INDONESIA_CENTER } from '@/lib/indonesia-view'

type MapShellProps = {
  mapRef: RefObject<MapRef | null>
  panelOpen: boolean
  regions: Region[]
}

function webGlSupported(): boolean {
  if (typeof document === 'undefined') return true
  try {
    const canvas = document.createElement('canvas')
    return !!(
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    )
  } catch {
    return false
  }
}

function MapUnavailable({ onReload }: { onReload: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-map-bg p-6">
      <EmptyState
        icon={MapIcon}
        title={copy.empty.mapFail.title}
        description={copy.empty.mapFail.description}
        action={{ label: copy.empty.mapFail.action, onClick: onReload }}
        className="max-w-sm shadow-sm"
      />
    </div>
  )
}

function MapErrorListener({ onError }: { onError: () => void }) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map) return
    const handler = () => onError()
    map.on('error', handler)
    return () => {
      map.off('error', handler)
    }
  }, [map, onError])

  useEffect(() => {
    if (!map || !isLoaded) return
    // Tile/source errors after load still fire 'error'; style never loading is covered by boundary.
  }, [map, isLoaded])

  return null
}

class MapErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onError()
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

export function MapShell({ mapRef, panelOpen, regions }: MapShellProps) {
  const [failed, setFailed] = useState(() => !webGlSupported())
  const [mountKey, setMountKey] = useState(0)

  const markFailed = useCallback(() => setFailed(true), [])
  const reload = useCallback(() => {
    setFailed(!webGlSupported())
    setMountKey((k) => k + 1)
  }, [])

  if (failed) {
    return <MapUnavailable onReload={reload} />
  }

  return (
    <MapErrorBoundary
      key={mountKey}
      onError={markFailed}
    >
      <Map
        ref={mapRef}
        theme="light"
        className="size-full"
        center={INDONESIA_CENTER}
        zoom={4.5}
        attributionControl={false}
        dragRotate={false}
        pitchWithRotate={false}
      >
        <MapErrorListener onError={markFailed} />
        <IndonesiaMapFraming panelOpen={panelOpen} />
        <RegionLayers regions={regions} />
        <UserLocationLayer />
      </Map>
    </MapErrorBoundary>
  )
}
